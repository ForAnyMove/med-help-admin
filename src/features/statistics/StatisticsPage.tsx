import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#23D3C2', '#FF7062', '#FFCF65', '#47A4FF', '#8B5CF6'];

export const StatisticsPage: React.FC = () => {
  const { t } = useTranslation();
  
  const [period, setPeriod] = useState('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['statistics', period],
    queryFn: () => api.get<any>(`/statistics?period=${period}`)
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '10px', border: '1px solid var(--n200)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600 }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: 0, color: entry.color, fontSize: '0.875rem' }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{t('statistics.title')}</h2>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: '7d', label: t('statistics.period7d') },
            { id: '30d', label: t('statistics.period30d') },
            { id: '90d', label: t('statistics.period90d') },
            { id: '1y', label: t('statistics.period1y') }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={period === p.id ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ padding: '6px 12px' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex-center" style={{ height: '50vh' }}>{t('common.loading')}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-6)' }}>
          
          {/* Registrations Trend */}
          <div className="card" style={{ gridColumn: 'span 2', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{t('statistics.registrationsTrend')}</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.registrationsTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--n200)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--n500)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--n500)' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="patients" stackId="1" stroke="var(--p500)" fill="var(--p500)" name="Patients" />
                  <Area type="monotone" dataKey="doctors" stackId="1" stroke="var(--s-blue)" fill="var(--s-blue)" name="Doctors" />
                  <Area type="monotone" dataKey="owners" stackId="1" stroke="var(--s-coral)" fill="var(--s-coral)" name="Owners" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Consultations Trend */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{t('statistics.consultationsTrend')}</h3>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.consultationsTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--n200)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--n500)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--n500)' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="completed" stackId="a" fill="var(--success)" name="Completed" />
                  <Bar dataKey="canceled" stackId="a" fill="var(--danger)" name="Canceled" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Specializations Pie */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{t('statistics.specializations')}</h3>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.specializationsPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.specializationsPie.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Doctors */}
          <div className="card" style={{ gridColumn: 'span 2', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>{t('statistics.topDoctors')}</h3>
            
            {data.topDoctors?.length === 0 ? (
              <p style={{ color: 'var(--n500)' }}>No completed consultations yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {data.topDoctors.map((doc: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--p50)', color: 'var(--p600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, fontWeight: 500 }}>{doc.name}</div>
                    <div style={{ fontWeight: 600, color: 'var(--p600)' }}>{doc.count} consultations</div>
                    
                    {/* Visual bar */}
                    <div style={{ width: '30%', height: '8px', backgroundColor: 'var(--n100)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${(doc.count / data.topDoctors[0].count) * 100}%`, height: '100%', backgroundColor: 'var(--p500)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
