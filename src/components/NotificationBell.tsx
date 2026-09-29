import React, { useState, useEffect, useRef } from 'react';
import { Bell, FileText, UserCheck, ShieldAlert, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';

type Notification = {
  id: string;
  type: string;
  title: string;
  description: string;
  link: string;
  count: number;
  created_at: string;
};

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchNotifications = async () => {
    try {
      const data = await api.get<Notification[]>('/notifications');
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'verification': return <UserCheck size={16} color="var(--primary)" />;
      case 'moderation': return <ShieldAlert size={16} color="var(--warning)" />;
      default: return <Bell size={16} color="var(--n500)" />;
    }
  };

  const handleNotificationClick = (link: string) => {
    navigate(link);
    setIsOpen(false);
  };

  const totalCount = notifications.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        className="btn btn-outline" 
        style={{ padding: '6px', position: 'relative', border: 'none' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} color="var(--n600)" />
        {totalCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            backgroundColor: 'var(--danger)',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 'bold',
            borderRadius: '10px',
            padding: '2px 6px',
            transform: 'translate(25%, -25%)'
          }}>
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          width: '320px',
          backgroundColor: 'white',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--n200)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--n200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '0.875rem' }}>Action Center</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--n500)', cursor: 'pointer' }} onClick={fetchNotifications}>
              Refresh
            </span>
          </div>

          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--n500)', fontSize: '0.875rem' }}>
                <CheckCircleIcon size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                No pending tasks
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.link)}
                  style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid var(--n100)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '12px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--n50)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ 
                    width: '32px', height: '32px', 
                    borderRadius: '8px', 
                    backgroundColor: 'var(--n100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getIcon(notif.type)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '2px', color: 'var(--n900)' }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--n600)' }}>
                      {notif.description}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CheckCircleIcon = ({ size, style }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
