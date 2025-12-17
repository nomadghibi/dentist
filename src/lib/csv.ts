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
  data: T[],
  headers: (keyof T)[]
): string {
  if (data.length === 0) {
    return headers.map(escapeCSVValue).join(",") + "\n";
  }

  const lines: string[] = [];

  // Header row
  lines.push(headers.map(escapeCSVValue).join(","));

  // Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      
      // Handle array values (like hours)
      if (Array.isArray(value)) {
        return escapeCSVValue(value.join("; "));
      }
      
      return escapeCSVValue(value);
    });
    
    lines.push(values.join(","));
  }

  return lines.join("\n");
}

