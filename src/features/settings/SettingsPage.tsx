import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Globe, Moon, Sun, Bell } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { api } from '../../api/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const SettingsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { admin } = useAuth();
  const queryClient = useQueryClient();
  
  const [lang, setLang] = useState(admin?.language || 'en');
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(admin?.notifications_enabled ?? true);
  
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (admin) {
      setLang(admin.language || 'en');
      setNotifications(admin.notifications_enabled ?? true);
    }
  }, [admin]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: { language: string, notifications_enabled: boolean }) => api.put('/settings', data),
    onSuccess: () => {
      // Re-fetch me to update context
      api.get('/auth/me').then(res => {
        // Just trigger a re-fetch of the session if needed, or AuthContext checkAuth
        // Note: For a robust app, we'd have a function in AuthContext to update current user state
        // but for now, changing language locally is enough
      });
      i18n.changeLanguage(lang);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to save settings');
    }
  });

  const handleSave = () => {
    updateSettingsMutation.mutate({ language: lang, notifications_enabled: notifications });
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Settings size={28} color="var(--p600)" />
        <h2 style={{ margin: 0 }}>{t('settings.title')}</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Language */}
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Globe size={18} color="var(--n500)" /> {t('settings.language')}
          </h4>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="lang" 
                value="en" 
                checked={lang === 'en'} 
                onChange={() => setLang('en')} 
              />
              English
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="lang" 
                value="ru" 
                checked={lang === 'ru'} 
                onChange={() => setLang('ru')} 
              />
              Русский
            </label>
          </div>
        </div>

        {/* Theme */}
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            {theme === 'light' ? <Sun size={18} color="var(--n500)" /> : <Moon size={18} color="var(--n500)" />} 
            {t('settings.theme')}
          </h4>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="theme" 
                value="light" 
                checked={theme === 'light'} 
                onChange={() => setTheme('light')} 
              />
              Light Mode
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: 0.5 }}>
              <input 
                type="radio" 
                name="theme" 
                value="dark" 
                checked={theme === 'dark'} 
                disabled
              />
              Dark Mode (Coming soon)
            </label>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Bell size={18} color="var(--n500)" /> {t('settings.notifications')}
          </h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={notifications} 
              onChange={(e) => setNotifications(e.target.checked)} 
            />
            Receive email notifications for pending moderations
          </label>
        </div>

        {/* Actions */}
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--n200)', paddingTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {saved ? <span style={{ color: 'var(--success)', fontWeight: 500 }}>{t('settings.saved')}</span> : <span />}
          <button className="btn btn-primary" onClick={handleSave}>
            {t('settings.save')}
          </button>
        </div>

      </div>
    </div>
  );
};
