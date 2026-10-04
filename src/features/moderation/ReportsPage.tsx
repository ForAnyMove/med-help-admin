import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Check, X, Eye, ShieldAlert, FileText, User } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const { data: listData, isLoading } = useQuery({
    queryKey: ['adminReports', statusFilter, targetTypeFilter],
    queryFn: () => {
      let url = `/reports?status=${statusFilter}&limit=50`;
      if (targetTypeFilter !== 'all') {
        url += `&target_type=${targetTypeFilter}`;
      }
      return api.get<any>(url);
    }
  });

  const updateStatus = useMutation({
    mutationFn: ({ status, admin_comment }: { status: 'reviewed' | 'resolved' | 'dismissed', admin_comment?: string }) => 
      api.put(`/reports/${selectedReportId}`, { status, admin_comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
      setSelectedReportId(null);
    }
  });

  const handleAction = (status: 'resolved' | 'dismissed') => {
    const comment = window.prompt('Admin comment (optional):');
    if (comment === null) return; // User cancelled
    
    if (window.confirm(`Are you sure you want to mark this report as ${status}?`)) {
      updateStatus.mutate({ status, admin_comment: comment || undefined });
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'resolved', label: 'Resolved' },
    { id: 'dismissed', label: 'Dismissed' }
  ];

  const typeTabs = [
    { id: 'all', label: 'All Types' },
    { id: 'profile', label: 'Profiles' },
    { id: 'review', label: 'Reviews' },
  ];

  const selectedReport = listData?.items?.find((r: any) => r.id === selectedReportId);

  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-6)', height: 'calc(100vh - 64px - 48px)' }}>
      
      {/* Left List Panel */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        {/* Header & Tabs */}
        <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--n200)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-4)' }}>User Reports</h3>
          
          <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
            {typeTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setTargetTypeFilter(tab.id); setSelectedReportId(null); }}
                className={clsx('btn', targetTypeFilter === tab.id ? 'btn-primary' : 'btn-outline')}
                style={{ padding: '6px 12px', fontSize: '0.875rem', flex: 1 }}
              >
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
            <div className="flex-center" style={{ padding: '2rem' }}>Loading...</div>
          ) : listData?.items?.length === 0 ? (
            <div className="flex-center" style={{ padding: '3rem', color: 'var(--n500)' }}>No reports found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {listData?.items?.map((report: any) => (
                <div 
                  key={report.id}
                  onClick={() => setSelectedReportId(report.id)}
                  style={{
                    padding: 'var(--spacing-4)',
                    borderBottom: '1px solid var(--n200)',
                    cursor: 'pointer',
                    backgroundColor: selectedReportId === report.id ? 'var(--p50)' : 'transparent',
                    borderLeft: selectedReportId === report.id ? '4px solid var(--p500)' : '4px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-1)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--n900)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShieldAlert size={16} className={report.status === 'pending' ? 'text-danger' : 'text-n400'} />
                      {report.target_type.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--n500)' }}>
                      {format(new Date(report.created_at), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--n700)', marginBottom: '4px' }} className="truncate">
                    "{report.reason}"
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--n500)' }}>
                    By: {report.reporter?.first_name} {report.reporter?.last_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Panel */}
      <div className="card" style={{ flex: 1.5, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        {!selectedReport ? (
          <div className="flex-center" style={{ height: '100%', color: 'var(--n400)', flexDirection: 'column', gap: 16 }}>
            <FileText size={48} opacity={0.5} />
            <p>Select a report to view details</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-6)' }}>
              <div>
                <h2>Report Details</h2>
                <span className={clsx('badge', 
                  selectedReport.status === 'pending' ? 'badge-warning' : 
                  selectedReport.status === 'resolved' ? 'badge-success' : 'badge-error'
                )} style={{ marginTop: 8, display: 'inline-block' }}>
                  {selectedReport.status.toUpperCase()}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--n500)' }}>Target ID</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', marginBottom: 8 }}>{selectedReport.target_id}</div>
                {['profile', 'avatar', 'about'].includes(selectedReport.target_type) && (
                  <button 
                    onClick={() => navigate(`/users/${selectedReport.target_id}`)}
                    className="btn btn-outline"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  >
                    <User size={14} style={{ marginRight: 4 }} />
                    View User Profile
                  </button>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--n50)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-6)' }}>
              <h4 style={{ marginBottom: 'var(--spacing-2)', color: 'var(--n900)' }}>Reason for Report:</h4>
              <p style={{ color: 'var(--n700)', whiteSpace: 'pre-wrap' }}>"{selectedReport.reason}"</p>
            </div>

            <div style={{ backgroundColor: 'var(--p50)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-6)' }}>
              <h4 style={{ marginBottom: 'var(--spacing-2)', color: 'var(--p900)' }}>Reporter Info:</h4>
              <p style={{ margin: 0, color: 'var(--p700)' }}>
                <strong>Name:</strong> {selectedReport.reporter?.first_name} {selectedReport.reporter?.last_name}<br/>
                <strong>Email:</strong> {selectedReport.reporter?.email}
              </p>
            </div>

            {selectedReport.admin_comment && (
              <div style={{ borderLeft: '4px solid var(--n300)', paddingLeft: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
                <h4 style={{ marginBottom: 'var(--spacing-2)', color: 'var(--n900)' }}>Admin Comment:</h4>
                <p style={{ color: 'var(--n700)' }}>{selectedReport.admin_comment}</p>
              </div>
            )}

            {selectedReport.status === 'pending' && (
              <div style={{ borderTop: '1px solid var(--n200)', paddingTop: 'var(--spacing-6)', display: 'flex', gap: 'var(--spacing-4)' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, backgroundColor: 'var(--success)' }}
                  onClick={() => handleAction('resolved')}
                  disabled={updateStatus.isPending}
                >
                  <Check size={18} style={{ marginRight: 8 }} />
                  Mark Resolved
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ flex: 1 }}
                  onClick={() => handleAction('dismissed')}
                  disabled={updateStatus.isPending}
                >
                  <X size={18} style={{ marginRight: 8 }} />
                  Dismiss Report
                </button>
              </div>
            )}
            
            <div style={{ marginTop: 'var(--spacing-6)', paddingTop: 'var(--spacing-4)', borderTop: '1px solid var(--n200)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--n500)', margin: 0 }}>
                To view the actual content, copy the Target ID and search for it in the Profiles or Reviews moderation tabs.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
