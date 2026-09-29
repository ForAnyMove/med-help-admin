import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { Search, ChevronRight, X, User, FileText, Star, Clock, Calendar, FileDown } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

import { useLocation } from 'react-router-dom';
import { downloadCSV } from '../../utils/export';

export const ConsultationsPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  
  const [statusFilter, setStatusFilter] = useState((location.state as any)?.filter || 'all');
  const [searchQuery, setSearchQuery] = useState(''); // Note: simple client-side search for now
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: listData, isLoading: isListLoading } = useQuery({
    queryKey: ['consultations', statusFilter, dateFrom, dateTo],
    queryFn: () => {
      let url = `/consultations?status=${statusFilter}&limit=100`;
      if (dateFrom) url += `&dateFrom=${dateFrom}`;
      if (dateTo) url += `&dateTo=${dateTo}`;
      return api.get<any>(url);
    }
  });

  const { data: detailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['consultation', selectedId],
    queryFn: () => api.get<any>(`/consultations/${selectedId}`),
    enabled: !!selectedId
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'var(--success)';
      case 'canceled': return 'var(--danger)';
      case 'occupied': return 'var(--warning)';
      default: return 'var(--p500)'; // scheduled
    }
  };

  const getStatusBg = (status: string) => {
    switch(status) {
      case 'completed': return 'var(--success-bg)';
      case 'canceled': return 'var(--danger-bg)';
      case 'occupied': return 'var(--warning-bg)';
      default: return 'var(--p50)';
    }
  };

  // Basic client-side filtering for search
  const items = listData?.items?.filter((item: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const docName = `${item.doctor?.first_name} ${item.doctor?.last_name}`.toLowerCase();
    const patName = `${item.patient?.first_name} ${item.patient?.last_name}`.toLowerCase();
    return docName.includes(q) || patName.includes(q) || (item.purpose && item.purpose.toLowerCase().includes(q));
  }) || [];

  const handleExport = () => {
    if (!items || items.length === 0) return;
    const exportData = items.map((c: any) => ({
      ID: c.id,
      Doctor_Name: `${c.doctor?.first_name || ''} ${c.doctor?.last_name || ''}`.trim() || 'N/A',
      Patient_Name: `${c.patient?.first_name || ''} ${c.patient?.last_name || ''}`.trim() || 'N/A',
      Status: c.status,
      Scheduled_At: c.scheduled_at ? format(new Date(c.scheduled_at), 'yyyy-MM-dd HH:mm') : 'N/A',
      Duration_Minutes: c.duration_minutes || 0,
      Price: c.price || 0,
    }));
    downloadCSV(exportData, 'consultations_export');
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-6)', height: 'calc(100vh - 64px - 48px)' }}>
      
      {/* Left List Panel */}
      <div className="card" style={{ flex: selectedId ? '0 0 55%' : '1', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, transition: 'flex 0.3s' }}>
        
        {/* Header & Filters */}
        <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--n200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>{t('consultations.title')}</h2>
            <button className="btn btn-outline" onClick={handleExport} disabled={!items?.length}>
              <FileDown size={18} /> Export CSV
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <Search size={16} color="var(--n500)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder={t('consultations.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ width: '100%', paddingLeft: '36px', paddingTop: '8px', paddingBottom: '8px' }}
              />
            </div>

            {/* Status Filter */}
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
              style={{ width: 'auto', minWidth: '150px', padding: '8px 12px' }}
            >
              <option value="all">{t('consultations.status')} ({t('common.all')})</option>
              <option value="scheduled">Scheduled</option>
              <option value="occupied">Occupied</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
            </select>

            {/* Dates */}
            <input 
              type="date" 
              className="input" 
              value={dateFrom} 
              onChange={e => setDateFrom(e.target.value)}
              style={{ width: '140px', padding: '8px 12px' }}
              title={t('consultations.dateFrom')}
            />
            <input 
              type="date" 
              className="input" 
              value={dateTo} 
              onChange={e => setDateTo(e.target.value)}
              style={{ width: '140px', padding: '8px 12px' }}
              title={t('consultations.dateTo')}
            />
          </div>
        </div>

        {/* List Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isListLoading ? (
            <div className="flex-center" style={{ padding: '2rem' }}>{t('common.loading')}</div>
          ) : items.length === 0 ? (
            <div className="flex-center" style={{ padding: '3rem', color: 'var(--n500)' }}>{t('consultations.noConsultations')}</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--n50)', zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('consultations.date')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('consultations.doctor')} & {t('consultations.patient')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('consultations.status')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: '1px solid var(--n200)' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedId(item.id)}
                    style={{ borderBottom: '1px solid var(--n100)', cursor: 'pointer', backgroundColor: selectedId === item.id ? 'var(--p50)' : 'transparent' }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 500 }}>{format(new Date(item.scheduled_at), 'MMM dd, yyyy')}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--n500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> {format(new Date(item.scheduled_at), 'HH:mm')} ({item.duration_minutes}m)
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.875rem' }}>
                        <span style={{ color: 'var(--n500)' }}>Doc:</span> <strong>{item.doctor?.first_name} {item.doctor?.last_name}</strong>
                      </div>
                      <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>
                        <span style={{ color: 'var(--n500)' }}>Pat:</span> <strong>{item.patient?.first_name} {item.patient?.last_name}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                        backgroundColor: getStatusBg(item.status), color: getStatusColor(item.status)
                      }}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <ChevronRight size={20} color="var(--n400)" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right Detail Panel */}
      {selectedId && (
        <div className="card" style={{ flex: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          {isDetailLoading || !detailData ? (
            <div className="flex-center" style={{ flex: 1 }}>{t('common.loading')}</div>
          ) : (
            <>
              {/* Detail Header */}
              <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--n200)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Calendar size={20} color="var(--p600)" />
                    <h2 style={{ margin: 0 }}>{format(new Date(detailData.scheduled_at), 'PPpp')}</h2>
                  </div>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                    backgroundColor: getStatusBg(detailData.status), color: getStatusColor(detailData.status)
                  }}>
                    {detailData.status.toUpperCase()}
                  </span>
                </div>
                <button className="btn btn-outline" style={{ padding: '4px', border: 'none' }} onClick={() => setSelectedId(null)}>
                  <X size={24} />
                </button>
              </div>

              {/* Detail Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-6)' }}>
                
                {/* Participants */}
                <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--n500)' }}>{t('consultations.doctor')}</h4>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {detailData.doctor?.avatar_url ? (
                        <img src={detailData.doctor.avatar_url} alt="doc" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : <User size={48} color="var(--n300)" />}
                      <div>
                        <div style={{ fontWeight: 600 }}>{detailData.doctor?.first_name} {detailData.doctor?.last_name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--n500)' }}>{detailData.doctor?.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--n500)' }}>{t('consultations.patient')}</h4>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {detailData.patient?.avatar_url ? (
                        <img src={detailData.patient.avatar_url} alt="pat" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : <User size={48} color="var(--n300)" />}
                      <div>
                        <div style={{ fontWeight: 600 }}>{detailData.patient?.first_name} {detailData.patient?.last_name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--n500)' }}>{detailData.patient?.email}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ marginBottom: '0.5rem', color: 'var(--n500)' }}>{t('consultations.purpose')}</h4>
                  <div style={{ padding: '1rem', backgroundColor: 'var(--n50)', borderRadius: 'var(--radius-sm)' }}>
                    {detailData.purpose || <em>None</em>}
                  </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid var(--n200)', margin: '2rem 0' }} />

                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={20} /> {t('consultations.results')}
                </h3>
                
                {detailData.consultation_results?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {detailData.consultation_results.map((res: any) => (
                      <div key={res.id} style={{ padding: '1.5rem', border: '1px solid var(--n200)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ marginBottom: '1rem' }}>
                          <div className="label">{t('consultations.diagnosis')}</div>
                          <div style={{ fontWeight: 500 }}>{res.diagnosis || '-'}</div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                          <div className="label">{t('consultations.prescription')}</div>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{res.prescription || '-'}</div>
                        </div>
                        <div>
                          <div className="label">{t('consultations.notes')}</div>
                          <div style={{ whiteSpace: 'pre-wrap', color: 'var(--n600)' }}>{res.notes || '-'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--n500)', fontStyle: 'italic' }}>{t('consultations.noResults')}</p>
                )}

                <hr style={{ border: 'none', borderTop: '1px solid var(--n200)', margin: '2rem 0' }} />

                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star size={20} /> {t('consultations.rating')}
                </h3>

                {detailData.consultation_ratings?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {detailData.consultation_ratings.map((rating: any) => (
                      <div key={rating.id} style={{ padding: '1rem', backgroundColor: 'var(--n50)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {[1,2,3,4,5].map(star => (
                              <Star key={star} size={16} color={star <= rating.rating ? 'var(--warning)' : 'var(--n300)'} fill={star <= rating.rating ? 'var(--warning)' : 'transparent'} />
                            ))}
                          </div>
                          <span style={{ fontSize: '0.875rem', color: 'var(--n500)' }}>{format(new Date(rating.created_at), 'PPpp')}</span>
                        </div>
                        <div>{rating.feedback || <em>{t('consultations.noRating')}</em>}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'var(--n500)', fontStyle: 'italic' }}>{t('consultations.noRating')}</p>
                )}

              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        .table-row-hover:hover {
          background-color: var(--n50);
        }
      `}</style>
    </div>
  );
};
