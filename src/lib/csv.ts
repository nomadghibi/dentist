/**
 * Simple CSV writer without external dependencies
 */

export function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

export function writeCSV<T extends Record<string, unknown>>(
  rows: T[],
  headers: Array<keyof T | string>
): string {
  const headerStrings = headers.map(String);

  const escape = (value: unknown) => {
    if (value === null || value === undefined) return "";
    const s = String(value);
    const needsQuotes = /[",\n\r]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const lines: string[] = [];
  lines.push(headerStrings.join(","));

  for (const row of rows) {
    const line = headerStrings.map((h) => escape((row as any)[h]));
    lines.push(line.join(","));
  }

  return lines.join("\n") + "\n";
}

