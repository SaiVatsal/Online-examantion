// Security Utility for ExamFlow: Anti-SQL-Injection & Input Sanitization
// Defends against SQL Injection vectors (Tautologies, Union-based, Piggybacked, Blind SQLi)

export interface SqlInjectionCheckResult {
  hasSqlInjection: boolean;
  threatType?: string;
  matchedPattern?: string;
  sanitized: string;
}

// Common SQL Injection patterns
const SQLI_PATTERNS: { name: string; regex: RegExp }[] = [
  {
    name: 'Boolean Tautology / Inline Condition',
    regex: /('\s*(or|and)\s*['"]?[\w\d]+['"]?\s*=\s*['"]?[\w\d]+)|(\b(or|and)\b\s+\d+\s*=\s*\d+)/i,
  },
  {
    name: 'Union Based Exploitation',
    regex: /\bunion\s+(all\s+)?select\b/i,
  },
  {
    name: 'Comment Truncation Attack',
    regex: /(--|#|\/\*|\*\/)/,
  },
  {
    name: 'Piggybacked Command / Stacked Query',
    regex: /;\s*(drop|alter|delete|update|insert|exec|truncate)\b/i,
  },
  {
    name: 'Dangerous SQL Keywords',
    regex: /\b(exec(\s|\+)+(s|x)p\w+|sp_executesql|information_schema|waitfor\s+delay)\b/i,
  },
  {
    name: 'Malicious Quote Escapes',
    regex: /('|\")\s*(\b(or|and)\b|;)/i,
  },
];

/**
 * Checks if a string contains known SQL injection patterns
 */
export function detectSqlInjection(input: string): SqlInjectionCheckResult {
  if (!input || typeof input !== 'string') {
    return { hasSqlInjection: false, sanitized: '' };
  }

  const trimmed = input.trim();

  for (const { name, regex } of SQLI_PATTERNS) {
    const match = trimmed.match(regex);
    if (match) {
      return {
        hasSqlInjection: true,
        threatType: name,
        matchedPattern: match[0],
        sanitized: sanitizeInput(trimmed),
      };
    }
  }

  return {
    hasSqlInjection: false,
    sanitized: sanitizeInput(trimmed),
  };
}

/**
 * Strips dangerous SQL control characters and delimiters, keeping safe alphanumeric & email chars
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/['";\\]/g, '') // strip single/double quotes, semicolons, backslashes
    .replace(/--/g, '') // strip comment dashes
    .replace(/\/\*[\s\S]*?\*\//g, '') // strip multi-line comments
    .trim();
}

/**
 * Validates whether an email/identifier is clean and safe for query execution
 */
export function validateSafeIdentifier(input: string): { isValid: boolean; error?: string } {
  const check = detectSqlInjection(input);
  if (check.hasSqlInjection) {
    return {
      isValid: false,
      error: `SQL Injection pattern detected (${check.threatType}: "${check.matchedPattern}"). Input blocked by security filter.`,
    };
  }
  return { isValid: true };
}
