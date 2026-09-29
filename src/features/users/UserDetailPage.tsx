import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, ShieldAlert, CheckCircle, Activity, Briefcase, FileText } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useAuth } from '../auth/AuthContext';

export const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { admin } = useAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'role' | 'consultations' | 'activity'>('info');

  const { data, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get<any>(`/users/${id}`)
  });

  const blockMutation = useMutation({
    mutationFn: (reason: string) => api.put(`/users/${id}/block`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const unblockMutation = useMutation({
    mutationFn: () => api.put(`/users/${id}/unblock`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const handleBlockToggle = () => {
    if (data?.profile?.is_blocked) {
      if (window.confirm(t('common.confirmAction', { action: t('users.unblock') }))) {
        unblockMutation.mutate();
      }
    } else {
      const reason = window.prompt(t('users.blockReason'));
      if (reason !== null) {
        blockMutation.mutate(reason || 'No reason provided');
      }
    }
  };

  if (isLoading) {
    return <div className="flex-center" style={{ height: '50vh' }}>{t('common.loading')}</div>;
  }

  if (!data?.profile) {
    return <div className="flex-center" style={{ height: '50vh' }}>User not found</div>;
  }

  const { profile, auditLogs, stats } = data;

  const tabs = [
    { id: 'info', label: t('users.info'), icon: User },
    { id: 'role', label: t('users.roleDetails'), icon: Briefcase },
    { id: 'consultations', label: t('users.consultations'), icon: Activity },
    { id: 'activity', label: t('users.activityLog'), icon: FileText }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      {/* Back Button */}
      <div>
        <button onClick={() => navigate('/users')} className="btn btn-outline" style={{ border: 'none', padding: 0 }}>
          <ArrowLeft size={20} /> Back to Users
        </button>
      </div>

      {/* Header Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '2rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'var(--n100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={40} color="var(--n400)" />
            </div>
          )}
          
          <div>
            <h2 style={{ marginBottom: '4px' }}>{profile.first_name} {profile.last_name}</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--n500)' }}>{profile.email}</span>
              <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--n100)', fontSize: '0.875rem' }}>
                {profile.role || 'none'}
              </span>
              {profile.is_blocked ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 500 }}>
                  <ShieldAlert size={16} /> {t('users.blocked')}
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '0.875rem', fontWeight: 500 }}>
                  <CheckCircle size={16} /> {t('users.active')}
                </span>
              )}
            </div>
          </div>
        </div>

        <div>
          {id !== admin?.id && (
            <button 
              className={clsx('btn', profile.is_blocked ? 'btn-outline' : 'btn-danger')}
              onClick={handleBlockToggle}
              disabled={blockMutation.isPending || unblockMutation.isPending}
            >
              {profile.is_blocked ? t('users.unblock') : t('users.block')}
            </button>
          )}
        </div>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: 'flex', gap: 'var(--spacing-6)' }}>
        
        {/* Left Nav */}
        <div className="card" style={{ width: '250px', padding: '1rem', alignSelf: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)', border: 'none', background: activeTab === tab.id ? 'var(--p50)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--p600)' : 'var(--n600)',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div className="card" style={{ flex: 1, minHeight: '400px' }}>
          
          {activeTab === 'info' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem' }}>{t('users.info')}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <div className="label">ID</div>
                  <div>{profile.id}</div>
                </div>
                <div>
                  <div className="label">{t('users.registeredAt')}</div>
                  <div>{format(new Date(profile.created_at), 'PPpp')}</div>
                </div>
                <div>
                  <div className="label">Phone</div>
                  <div>{profile.phone || '-'}</div>
                </div>
                <div>
                  <div className="label">Gender</div>
                  <div>{profile.gender || '-'}</div>
                </div>
                <div>
                  <div className="label">Date of Birth</div>
                  <div>{profile.date_of_birth ? format(new Date(profile.date_of_birth), 'PP') : '-'}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'role' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem' }}>{t('users.roleDetails')}</h3>
              
              {profile.role === 'doctor' && profile.doctor_profiles?.[0] ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <div className="label">Verification Status</div>
                    <div>{profile.doctor_profiles[0].doc_verification_status}</div>
                  </div>
                  <div>
                    <div className="label">VIP Status</div>
                    <div>{profile.doctor_profiles[0].is_vip ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <div className="label">Experience</div>
                    <div>{profile.doctor_profiles[0].doctor_professional_details?.[0]?.experience || 0} years</div>
                  </div>
                  <div>
                    <div className="label">Education</div>
                    <div>{profile.doctor_profiles[0].doctor_professional_details?.[0]?.education || '-'}</div>
                  </div>
                  <div>
                    <div className="label">Workplace</div>
                    <div>{profile.doctor_profiles[0].doctor_professional_details?.[0]?.workplace || '-'}</div>
                  </div>
                </div>
              ) : profile.role === 'patient' && profile.patient_profiles?.[0] ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <div className="label">Height (cm)</div>
                    <div>{profile.patient_profiles[0].height_cm || '-'}</div>
                  </div>
                  <div>
                    <div className="label">Weight (kg)</div>
                    <div>{profile.patient_profiles[0].weight_kg || '-'}</div>
                  </div>
                  <div>
                    <div className="label">Blood Type</div>
                    <div>{profile.patient_profiles[0].blood_type || '-'}</div>
                  </div>
                </div>
              ) : profile.role === 'owner' && profile.organizations?.[0] ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <div className="label">Organization Name</div>
                    <div>{profile.organizations[0].name}</div>
                  </div>
                  <div>
                    <div className="label">Phone</div>
                    <div>{profile.organizations[0].phone || '-'}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <div className="label">Address</div>
                    <div>{profile.organizations[0].address || '-'}</div>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--n500)' }}>No specific role details found.</p>
              )}
            </div>
          )}

          {activeTab === 'consultations' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem' }}>{t('users.consultations')}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.5rem', backgroundColor: 'var(--n50)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--p600)' }}>{stats.totalConsultations}</div>
                  <div style={{ color: 'var(--n600)', fontSize: '0.875rem' }}>Total Scheduled</div>
                </div>
                <div style={{ padding: '1.5rem', backgroundColor: 'var(--n50)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--success)' }}>{stats.completedConsultations}</div>
                  <div style={{ color: 'var(--n600)', fontSize: '0.875rem' }}>Completed</div>
                </div>
              </div>
              
              <p style={{ color: 'var(--n500)' }}>Consultation history table will be available in Phase 5.</p>
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 style={{ marginBottom: '1.5rem' }}>{t('users.activityLog')}</h3>
              
              {auditLogs?.length === 0 ? (
                <p style={{ color: 'var(--n500)' }}>No admin activity found for this user.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {auditLogs?.map((log: any, i: number) => (
                    <div key={i} style={{ padding: '1rem', border: '1px solid var(--n200)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.875rem', color: 'var(--n700)' }}>{log.action}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--n400)' }}>{format(new Date(log.created_at), 'PPpp')}</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--n600)', marginBottom: '4px' }}>By: {log.admin_profiles?.display_name}</div>
                      {log.comment && (
                        <div style={{ fontSize: '0.875rem', backgroundColor: 'var(--n50)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                          "{log.comment}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
