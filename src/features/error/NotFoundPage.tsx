import React from 'react';
import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const error = useRouteError();

  let is404 = false;
  if (isRouteErrorResponse(error) && error.status === 404) {
    is404 = true;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(135deg, var(--bg) 0%, #e0f2fe 100%)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div 
        className="card"
        style={{
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
          padding: '4rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
          animation: 'slideUp 0.5s ease-out',
          boxShadow: 'var(--shadow-glass)'
        }}
      >
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', 
          backgroundColor: 'var(--p50)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center',
          animation: 'pulse 2s infinite'
        }}>
          <ShieldAlert size={40} color="var(--p600)" />
        </div>

        <h1 style={{ 
          margin: 0, fontSize: '4rem', fontWeight: 800, 
          background: 'linear-gradient(90deg, var(--p600) 0%, var(--s-blue) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {is404 ? '404' : 'Oops!'}
        </h1>
        
        <h3 style={{ margin: 0, color: 'var(--n700)', fontWeight: 600 }}>
          {is404 ? t('error.notFoundTitle', 'Page not found') : t('error.unexpectedTitle', 'Unexpected Error')}
        </h3>
        
        <p style={{ color: 'var(--n500)', lineHeight: 1.5, margin: 0 }}>
          {is404 
            ? t('error.notFoundDesc', "The page you are looking for doesn't exist or has been moved.")
            : t('error.unexpectedDesc', "Something went wrong on our end. Please try again later.")
          }
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
          <button 
            className="btn btn-outline" 
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeft size={18} /> {t('error.goBack', 'Go Back')}
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Home size={18} /> {t('error.goHome', 'Dashboard')}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(35, 211, 194, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(35, 211, 194, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(35, 211, 194, 0); }
        }
      `}</style>
    </div>
  );
};
