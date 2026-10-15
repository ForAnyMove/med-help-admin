const BASE_URL = import.meta.env.DEV ? 'http://localhost:3000/api/admin' : (import.meta.env.VITE_API_URL || '/api/admin');

class ApiClient {
  private refreshPromise: Promise<boolean> | null = null;

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      credentials: 'include', // Send HttpOnly cookies
      cache: 'no-store', // Prevent browser from caching GET requests
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (res.status === 401 && path !== '/auth/refresh' && path !== '/auth/login') {
      // Try to refresh the session
      const refreshed = await this.tryRefresh();
      if (refreshed) {
        // Retry the original request (cookies are sent automatically)
        const retryRes = await fetch(`${BASE_URL}${path}`, {
          ...options,
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
        const retryJson = await retryRes.json();
        if (!retryJson.success) throw new Error(retryJson.error || 'API Error');
        return retryJson.data;
      }
      
      // Basic handling: clear user and redirect to login
      localStorage.removeItem('admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
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
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // Send refresh token via HttpOnly cookie
          headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();
        return Boolean(json.success);
      } catch (e) {
        console.error('Admin refresh failed:', e);
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}

export const api = new ApiClient();
