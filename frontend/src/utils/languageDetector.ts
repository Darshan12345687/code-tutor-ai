/**
 * Detect programming language from code
 */
export const detectLanguage = (code: string): string | null => {
  if (!code || code.trim().length === 0) {
    return null;
  }

  const codeLower = code.toLowerCase().trim();

  // Java detection
  if (
    codeLower.includes('public class') ||
    codeLower.includes('public static void main') ||
    codeLower.includes('system.out.println') ||
    codeLower.includes('system.out.print') ||
    codeLower.includes('import java.') ||
    codeLower.includes('@override') ||
    (codeLower.includes('class ') && codeLower.includes('{') && !codeLower.includes('def ') && !codeLower.includes('function'))
  ) {
    return 'java';
  }

  // Python detection
  if (
    codeLower.includes('def ') ||
    codeLower.includes('import ') && (codeLower.includes('print(') || codeLower.includes('print ')) ||
    codeLower.includes('if __name__') ||
    codeLower.includes('elif ') ||
    codeLower.includes('lambda ') ||
    codeLower.includes('list(') && codeLower.includes('range(') ||
    (codeLower.includes('print(') && !codeLower.includes('system.out'))
  ) {
    return 'python';
  }

  // C detection
  if (
    codeLower.includes('#include') ||
    codeLower.includes('int main(') ||
    codeLower.includes('printf(') ||
    codeLower.includes('scanf(') ||
    codeLower.includes('return 0;')
  ) {
    return 'c';
  }

  // C++ detection
  if (
    codeLower.includes('#include <iostream>') ||
    codeLower.includes('using namespace std') ||
    codeLower.includes('cout <<') ||
    codeLower.includes('cin >>') ||
    codeLower.includes('std::') ||
    (codeLower.includes('#include') && codeLower.includes('namespace'))
  ) {
    return 'cpp';
  }

  // C# detection
  if (
    codeLower.includes('using system') ||
    codeLower.includes('namespace ') ||
    codeLower.includes('console.writeline') ||
    codeLower.includes('console.readline') ||
    codeLower.includes('public class') && codeLower.includes('static void main')
  ) {
    return 'csharp';
  }

  // JavaScript detection
  if (
    codeLower.includes('function ') ||
    codeLower.includes('const ') ||
    codeLower.includes('let ') ||
    codeLower.includes('var ') ||
    codeLower.includes('console.log') ||
    codeLower.includes('=>') ||
    codeLower.includes('document.') ||
    codeLower.includes('require(') ||
    codeLower.includes('module.exports')
  ) {
    return 'javascript';
  }

  return null;
};

/**
 * Get language name from ID
 */
export const getLanguageName = (langId: string): string => {
  const names: { [key: string]: string } = {
    python: 'Python',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    csharp: 'C#',
    javascript: 'JavaScript'
  };
  return names[langId] || langId;
};






