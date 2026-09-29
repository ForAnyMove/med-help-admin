import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Building2, ShieldAlert, CheckCircle, MapPin, Phone, Users, ShieldOff } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

export const OrgDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'info' | 'doctors'>('info');

  const { data, isLoading } = useQuery({
    queryKey: ['organization_crm', id],
    queryFn: () => api.get<any>(`/organizations/${id}`)
  });

  const blockMutation = useMutation({
    mutationFn: () => api.put(`/organizations/${id}/block`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization_crm', id] });
      queryClient.invalidateQueries({ queryKey: ['organizations_crm'] });
    }
  });

  const handleBlockToggle = () => {
    if (data?.doc_verification_status === 'rejected') {
      alert("Organization is already blocked/rejected. You can unblock it via the Verification tab if needed.");
      return;
    }
    
    if (window.confirm("Are you sure you want to block this organization? This will reject its verification status.")) {
      blockMutation.mutate();
    }
  };

  if (isLoading) {
    return <div className="flex-center" style={{ height: '50vh', color: 'var(--n500)' }}>{t('common.loading')}</div>;
  }

  if (!data) {
    return <div className="flex-center" style={{ height: '50vh', color: 'var(--danger)' }}>Organization not found</div>;
  }

  const isBlocked = data.doc_verification_status === 'rejected';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)', paddingBottom: 'var(--spacing-6)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-outline" style={{ padding: '8px' }} onClick={() => navigate('/organizations')}>
            <ArrowLeft size={20} />
          </button>
          
          <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--p50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={32} color="var(--p500)" />
          </div>
          
          <div>
            <h1 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {data.name}
              {data.doc_verification_status === 'verified' && <CheckCircle size={20} color="var(--success)" />}
            </h1>
            <div style={{ color: 'var(--n500)', fontSize: '0.875rem' }}>
              ID: <span style={{ fontFamily: 'monospace' }}>{data.id}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={clsx('btn', isBlocked ? 'btn-secondary' : 'btn-danger')}
            onClick={handleBlockToggle}
            disabled={blockMutation.isPending || isBlocked}
          >
            {isBlocked ? <ShieldAlert size={18} /> : <ShieldOff size={18} />}
            {isBlocked ? 'Blocked' : 'Block Organization'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-6)' }}>
        
        {/* Left Col - Summary Card */}
        <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="card">
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem' }}>Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--n500)', marginBottom: '4px' }}>Status</div>
                <div style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px',
                  backgroundColor: data.doc_verification_status === 'verified' ? 'var(--success-bg)' : data.doc_verification_status === 'pending' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                  color: data.doc_verification_status === 'verified' ? 'var(--success)' : data.doc_verification_status === 'pending' ? 'var(--warning)' : 'var(--danger)',
                  fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase'
                }}>
                  {data.doc_verification_status === 'verified' ? <CheckCircle size={14} /> : <ShieldAlert size={14} />}
                  {data.doc_verification_status}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--n500)', marginBottom: '4px' }}>Registered At</div>
                <div style={{ fontWeight: 500 }}>{format(new Date(data.created_at), 'PPpp')}</div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--n500)', marginBottom: '4px' }}>Affiliated Doctors</div>
                <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} color="var(--p500)" />
                  {data.doctors?.length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col - Tabs & Details */}
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--n200)' }}>
            <button
              className={`tab ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
              style={{ 
                flex: 1, padding: '1rem', borderBottom: activeTab === 'info' ? '2px solid var(--p500)' : '2px solid transparent',
                color: activeTab === 'info' ? 'var(--p600)' : 'var(--n500)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', fontWeight: 500
              }}
            >
              General Information
            </button>
            <button
              className={`tab ${activeTab === 'doctors' ? 'active' : ''}`}
              onClick={() => setActiveTab('doctors')}
              style={{ 
                flex: 1, padding: '1rem', borderBottom: activeTab === 'doctors' ? '2px solid var(--p500)' : '2px solid transparent',
                color: activeTab === 'doctors' ? 'var(--p600)' : 'var(--n500)', background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', fontWeight: 500
              }}
            >
              Affiliated Doctors ({data.doctors?.length || 0})
            </button>
          </div>

          <div style={{ padding: 'var(--spacing-6)', flex: 1, overflowY: 'auto' }}>
            {activeTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--n700)' }}>
                    <MapPin size={18} /> Address
                  </h4>
                  <p style={{ margin: 0, color: 'var(--n900)', backgroundColor: 'var(--n50)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    {data.address || 'No address provided'}
                  </p>
                </div>

                <div>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--n700)' }}>
                    <Phone size={18} /> Contact Phone
                  </h4>
                  <p style={{ margin: 0, color: 'var(--n900)', backgroundColor: 'var(--n50)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    {data.phone || 'No phone provided'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'doctors' && (
              <div>
                {(!data.doctors || data.doctors.length === 0) ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--n500)' }}>
                    No doctors affiliated with this organization.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {data.doctors.map((doc: any) => (
                      <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--n200)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <img 
                            src={doc.profile?.avatar_url || 'https://ui-avatars.com/api/?name=' + (doc.profile?.first_name || 'D')} 
                            alt="avatar" 
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600 }}>{doc.profile?.first_name} {doc.profile?.last_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--n500)' }}>{doc.profession_code}</div>
                          </div>
                        </div>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                          backgroundColor: doc.doc_verification_status === 'verified' ? 'var(--success-bg)' : doc.doc_verification_status === 'pending' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                          color: doc.doc_verification_status === 'verified' ? 'var(--success)' : doc.doc_verification_status === 'pending' ? 'var(--warning)' : 'var(--danger)',
                        }}>
                          {doc.doc_verification_status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
