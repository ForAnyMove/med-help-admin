import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Search, ChevronRight, User, FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { downloadCSV } from '../../utils/export';

export const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Basic debouncing for search could be added here, keeping simple for now
  
  const { data, isLoading } = useQuery({
    queryKey: ['users', roleFilter, statusFilter, searchQuery],
    queryFn: () => api.get<any>(`/users?role=${roleFilter}&status=${statusFilter}&search=${searchQuery}&limit=50`)
  });

  const filteredUsers = data?.items;

  const handleExport = () => {
    if (!filteredUsers || filteredUsers.length === 0) return;
    const exportData = filteredUsers.map((u: any) => ({
      ID: u.id,
      Name: u.name || 'N/A',
      Email: u.email,
      Role: u.role,
      Phone: u.phone || 'N/A',
      Created_At: u.created_at,
      Is_Blocked: u.is_blocked ? 'Yes' : 'No',
    }));
    downloadCSV(exportData, 'users_export');
  };

  return (
    <div className="card" style={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      
      {/* Header & Filters */}
      <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--n200)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>{t('users.title')}</h2>
          <button className="btn btn-outline" onClick={handleExport} disabled={!filteredUsers?.length}>
            <FileDown size={18} /> Export CSV
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={18} color="var(--n500)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder={t('users.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ width: '100%', paddingLeft: '40px' }}
            />
          </div>

          {/* Role Filter */}
          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input"
            style={{ width: '160px' }}
          >
            <option value="all">{t('users.role')} ({t('common.all')})</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>

          {/* Status Filter */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
            style={{ width: '160px' }}
          >
            <option value="all">{t('users.status')} ({t('common.all')})</option>
            <option value="active">{t('users.active')}</option>
            <option value="blocked">{t('users.blocked')}</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--n50)', zIndex: 1 }}>
            <tr>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>User</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('users.role')}</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('users.registeredAt')}</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('users.status')}</th>
              <th style={{ padding: '12px 24px', textAlign: 'right', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--n500)' }}>{t('common.loading')}</td>
              </tr>
            ) : data?.items?.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--n500)' }}>{t('users.noUsers')}</td>
              </tr>
            ) : (
              data?.items?.map((user: any) => (
                <tr 
                  key={user.id} 
                  style={{ borderBottom: '1px solid var(--n100)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onClick={() => navigate(`/users/${user.id}`)}
                  className="table-row-hover"
                >
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--n100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={20} color="var(--n500)" />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.first_name} {user.last_name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--n500)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--n100)', fontSize: '0.875rem' }}>
                      {user.role || 'none'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--n700)', fontSize: '0.875rem' }}>
                    {format(new Date(user.created_at), 'MMM dd, yyyy')}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {user.is_blocked ? (
                      <span style={{ color: 'var(--danger)', fontWeight: 500, fontSize: '0.875rem' }}>{t('users.blocked')}</span>
                    ) : (
                      <span style={{ color: 'var(--success)', fontWeight: 500, fontSize: '0.875rem' }}>{t('users.active')}</span>
                    )}
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
