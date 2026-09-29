import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { Check, X, Search, FileText } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

const formatDocName = (filename: string, professions?: string[]) => {
  let category = filename.split('_')[0];
  let subIndex = -1;

  if (filename.includes('_')) {
    const parts = filename.split('_');
    if (parts.length > 1 && !isNaN(parseInt(parts[1]))) {
      subIndex = parseInt(parts[1]);
    }
  } else {
    category = filename.split('.')[0];
  }

  if (category === 'org') category = 'Registration';
  if (category.startsWith('license')) category = 'License';
  
  const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1].toUpperCase() : '';

  let title = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');

  if (category === 'License' && subIndex >= 0 && professions && professions[subIndex]) {
    const profCode = professions[subIndex];
    const profName = profCode.charAt(0).toUpperCase() + profCode.slice(1).replace(/-/g, ' ');
    title = `${title} — ${profName}`;
  }

  return `${title} ${ext}`.trim();
};

const getCategory = (filename: string) => {
  let category = filename.split('_')[0];
  if (!filename.includes('_')) category = filename.split('.')[0];
  if (category === 'org') return 'Organization';
  if (category.startsWith('license')) return 'Licenses';
  if (category === 'diploma') return 'Medical Diploma';
  if (category === 'certificate' || category === 'identity') return 'Certificates & Identity';
  return 'Other Documents';
};

