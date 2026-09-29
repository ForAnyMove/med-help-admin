import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Edit2, ShieldOff, CheckCircle, Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { useAuth } from '../auth/AuthContext';

type AdminData = {
  id: string;
  email: string;
  display_name: string;
  admin_role: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
};

export const AdminManagementPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { admin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminData | null>(null);

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm({
    defaultValues: { email: '', password: '', displayName: '', role: 'admin', isActive: true }
  });

  const { data: admins, isLoading } = useQuery<AdminData[]>({
    queryKey: ['admins'],
    queryFn: () => api.get('/admins')
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admins', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      closeModal();
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to create admin');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/admins/${editingAdmin?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      closeModal();
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to update admin');
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to deactivate admin');
    }
  });

  const filteredAdmins = admins?.filter(a => 
    a.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setEditingAdmin(null);
    reset({ email: '', password: '', displayName: '', role: 'admin', isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (adm: AdminData) => {
    setEditingAdmin(adm);
    setValue('email', adm.email);
    setValue('displayName', adm.display_name);
    setValue('role', adm.admin_role);
    setValue('isActive', adm.is_active);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAdmin(null);
    reset();
  };

  const onSubmit = (data: any) => {
    if (editingAdmin) {
      updateMutation.mutate({ displayName: data.displayName, role: data.role, isActive: data.isActive });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDeactivate = (adm: AdminData) => {
    if (adm.id === admin?.id) {
      alert("You cannot deactivate your own account.");
      return;
    }
    
    if (window.confirm(t('admins.deactivateConfirm'))) {
      deactivateMutation.mutate(adm.id);
    }
  };

  if (admin?.role !== 'super_admin') {
    return (
      <div className="flex-center" style={{ height: '50vh', flexDirection: 'column', gap: '1rem' }}>
        <Shield size={48} color="var(--danger)" />
        <h2>Access Denied</h2>
        <p>You must be a super_admin to view this page.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--n200)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={24} color="var(--p500)" />
            {t('admins.title')}
          </h2>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> {t('admins.add')}
          </button>
        </div>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} color="var(--n500)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder={t('admins.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ width: '100%', paddingLeft: '40px' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--n50)', zIndex: 1 }}>
            <tr>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('admins.displayName')}</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('admins.email')}</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('admins.role')}</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('admins.lastLogin')}</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('admins.status')}</th>
              <th style={{ padding: '12px 24px', textAlign: 'right', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('admins.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--n500)' }}>{t('common.loading')}</td>
              </tr>
            ) : filteredAdmins?.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--n500)' }}>{t('admins.noAdmins')}</td>
              </tr>
            ) : (
              filteredAdmins?.map(adm => (
                <tr key={adm.id} style={{ borderBottom: '1px solid var(--n100)' }} className="table-row-hover">
                  <td style={{ padding: '16px 24px', fontWeight: 500 }}>{adm.display_name} {adm.id === admin?.id ? '(You)' : ''}</td>
                  <td style={{ padding: '16px 24px' }}>{adm.email}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: adm.admin_role === 'super_admin' ? 'var(--warning-bg)' : 'var(--p50)', color: adm.admin_role === 'super_admin' ? 'var(--warning)' : 'var(--p700)', fontSize: '0.875rem' }}>
                      {adm.admin_role}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '0.875rem', color: 'var(--n600)' }}>
                    {adm.last_login_at ? format(new Date(adm.last_login_at), 'PPpp') : 'Never'}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {adm.is_active ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '0.875rem' }}>
                        <CheckCircle size={16} /> Active
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--n500)', fontSize: '0.875rem' }}>
                        <ShieldOff size={16} /> Inactive
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ padding: '6px', marginRight: '8px', border: 'none' }} onClick={() => openEditModal(adm)} title={t('admins.edit')}>
                      <Edit2 size={16} />
                    </button>
                    {adm.is_active && adm.id !== admin?.id && (
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', border: 'none', color: 'var(--danger)' }} 
                        onClick={() => handleDeactivate(adm)}
                        disabled={deactivateMutation.isPending}
                        title={t('admins.deactivate')}
                      >
                        <ShieldOff size={16} />
                      </button>
                    )}
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
        
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--bg-card);
          padding: 2rem;
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 400px;
          box-shadow: var(--shadow-md);
        }
      `}</style>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>{editingAdmin ? t('admins.editExisting') : t('admins.addNew')}</h3>
            
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">{t('admins.email')}</label>
                <input 
                  type="email" 
                  className="input" 
                  disabled={!!editingAdmin}
                  {...register('email', { required: !editingAdmin })}
                  style={{ width: '100%', backgroundColor: editingAdmin ? 'var(--n50)' : 'white' }}
                />
              </div>

              {!editingAdmin && (
                <div>
                  <label className="label">{t('admins.password')}</label>
                  <input 
                    type="password" 
                    className="input" 
                    {...register('password', { required: true, minLength: 6 })}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--n500)', marginTop: '4px' }}>{t('admins.passwordHelp')}</div>
                </div>
              )}

              <div>
                <label className="label">{t('admins.displayName')}</label>
                <input 
                  type="text" 
                  className="input" 
                  {...register('displayName', { required: true })}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label className="label">{t('admins.role')}</label>
                <select className="input" {...register('role')} style={{ width: '100%' }} disabled={editingAdmin?.id === admin?.id}>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {editingAdmin && editingAdmin.id !== admin?.id && (
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                    <input type="checkbox" {...register('isActive')} />
                    <span>Active Account</span>
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={closeModal}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={createMutation.isPending || updateMutation.isPending}>
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
