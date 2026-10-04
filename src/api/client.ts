const BASE_URL = import.meta.env.DEV ? 'http://localhost:3000/api/admin' : (import.meta.env.VITE_API_URL || '/api/admin');

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
      // Try to refresh the session
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        // Retry the original request with new token
        const newToken = this.getToken();
        const retryRes = await fetch(`${BASE_URL}${path}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
            ...options.headers,
          },
        });
        const retryJson = await retryRes.json();
        if (!retryJson.success) throw new Error(retryJson.error || 'API Error');
        return retryJson.data;
      }
      
      // Basic handling: clear token and redirect to login
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
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

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = localStorage.getItem('admin_refresh_token');
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const json = await res.json();
      if (json.success && json.data?.token) {
        localStorage.setItem('admin_token', json.data.token);
        if (json.data.refreshToken) {
          localStorage.setItem('admin_refresh_token', json.data.refreshToken);
        }
        return true;
      }
    } catch (e) {
      console.error('Admin refresh failed:', e);
    }
    return false;
  }
}

export const api = new ApiClient();
