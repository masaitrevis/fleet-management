const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'span', 'a'];
const ALLOWED_ATTRS = ['href', 'target', 'class', 'style'];

export function sanitizeHtml(input: string): string {
  if (!input) return '';

  // Remove script tags and their content
  let cleaned = input.replace(/<script[^\u003c]*(?:(?!\u003c\/script>)<[^\u003c]*)*<\/script>/gi, '');

  // Remove event handlers
  cleaned = cleaned.replace(/\son\w+\s*=\s*"[^"]*"/gi, '');
  cleaned = cleaned.replace(/\son\w+\s*=\s*'[^']*'/gi, '');

  // Remove style tags
  cleaned = cleaned.replace(/<style[^\u003c]*(?:(?!\u003c\/style>)<[^\u003c]*)*<\/style>/gi, '');

  // Remove iframe, object, embed tags
  cleaned = cleaned.replace(/<(?:iframe|object|embed|form|input|textarea|button)\b[^\u003e]*>/gi, '');

  // Remove javascript: and data: URLs
  cleaned = cleaned.replace(/javascript:/gi, '');
  cleaned = cleaned.replace(/data:/gi, '');

  return cleaned;
}

export function escapeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return escapeHtml(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeObject(value);
    }
    return result;
  }

  return obj;
}
