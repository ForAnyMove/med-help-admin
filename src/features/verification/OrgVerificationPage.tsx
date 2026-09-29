import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { Check, X, Building2, FileText } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

const formatDocName = (filename: string) => {
  let category = filename.split('_')[0];
  if (!filename.includes('_')) category = filename.split('.')[0];
  if (category === 'org') category = 'Registration';
  if (category.startsWith('license')) category = 'License';
  
  const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
  const ext = extMatch ? extMatch[1].toUpperCase() : '';

  const title = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
  return `${title} ${ext}`.trim();
};

const getCategory = (filename: string) => {
  let category = filename.split('_')[0];
  if (!filename.includes('_')) category = filename.split('.')[0];
  if (category === 'org') return 'Organization Registration';
  if (category.startsWith('license')) return 'Licenses';
  if (category === 'diploma') return 'Medical Diploma';
  if (category === 'certificate' || category === 'identity') return 'Certificates & Identity';
  return 'Other Documents';
};

export const OrgVerificationPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // 1. Fetch List
  const { data: listData, isLoading } = useQuery({
    queryKey: ['verificationOrgs', statusFilter],
    queryFn: () => api.get<any>(`/verification/organizations?status=${statusFilter}&limit=50`)
  });

  // 2. Fetch Detail
  const { data: detailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['verificationOrgDetail', selectedOrgId],
    queryFn: () => api.get<any>(`/verification/organizations/${selectedOrgId}`),
    enabled: !!selectedOrgId
  });

  // 3. Mutate Status
  const updateStatus = useMutation({
    mutationFn: ({ status, comment }: { status: 'verified' | 'rejected', comment?: string }) => 
      api.put(`/verification/organizations/${selectedOrgId}`, { status, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verificationOrgs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setSelectedOrgId(null);
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
          <h3 style={{ marginBottom: 'var(--spacing-4)' }}>{t('verification.orgsTitle')}</h3>
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
            <div className="flex-center" style={{ padding: '3rem', color: 'var(--n500)' }}>{t('verification.noOrgs')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {listData?.items?.map((org: any) => (
                <div 
                  key={org.id}
                  onClick={() => setSelectedOrgId(org.id)}
                  style={{ 
                    padding: 'var(--spacing-4)', 
                    borderBottom: '1px solid var(--n200)',
                    cursor: 'pointer',
                    backgroundColor: selectedOrgId === org.id ? 'var(--p50)' : 'transparent',
                    display: 'flex', gap: '1rem', alignItems: 'center'
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '8px', backgroundColor: 'var(--n100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={24} color="var(--n500)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{org.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--n500)' }}>{org.address}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12, 
                    backgroundColor: org.doc_verification_status === 'pending' ? 'var(--warning-bg)' : org.doc_verification_status === 'verified' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: org.doc_verification_status === 'pending' ? 'var(--warning)' : org.doc_verification_status === 'verified' ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {org.doc_verification_status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Panel */}
      {selectedOrgId && (
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          {isLoadingDetail || !detailData ? (
             <div className="flex-center" style={{ height: '100%' }}>Loading detail...</div>
          ) : (
            <>
              {/* Detail Header */}
              <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--n200)', display: 'flex', gap: '1rem' }}>
                <div style={{ width: 80, height: 80, borderRadius: '12px', backgroundColor: 'var(--n100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={40} color="var(--n500)" />
                </div>
                <div>
                  <h2>{detailData.organization.name}</h2>
                  <p style={{ color: 'var(--n500)' }}>{detailData.organization.address}</p>
                  <p style={{ marginTop: '0.5rem' }}>
                    Status: <strong>{detailData.organization.doc_verification_status}</strong>
                  </p>
                </div>
              </div>

              {/* Detail Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-6)' }}>
                <h4 style={{ marginBottom: '1rem' }}>{t('verification.orgInfo')}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2rem' }}>
                  <div>
                    <span className="label">{t('verification.address')}</span>
                    <div>{detailData.organization.address || '-'}</div>
                  </div>
                  <div>
                    <span className="label">{t('verification.createdAt')}</span>
                    <div>{format(new Date(detailData.organization.created_at), 'PPpp')}</div>
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
                              <span style={{ fontWeight: 500, color: 'var(--n900)' }}>{formatDocName(doc.name)}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Action Bar */}
              {detailData.organization.doc_verification_status !== 'verified' && (
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
            </>
          )}
        </div>
      )}
    </div>
  );
};
