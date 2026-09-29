import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Activity } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from './AuthContext';
import clsx from 'clsx';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useHookForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const from = location.state?.from?.pathname || '/dashboard';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await api.post<{ 
        admin: { id: string; displayName: string; role: 'admin' | 'super_admin'; email: string; },
        accessToken: string;
      }>('/auth/login', data);
      
      login(response.accessToken, response.admin);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '1rem', background: 'linear-gradient(135deg, var(--p500), var(--p700))' }}>
      <div className={clsx('glass-panel', error && 'animate-shake')} style={{ padding: '2.5rem', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
        
        <div className="flex-center" style={{ marginBottom: '1.5rem', color: 'white' }}>
          <Activity size={48} strokeWidth={2.5} />
        </div>
        
        <h1 style={{ color: 'white', marginBottom: '2rem', fontSize: '1.5rem' }}>
          MedHelp {t('auth.loginTitle')}
        </h1>

        {error && (
          <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex-col" style={{ gap: '1.25rem', textAlign: 'left' }}>
          <div>
            <label className="label" style={{ color: 'rgba(255,255,255,0.9)' }}>{t('auth.email')}</label>
            <input 
              type="email" 
              className={clsx('input', errors.email && 'error')} 
              placeholder="admin@medhelp.com"
              {...register('email')}
              disabled={isSubmitting}
            />
            {errors.email && <span className="error-msg">{errors.email.message}</span>}
          </div>

          <div>
            <label className="label" style={{ color: 'rgba(255,255,255,0.9)' }}>{t('auth.password')}</label>
            <input 
              type="password" 
              className={clsx('input', errors.password && 'error')} 
              placeholder="••••••••"
              {...register('password')}
              disabled={isSubmitting}
            />
            {errors.password && <span className="error-msg">{errors.password.message}</span>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', fontSize: '1rem' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? t('auth.loggingIn') : t('auth.loginBtn')}
          </button>
        </form>
      </div>
    </div>
  );
};
