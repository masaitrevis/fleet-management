type QueryValue = string | number | boolean | Date | null | undefined | (string | number)[];

export interface ParsedQueryParams {
  [key: string]: QueryValue;
}

export function parseQueryParams(searchParams: URLSearchParams): ParsedQueryParams {
  const result: ParsedQueryParams = {};

  for (const [key, value] of searchParams.entries()) {
    if (result[key] !== undefined) {
      // Handle multiple values as array
      const existing = result[key];
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        result[key] = [existing as string | number, value];
      }
      continue;
    }

    // Try to parse types
    if (value === 'true') {
      result[key] = true;
    } else if (value === 'false') {
      result[key] = false;
    } else if (value === 'null') {
      result[key] = null;
    } else if (/^\d+$/.test(value)) {
      result[key] = parseInt(value, 10);
    } else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        result[key] = date;
      } else {
        result[key] = value;
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function buildQueryString(params: Record<string, QueryValue>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== null && v !== undefined) {
          searchParams.append(key, String(v));
        }
      });
    } else if (value instanceof Date) {
      searchParams.set(key, value.toISOString());
    } else if (typeof value === 'boolean') {
      searchParams.set(key, String(value));
    } else {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function parseQueryString(queryString: string): ParsedQueryParams {
  const searchParams = new URLSearchParams(queryString);
  return parseQueryParams(searchParams);
}
