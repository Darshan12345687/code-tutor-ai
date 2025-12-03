import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import Docker from 'dockerode';

const execAsync = promisify(exec);
const docker = new Docker();

/**
 * Execute code in a Docker sandbox for security
 */
// Language configuration
const languageConfig = {
  python: {
    image: 'python:3.11-slim',
    fileName: 'main.py',
    command: ['python', 'main.py'],
    extension: 'py'
  },
  java: {
    image: 'openjdk:17-slim',
    fileName: 'Main.java',
    command: ['sh', '-c', 'javac Main.java && java Main'],
    extension: 'java'
  },
  c: {
    image: 'gcc:latest',
    fileName: 'main.c',
    command: ['sh', '-c', 'gcc main.c -o main && ./main'],
    extension: 'c'
  },
  cpp: {
    image: 'gcc:latest',
    fileName: 'main.cpp',
    command: ['sh', '-c', 'g++ main.cpp -o main && ./main'],
    extension: 'cpp'
  },
  csharp: {
    image: 'mcr.microsoft.com/dotnet/sdk:8.0',
    fileName: 'Program.cs',
    command: ['sh', '-c', 'dotnet new console -n app --force && cp Program.cs app/ && cd app && dotnet run'],
    extension: 'cs'
  },
  javascript: {
    image: 'node:18-slim',
    fileName: 'main.js',
    command: ['node', 'main.js'],
    extension: 'js'
  }
};

export const executeCodeInSandbox = async (code, language = 'python', options = {}) => {
  const {
    timeout = 10000,
    memoryLimit = '128m',
    cpuLimit = '0.5'
  } = options;

  const langConfig = languageConfig[language] || languageConfig.python;

  try {
    // Create a temporary directory for the code
    const tempDir = join(tmpdir(), `sandbox_${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    const filePath = join(tempDir, langConfig.fileName);
    await writeFile(filePath, code);

    // Execute in Docker container
    const container = await docker.createContainer({
      Image: langConfig.image,
      Cmd: langConfig.command,
      WorkingDir: '/app',
      HostConfig: {
        Memory: 128 * 1024 * 1024, // 128MB
        CpuQuota: 50000, // 0.5 CPU
        NetworkMode: 'none', // No network access
        Binds: [`${tempDir}:/app:ro`] // Read-only mount
      },
      AttachStdout: true,
      AttachStderr: true
    });

    await container.start();

    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true
    });

    let output = '';
    let error = '';

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(async () => {
        try {
          await container.stop();
          await container.remove();
          resolve({
            output: '',
            error: 'Execution timed out',
            executionTime: timeout / 1000
          });
        } catch (err) {
          resolve({
            output: '',
            error: 'Execution timed out',
            executionTime: timeout / 1000
          });
        }
      }, timeout);

      stream.on('data', (chunk) => {
        output += chunk.toString();
      });

      container.wait((err, data) => {
        clearTimeout(timeoutId);
        
        if (err) {
          error = err.message;
        }

        container.logs({
          stdout: true,
          stderr: true
        }, (err, logs) => {
          if (logs) {
            const logOutput = logs.toString();
            if (data.StatusCode !== 0) {
              error = logOutput;
            } else {
              output = logOutput;
            }
          }

          container.remove(() => {
            resolve({
              output: output.trim(),
              error: error ? error.trim() : null,
              executionTime: 0 // Docker execution time tracking would need more setup
            });
          });
        });
      });
    });
  } catch (error) {
    // Fallback to local execution if Docker is not available
    return executeCodeLocally(code, language, timeout);
  }
};

/**
 * Execute code locally (fallback)
 */
export const executeCodeLocally = async (code, language = 'python', timeout = 10000) => {
  const langConfig = languageConfig[language] || languageConfig.python;
  const tempFile = join(tmpdir(), `code_${Date.now()}.${langConfig.extension}`);
  
  try {
    await writeFile(tempFile, code);
    
    const startTime = Date.now();
    let command;
    
    switch (language) {
      case 'python':
        command = `python3 "${tempFile}"`;
        break;
      case 'java':
        const javaDir = join(tmpdir(), `java_${Date.now()}`);
        await mkdir(javaDir, { recursive: true });
        const javaFile = join(javaDir, 'Main.java');
        await writeFile(javaFile, code);
        command = `cd "${javaDir}" && javac Main.java && java Main`;
        break;
      case 'c':
        const cDir = join(tmpdir(), `c_${Date.now()}`);
        await mkdir(cDir, { recursive: true });
        const cFile = join(cDir, 'main.c');
        await writeFile(cFile, code);
        command = `cd "${cDir}" && gcc main.c -o main && ./main`;
        break;
      case 'cpp':
        const cppDir = join(tmpdir(), `cpp_${Date.now()}`);
        await mkdir(cppDir, { recursive: true });
        const cppFile = join(cppDir, 'main.cpp');
        await writeFile(cppFile, code);
        command = `cd "${cppDir}" && g++ main.cpp -o main && ./main`;
        break;
      case 'csharp':
        // C# requires a project structure, so we'll use a simple approach
        const csDir = join(tmpdir(), `csharp_${Date.now()}`);
        await mkdir(csDir, { recursive: true });
        const csFile = join(csDir, 'Program.cs');
        // Wrap code in a basic Program class if needed
        const csCode = code.includes('class Program') || code.includes('namespace') 
          ? code 
          : `using System;\n\nclass Program {\n    static void Main(string[] args) {\n${code.split('\n').map(line => '        ' + line).join('\n')}\n    }\n}`;
        await writeFile(csFile, csCode);
        command = `cd "${csDir}" && dotnet new console -n app --force && cp Program.cs app/ && cd app && dotnet run --no-restore`;
        break;
      case 'javascript':
        command = `node "${tempFile}"`;
        break;
      default:
        command = `python3 "${tempFile}"`;
    }
    
    const { stdout, stderr } = await execAsync(command, {
      timeout,
      maxBuffer: 1024 * 1024 * 10
    });
    
    const executionTime = (Date.now() - startTime) / 1000;
    
    // Cleanup
    try {
      await unlink(tempFile);
      if (language === 'java' || language === 'c' || language === 'cpp') {
        // Cleanup compiled files
        const dir = language === 'java' ? join(tmpdir(), `java_${Date.now()}`) :
                   language === 'c' ? join(tmpdir(), `c_${Date.now()}`) :
                   join(tmpdir(), `cpp_${Date.now()}`);
        // Note: Full cleanup would require recursive directory removal
      }
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    return {
      output: stdout || '',
      error: stderr || null,
      executionTime: parseFloat(executionTime.toFixed(3))
    };
  } catch (error) {
    try {
      await unlink(tempFile);
    } catch {}

    return {
      output: '',
      error: error.message || 'Execution failed',
      executionTime: 0
    };
  }
};

/**
 * Create interactive terminal session
 */
export const createTerminalSession = async (language = 'python') => {
  // This would typically use node-pty for interactive terminals
  // For now, return a session ID that can be used with WebSocket
  const sessionId = `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    sessionId,
    language,
    createdAt: new Date()
  };
};

