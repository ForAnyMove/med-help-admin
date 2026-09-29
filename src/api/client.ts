const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/admin';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (res.status === 401) {
      // Basic handling: clear token and redirect to login
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'API Error');
    }
    return json.data;
  }

  get<T>(path: string) { 
    return this.request<T>(path); 
  }
  
  post<T>(path: string, body: any) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }
  
  put<T>(path: string, body: any) {
    return this.request<T>(path, { method: 'PUT', body: JSON.stringify(body) });
  }
  
  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
