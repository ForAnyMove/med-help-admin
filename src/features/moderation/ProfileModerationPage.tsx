import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Check, X, ShieldAlert, Image, AlignLeft } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

import { useTranslation } from 'react-i18next';

export const ProfileModerationPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<'avatar' | 'about'>('avatar');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const { data: listData, isLoading } = useQuery({
    queryKey: ['moderationProfiles', typeFilter, statusFilter],
    queryFn: () => api.get<any>(`/moderation/profiles?type=${typeFilter}&status=${statusFilter}&limit=50`)
  });

  const updateStatus = useMutation({
    mutationFn: ({ status, comment }: { status: 'verified' | 'rejected', comment?: string }) => 
      api.put(`/moderation/profiles/${selectedProfileId}`, { type: typeFilter, status, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setSelectedProfileId(null);
    }
  });

  const handleAction = (status: 'verified' | 'rejected') => {
    const comment = status === 'rejected' ? window.prompt(t('common.reasonForRejection')) : '';
    if (status === 'rejected' && comment === null) return;
    
    if (window.confirm(t('common.confirmAction', { action: status }))) {
      updateStatus.mutate({ status, comment: comment || undefined });
    }
  };

  const statusTabs = [
    { id: 'all', label: t('common.all') },
    { id: 'pending', label: t('common.pending') },
    { id: 'verified', label: t('common.verified') },
    { id: 'rejected', label: t('common.rejected') }
  ];

  const typeTabs = [
    { id: 'avatar', label: t('moderation.avatarImg'), icon: Image },
    { id: 'about', label: t('moderation.aboutText'), icon: AlignLeft },
  ];

  const selectedProfile = listData?.items?.find((p: any) => p.id === selectedProfileId);

  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-6)', height: 'calc(100vh - 64px - 48px)' }}>
      
      {/* Left List Panel */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        {/* Header & Tabs */}
        <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--n200)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-4)' }}>{t('moderation.contentTitle')}</h3>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
            {typeTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setTypeFilter(tab.id as any); setSelectedProfileId(null); }}
                className={clsx('btn', typeFilter === tab.id ? 'btn-primary' : 'btn-outline')}
                style={{ padding: '6px 12px', fontSize: '0.875rem', flex: 1 }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            {statusTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={clsx('btn', statusFilter === tab.id ? 'btn-primary' : 'btn-secondary')}
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div className="flex-center" style={{ padding: '2rem' }}>{t('common.loading')}</div>
          ) : listData?.items?.length === 0 ? (
            <div className="flex-center" style={{ padding: '3rem', color: 'var(--n500)' }}>{t('moderation.noItems')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {listData?.items?.map((profile: any) => {
                const status = typeFilter === 'avatar' ? profile.avatar_moderation_status : profile.about_moderation_status;
                return (
                  <div 
                    key={profile.id}
                    onClick={() => setSelectedProfileId(profile.id)}
                    style={{ 
                      padding: 'var(--spacing-4)', 
                      borderBottom: '1px solid var(--n200)',
                      cursor: 'pointer',
                      backgroundColor: selectedProfileId === profile.id ? 'var(--p50)' : 'transparent',
                      display: 'flex', gap: '1rem', alignItems: 'center'
                    }}
                  >
                    {typeFilter === 'avatar' ? (
                      <img 
                        src={profile.avatar_url || 'https://via.placeholder.com/40'} 
                        alt="avatar" 
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--n100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlignLeft size={20} color="var(--n500)" />
                      </div>
                    )}
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{profile.first_name} {profile.last_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--n500)' }}>{profile.role}</div>
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12, 
                      backgroundColor: status === 'pending' ? 'var(--warning-bg)' : status === 'verified' ? 'var(--success-bg)' : 'var(--danger-bg)',
                      color: status === 'pending' ? 'var(--warning)' : status === 'verified' ? 'var(--success)' : 'var(--danger)'
                    }}>
                      {status}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Panel */}
      {selectedProfile && (
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          {/* Detail Header */}
          <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--n200)' }}>
            <h2>{selectedProfile.first_name} {selectedProfile.last_name}</h2>
            <p style={{ color: 'var(--n500)' }}>{t('moderation.role')}: {selectedProfile.role}</p>
          </div>

          {/* Detail Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-6)' }}>
            
            {typeFilter === 'avatar' && (
              <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ alignSelf: 'flex-start' }}>{t('moderation.avatarImg')}</h4>
                <div style={{ padding: '1rem', border: '2px dashed var(--n300)', borderRadius: '12px' }}>
                  <img 
                    src={selectedProfile.avatar_url} 
                    alt="avatar" 
                    style={{ maxWidth: '300px', maxHeight: '300px', borderRadius: '12px', objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}

            {typeFilter === 'about' && (
              <div>
                <h4 style={{ marginBottom: '1rem' }}>{t('moderation.aboutText')}</h4>
                <div style={{ padding: '1rem', backgroundColor: 'var(--n50)', border: '1px solid var(--n200)', borderRadius: '12px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {selectedProfile.about}
                </div>
              </div>
            )}

          </div>

          {/* Action Bar */}
          {((typeFilter === 'avatar' && selectedProfile.avatar_moderation_status === 'pending') || 
            (typeFilter === 'about' && selectedProfile.about_moderation_status === 'pending')) && (
            <div style={{ padding: 'var(--spacing-4)', borderTop: '1px solid var(--n200)', display: 'flex', gap: '1rem', background: 'var(--n50)' }}>
              <button 
                className="btn btn-danger" 
                style={{ flex: 1 }}
                onClick={() => handleAction('rejected')}
                disabled={updateStatus.isPending}
              >
                <X size={18} /> {t('common.reject')}
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, backgroundColor: 'var(--success)' }}
                onClick={() => handleAction('verified')}
                disabled={updateStatus.isPending}
              >
                <Check size={18} /> {t('common.approve')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