export const DoctorVerificationPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  // 1. Fetch List
  const { data: listData, isLoading } = useQuery({
    queryKey: ['verificationDoctors', statusFilter],
    queryFn: () => api.get<any>(`/verification/doctors?status=${statusFilter}&limit=50`)
  });

  // 2. Fetch Detail
  const { data: detailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['verificationDoctorDetail', selectedDoctorId],
    queryFn: () => api.get<any>(`/verification/doctors/${selectedDoctorId}`),
    enabled: !!selectedDoctorId
  });

  // 3. Mutate Status
  const updateStatus = useMutation({
    mutationFn: ({ status, comment }: { status: 'verified' | 'rejected', comment?: string }) => 
      api.put(`/verification/doctors/${selectedDoctorId}`, { status, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verificationDoctors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setSelectedDoctorId(null);
    }
  });

  const handleAction = (status: 'verified' | 'rejected') => {
    const comment = status === 'rejected' ? window.prompt(t('common.reasonForRejection')) : '';
    if (status === 'rejected' && comment === null) return;
    
    if (window.confirm(t('common.confirmAction', { action: status }))) {
      updateStatus.mutate({ status, comment: comment || undefined });
    }
  };

  const tabs = [
    { id: 'all', label: t('common.all') },
    { id: 'pending', label: t('common.pending') },
    { id: 'verified', label: t('common.verified') },
    { id: 'rejected', label: t('common.rejected') }
  ];

  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-6)', height: 'calc(100vh - 64px - 48px)' }}>
      
      {/* Left List Panel */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        {/* Header & Tabs */}
        <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--n200)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-4)' }}>{t('verification.doctorsTitle')}</h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={clsx('btn', statusFilter === tab.id ? 'btn-primary' : 'btn-secondary')}
                style={{ padding: '6px 12px', fontSize: '0.875rem' }}
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
            <div className="flex-center" style={{ padding: '3rem', color: 'var(--n500)' }}>{t('verification.noDoctors')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {listData?.items?.map((doc: any) => (
                <div 
                  key={doc.profileId}
                  onClick={() => setSelectedDoctorId(doc.profileId)}
                  style={{ 
                    padding: 'var(--spacing-4)', 
                    borderBottom: '1px solid var(--n200)',
                    cursor: 'pointer',
                    backgroundColor: selectedDoctorId === doc.profileId ? 'var(--p50)' : 'transparent',
                    display: 'flex', gap: '1rem', alignItems: 'center'
                  }}
                >
                  <img 
                    src={doc.avatarUrl || 'https://via.placeholder.com/40'} 
                    alt="avatar" 
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{doc.firstName} {doc.lastName}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--n500)' }}>{doc.email}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12, 
                    backgroundColor: doc.status === 'pending' ? 'var(--warning-bg)' : doc.status === 'verified' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: doc.status === 'pending' ? 'var(--warning)' : doc.status === 'verified' ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {doc.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Panel */}
      {selectedDoctorId && (
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          {isLoadingDetail || !detailData ? (
             <div className="flex-center" style={{ height: '100%' }}>Loading detail...</div>
          ) : (
            <>
              {/* Detail Header */}
              <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--n200)', display: 'flex', gap: '1rem' }}>
                <img 
                  src={detailData.profile.avatar_url || 'https://via.placeholder.com/80'} 
                  alt="avatar" 
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h2>{detailData.profile.first_name} {detailData.profile.last_name}</h2>
                  <p style={{ color: 'var(--n500)' }}>{detailData.profile.email} • {detailData.profile.phone}</p>
                  <p style={{ marginTop: '0.5rem' }}>
                    Status: <strong>{detailData.profile.doctor_profiles[0]?.doc_verification_status}</strong>
                  </p>
                </div>
              </div>

              {/* Detail Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-6)' }}>
                <h4 style={{ marginBottom: '1rem' }}>{t('verification.professionalInfo')}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <span className="label">{t('verification.education')}</span>
                    <div>{detailData.profile.doctor_profiles[0]?.doctor_professional_details?.[0]?.education || '-'}</div>
                  </div>
                  <div>
                    <span className="label">{t('verification.experience')}</span>
                    <div>{detailData.profile.doctor_profiles[0]?.doctor_professional_details?.[0]?.experience || 0} years</div>
                  </div>
                  <div>
                    <span className="label">{t('verification.workplace')}</span>
                    <div>{detailData.profile.doctor_profiles[0]?.doctor_professional_details?.[0]?.workplace || '-'}</div>
                  </div>
                </div>

                <h4 style={{ marginBottom: '1rem' }}>{t('verification.uploadedDocs', { count: detailData.documents?.length || 0 })}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {(() => {
                    if (!detailData.documents || detailData.documents.length === 0) {
                      return <p style={{ color: 'var(--n500)' }}>{t('verification.noDocs')}</p>;
                    }
                    
                    // Group documents
                    const groups: Record<string, any[]> = {};
                    detailData.documents.forEach((doc: any) => {
                      const cat = getCategory(doc.name);
                      if (!groups[cat]) groups[cat] = [];
                      groups[cat].push(doc);
                    });

                    const professions = detailData.profile?.doctor_specializations?.map((s: any) => s.profession_code) || [];

                    return Object.entries(groups).map(([catName, docs]) => (
                      <div key={catName}>
                        <h5 style={{ marginBottom: '0.5rem', color: 'var(--n600)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{catName}</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {docs.map((doc: any, i: number) => (
                            <a 
                              key={i} 
                              href={doc.url} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-secondary"
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-start', padding: '0.75rem 1rem', border: '1px solid var(--n200)', backgroundColor: 'var(--white)', borderRadius: 'var(--radius-md)' }}
                            >
                              <FileText size={20} color="var(--p500)" />
                              <span style={{ fontWeight: 500, color: 'var(--n900)' }}>{formatDocName(doc.name, professions)}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Action Bar */}
              {detailData.profile.doctor_profiles[0]?.doc_verification_status !== 'verified' && (
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

              {detailData.profile.doctor_profiles[0]?.doc_verification_status === 'verified' && (
                <div style={{ padding: 'var(--spacing-4)', borderTop: '1px solid var(--n200)', display: 'flex', gap: '1rem', background: 'var(--n50)' }}>
                  <button 
                    className="btn btn-danger" 
                    style={{ flex: 1 }}
                    onClick={() => handleAction('rejected')}
                    disabled={updateStatus.isPending}
                  >
                    <X size={18} /> Revoke Verification
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
