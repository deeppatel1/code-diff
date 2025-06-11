const languages = [
  'bash', 'cpp', 'css', 'dockerfile', 'go',
  'html', 'java', 'javascript', 'json', 'makefile',
  'markdown', 'python', 'sql', 'typescript', 'yaml'
];

export default function detectLanguage(code) {
  const trimmed = code.trim();
  if (!trimmed) return 'plaintext';
  if (trimmed.startsWith('#!')) return 'bash';
  if (/^import\s.+from\s['"]react['"]/.test(trimmed)) return 'javascript';
  if (trimmed.startsWith('<')) return 'html';
  if (trimmed.startsWith('package ') || trimmed.includes('public class')) return 'java';
  if (trimmed.startsWith('def ') || trimmed.includes('import ') && trimmed.includes(':')) return 'python';
  try {
    JSON.parse(code);
    return 'json';
  } catch {}
  return 'plaintext';
}