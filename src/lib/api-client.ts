interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: RequestCache;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;
  private defaultRetries: number;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    this.defaultTimeout = 10000;
    this.defaultRetries = 3;
  }

  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(id);
    }
  }

  private async retryFetch(
    url: string,
    options: RequestInit,
    timeout: number,
    retries: number
  ): Promise<Response> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options, timeout);
        if (response.status >= 500 && attempt < retries) {
          await this.delay(1000 * Math.pow(2, attempt)); // exponential backoff
          continue;
        }
        return response;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          await this.delay(1000 * Math.pow(2, attempt));
        }
      }
    }
    throw lastError || new Error('Request failed after retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const timeout = options.timeout || this.defaultTimeout;
    const retries = options.retries ?? this.defaultRetries;

    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      cache: options.cache,
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await this.retryFetch(fullUrl, fetchOptions, timeout, retries);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        success: false,
        error: data?.error || { code: 'HTTP_ERROR', message: `HTTP ${response.status}` },
      };
    }

    return data as ApiResponse<T>;
  }

  async get<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url, undefined, options);
  }

  async post<T>(url: string, body: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, body, options);
  }

  async put<T>(url: string, body: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, body, options);
  }

  async del<T>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url, undefined, options);
  }
}

export const apiClient = new ApiClient();
export { ApiClient };
export type { RequestOptions, ApiResponse };
