import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Users, Activity, UserCheck, Building2, ShieldAlert, Star
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { api } from '../../api/client';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => api.get<any>('/dashboard/stats')
  });

  if (isLoading) {
    return <div className="flex-center" style={{ height: '50vh' }}>{t('common.loading')}</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--danger)' }}>Failed to load dashboard data.</div>;
  }

  const StatCard = ({ title, value, icon: Icon, color, to }: any) => (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      <div className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1.25rem', height: '100%', transition: 'all 0.2s ease', cursor: 'pointer', border: '1px solid transparent' }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.borderColor = color;
          e.currentTarget.style.boxShadow = `0 4px 12px ${color}30`;
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.borderColor = 'transparent';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        <div>
          <p style={{ fontSize: '0.875rem', color: 'var(--n500)', marginBottom: '0.25rem' }}>{title}</p>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--n900)' }}>{value}</h3>
        </div>
        <div style={{ backgroundColor: `${color}15`, color: color, padding: '0.5rem', borderRadius: 'var(--radius-md)' }}>
          <Icon size={24} />
        </div>
      </div>
    </Link>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      <div className="flex-between">
        <h2>{t('sidebar.dashboard')}</h2>
      </div>

      {/* Actionable Counters (Pending stuff) */}
      <div>
        <h4 style={{ marginBottom: 'var(--spacing-3)', color: 'var(--n700)' }}>{t('dashboard.requiresAttention')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
          <StatCard 
            title={t('dashboard.pendingDoctors')} 
            value={data.pendingDoctorVerifications} 
            icon={UserCheck} 
            color="var(--warning)" 
            to="/verification/doctors" 
          />
          <StatCard 
            title={t('dashboard.pendingOrgs')} 
            value={data.pendingOrgVerifications} 
            icon={Building2} 
            color="var(--warning)" 
            to="/verification/organizations" 
          />
          <StatCard 
            title={t('dashboard.avatarModeration')} 
            value={data.pendingAvatarModerations} 
            icon={ShieldAlert} 
            color="var(--warning)" 
            to="/moderation/profiles" 
          />
          <StatCard 
            title={t('dashboard.aboutModeration')} 
            value={data.pendingAboutModerations} 
            icon={ShieldAlert} 
            color="var(--warning)" 
            to="/moderation/profiles" 
          />
          <StatCard 
            title={t('dashboard.pendingReviews')} 
            value={data.pendingReviewModerations} 
            icon={Star} 
            color="var(--warning)" 
            to="/moderation/reviews" 
          />
        </div>
      </div>

      {/* Global Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
        <Link to="/users" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
          <div className="card table-row-hover" style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '100%', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            <Users size={32} color="var(--p500)" />
            <div>
              <div style={{ color: 'var(--n500)', fontSize: '0.875rem' }}>{t('dashboard.totalUsers')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{data.totalUsers}</div>
            </div>
          </div>
        </Link>
        <Link to="/consultations" style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
          <div className="card table-row-hover" style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '100%', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            <Activity size={32} color="var(--p600)" />
            <div>
              <div style={{ color: 'var(--n500)', fontSize: '0.875rem' }}>{t('dashboard.totalConsultations')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{data.totalConsultations}</div>
            </div>
          </div>
        </Link>
        <Link to="/consultations" state={{ filter: 'completed' }} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
          <div className="card table-row-hover" style={{ display: 'flex', alignItems: 'center', gap: '1rem', height: '100%', cursor: 'pointer', transition: 'background-color 0.2s' }}>
            <UserCheck size={32} color="var(--success)" />
            <div>
              <div style={{ color: 'var(--n500)', fontSize: '0.875rem' }}>{t('dashboard.completedConsultations')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{data.completedConsultations}</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 'var(--spacing-6)' }}>
        
        {/* Registrations Chart */}
        <div className="card">
          <h4 style={{ marginBottom: '1.5rem', color: 'var(--n700)' }}>{t('dashboard.registrations7Days')}</h4>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.registrationsTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--p500)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--p500)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDoctors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--s-blue)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--s-blue)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--n200)" />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Legend />
                <Area type="monotone" dataKey="patients" stroke="var(--p500)" fillOpacity={1} fill="url(#colorPatients)" />
                <Area type="monotone" dataKey="doctors" stroke="var(--s-blue)" fillOpacity={1} fill="url(#colorDoctors)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Consultations Chart */}
        <div className="card">
          <h4 style={{ marginBottom: '1.5rem', color: 'var(--n700)' }}>{t('dashboard.consultations7Days')}</h4>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.consultationsTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--n200)" />
                <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Legend />
                <Bar dataKey="count" name={t('dashboard.totalScheduled')} fill="var(--n300)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name={t('dashboard.completed')} fill="var(--success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
