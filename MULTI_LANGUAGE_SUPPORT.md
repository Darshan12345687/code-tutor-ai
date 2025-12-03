# Multi-Language Code Execution Support

## Supported Languages

The Code Tutor now supports execution of multiple programming languages:

1. **Python** 🐍
   - Docker: `python:3.11-slim`
   - Local: `python3`
   - File: `main.py`

2. **Java** ☕
   - Docker: `openjdk:17-slim`
   - Local: `javac` + `java`
   - File: `Main.java`
   - Compilation: Automatic

3. **C** ⚙️
   - Docker: `gcc:latest`
   - Local: `gcc`
   - File: `main.c`
   - Compilation: Automatic

4. **C++** ⚡
   - Docker: `gcc:latest`
   - Local: `g++`
   - File: `main.cpp`
   - Compilation: Automatic

5. **C#** 🎯
   - Docker: `mcr.microsoft.com/dotnet/sdk:8.0`
   - Local: `dotnet`
   - File: `Program.cs`
   - Auto-wraps code in Program class if needed

6. **JavaScript** 📜
   - Docker: `node:18-slim`
   - Local: `node`
   - File: `main.js`

## Layout Changes

### New Layout Structure
- **Code Editor** (Left) - Full code editing interface
- **Output Panel** (Right) - Real-time execution results
- **Explanation Panel** (Below) - AI-powered code explanations
- **Voice Assistant** (Below) - Voice interaction
- **Interactive Terminal** (Bottom) - Command-line interface

## Language Detection

The system automatically:
1. Detects the selected language from the Language Selector
2. Routes code to the appropriate execution engine
3. Uses Docker sandbox when available (more secure)
4. Falls back to local execution if Docker is unavailable

## Execution Flow

```
User selects language → Code written → Run Code clicked
    ↓
Language detected → Appropriate compiler/interpreter selected
    ↓
Code executed (Docker or Local)
    ↓
Output displayed in Output Panel (next to editor)
```

## Security

- All code execution is sandboxed when Docker is available
- Network access disabled in Docker containers
- Memory and CPU limits enforced
- Timeout protection (10 seconds default)

## Requirements

### For Docker Execution (Recommended)
- Docker installed and running
- Appropriate language images pulled

### For Local Execution (Fallback)
- Python 3.x
- Java JDK (for Java)
- GCC (for C/C++)
- .NET SDK (for C#)
- Node.js (for JavaScript)

## API Endpoint

```
POST /api/code/execute
Body: {
  "code": "your code here",
  "language": "python|java|c|cpp|csharp|javascript",
  "useSandbox": true/false (optional)
}
```

## Error Handling

- Invalid language: Returns 400 with supported languages list
- Execution timeout: Returns error message
- Compilation errors: Displayed in Output Panel
- Runtime errors: Displayed in Output Panel






