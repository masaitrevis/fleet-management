export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  // Supports international format with optional +, spaces, dashes, and parentheses
  const phoneRegex = /^\+?[\d\s\-()]{7,20}$/;
  return phoneRegex.test(phone);
}

export function isValidSlug(slug: string): boolean {
  // Lowercase letters, numbers, hyphens, and underscores only
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length <= 100;
}

interface FileUploadOptions {
  maxSizeBytes?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileUpload(
  file: File,
  options: FileUploadOptions = {}
): FileValidationResult {
  const {
    maxSizeBytes = 5 * 1024 * 1024, // 5MB default
    allowedTypes = [],
    allowedExtensions = [],
  } = options;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${(maxSizeBytes / 1024 / 1024).toFixed(1)}MB limit`,
    };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    };
  }

  if (allowedExtensions.length > 0) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

export function sanitizeFilename(filename: string): string {
  // Remove path traversal characters and null bytes
  let cleaned = filename
    .replace(/\0/g, '')
    .replace(/\.\./g, '')
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .replace(/[\/\\]/g, '_');

  // Limit length
  if (cleaned.length > 200) {
    const ext = cleaned.split('.').pop() || '';
    cleaned = cleaned.substring(0, 200 - ext.length - 1) + '.' + ext;
  }

  // Ensure filename is not empty
  if (!cleaned.trim()) {
    cleaned = 'unnamed-file';
  }

  return cleaned;
}

export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
