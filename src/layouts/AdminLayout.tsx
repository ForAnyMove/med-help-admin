import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, UserCheck, Building2, ShieldAlert, 
  Users, Star, Calendar, CreditCard, Settings,
  BriefcaseMedical, LogOut, Globe, Shield
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import clsx from 'clsx';
import { NotificationBell } from '../components/NotificationBell';

export const AdminLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const toggleLang = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('admin_language', newLang);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navGroups = [
    {
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') }
      ]
    },
    {
      label: t('sidebar.verification'),
      items: [
        { to: '/verification/doctors', icon: UserCheck, label: t('sidebar.doctors') },
        { to: '/verification/organizations', icon: Building2, label: t('sidebar.organizations') },
      ]
    },
    {
      label: t('sidebar.moderation'),
      items: [
        { to: '/moderation/profiles', icon: ShieldAlert, label: t('sidebar.profiles') },
        { to: '/moderation/reviews', icon: Star, label: t('sidebar.reviews') },
        { to: '/moderation/reports', icon: ShieldAlert, label: t('sidebar.reports', 'Reports') },
      ]
    },
    {
      items: [
        { to: '/consultations', icon: Calendar, label: t('sidebar.consultations') },
        { to: '/billing', icon: CreditCard, label: t('sidebar.billing') },
      ]
    },
    {
      label: t('sidebar.management'),
      items: [
        { to: '/users', icon: Users, label: t('sidebar.users') },
        { to: '/professions', icon: BriefcaseMedical, label: t('sidebar.professions') },
        { to: '/statistics', icon: LayoutDashboard, label: t('sidebar.statistics') }, // Use different icon
        { to: '/settings', icon: Settings, label: t('sidebar.settings') },
      ]
    }
  ];

  if (admin?.role === 'super_admin') {
    navGroups[navGroups.length - 1].items.push({
      to: '/admins', icon: Shield, label: t('sidebar.admins')
    });
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{ width: '260px', backgroundColor: 'white', borderRight: '1px solid var(--n200)', display: 'flex', flexDirection: 'column' }}>
        <div className="flex-center" style={{ height: '64px', borderBottom: '1px solid var(--n200)' }}>
          <h2 style={{ color: 'var(--p600)' }}>MedHelp Admin</h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-4)' }}>
          {navGroups.map((group, i) => (
            <div key={i} style={{ marginBottom: 'var(--spacing-6)' }}>
              {group.label && (
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--n500)', textTransform: 'uppercase', marginBottom: 'var(--spacing-2)', letterSpacing: '0.05em' }}>
                  {group.label}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {group.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => clsx(
                      'flex-center',
                      { 'active-nav-link': isActive }
                    )}
                    style={({ isActive }) => ({
                      justifyContent: 'flex-start',
                      padding: 'var(--spacing-2) var(--spacing-3)',
                      borderRadius: 'var(--radius-md)',
                      color: isActive ? 'var(--p600)' : 'var(--n700)',
                      backgroundColor: isActive ? 'var(--p50)' : 'transparent',
                      fontWeight: isActive ? 600 : 500,
                      gap: 'var(--spacing-3)',
                      transition: 'all var(--transition-fast)',
                      textDecoration: 'none'
                    })}
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ padding: 'var(--spacing-4)', borderTop: '1px solid var(--n200)' }}>
          <button onClick={handleLogout} className="btn" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--n700)' }}>
            <LogOut size={20} />
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <header style={{ height: '64px', backgroundColor: 'white', borderBottom: '1px solid var(--n200)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 var(--spacing-6)', gap: 'var(--spacing-4)' }}>
          <NotificationBell />
          
          <button onClick={toggleLang} className="btn btn-outline" style={{ padding: '4px 8px' }}>
            <Globe size={18} />
            {i18n.language.toUpperCase()}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{admin?.displayName}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--n500)' }}>{admin?.role}</div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--p100)', color: 'var(--p600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
              {admin?.displayName?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-6)' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
