import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { Search, Building2, ChevronRight, FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { downloadCSV } from '../../utils/export';

export const OrganizationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['organizations_crm', statusFilter, searchQuery],
    queryFn: () => api.get<any>(`/organizations?status=${statusFilter}&search=${searchQuery}&limit=50`)
  });

  const filteredOrgs = data?.items;

  const handleExport = () => {
    if (!filteredOrgs || filteredOrgs.length === 0) return;
    const exportData = filteredOrgs.map((o: any) => ({
      ID: o.id,
      Name: o.name || 'N/A',
      Address: o.address || 'N/A',
      Phone: o.phone || 'N/A',
      Status: o.doc_verification_status,
      Created_At: o.created_at ? format(new Date(o.created_at), 'yyyy-MM-dd HH:mm') : 'N/A',
    }));
    downloadCSV(exportData, 'organizations_export');
  };

  return (
    <div className="card" style={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--n200)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={24} color="var(--p500)" />
            {t('sidebar.organizations')} (CRM)
          </h2>
          <button className="btn btn-outline" onClick={handleExport} disabled={!filteredOrgs?.length}>
            <FileDown size={18} /> Export CSV
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={18} color="var(--n500)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ width: '100%', paddingLeft: '40px' }}
            />
          </div>

          {/* Status Filter */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="all">Status (All)</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected / Blocked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--n50)', zIndex: 1 }}>
            <tr>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>Organization</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>Contact</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>Registered</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>Status</th>
              <th style={{ padding: '12px 24px', textAlign: 'right', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--n500)' }}>{t('common.loading')}</td>
              </tr>
            ) : filteredOrgs?.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--n500)' }}>No organizations found</td>
              </tr>
            ) : (
              filteredOrgs?.map((org: any) => (
                <tr 
                  key={org.id} 
                  style={{ borderBottom: '1px solid var(--n100)', cursor: 'pointer' }} 
                  className="table-row-hover"
                  onClick={() => navigate(`/organizations/${org.id}`)}
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--n900)' }}>{org.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--n500)', marginTop: '4px' }}>{org.address}</div>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '0.875rem' }}>{org.phone || 'N/A'}</td>
                  <td style={{ padding: '16px 24px', fontSize: '0.875rem', color: 'var(--n600)' }}>
                    {format(new Date(org.created_at), 'PP')}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      backgroundColor: org.doc_verification_status === 'verified' ? 'var(--success-bg)' : org.doc_verification_status === 'pending' ? 'var(--warning-bg)' : 'var(--danger-bg)',
                      color: org.doc_verification_status === 'verified' ? 'var(--success)' : org.doc_verification_status === 'pending' ? 'var(--warning)' : 'var(--danger)',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      fontWeight: 600
                    }}>
                      {org.doc_verification_status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <ChevronRight size={20} color="var(--n400)" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .table-row-hover:hover {
          background-color: var(--n50);
        }
      `}</style>
    </div>
  );
};
