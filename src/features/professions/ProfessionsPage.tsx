import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';

type ProfessionData = {
  id: string;
  code: string;
  en: string;
  ru: string;
  doctorsCount: number;
};

export const ProfessionsPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<ProfessionData | null>(null);

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm({
    defaultValues: { code: '', en: '', ru: '' }
  });

  const { data: professions, isLoading } = useQuery<ProfessionData[]>({
    queryKey: ['professions'],
    queryFn: () => api.get('/professions')
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/professions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professions'] });
      closeModal();
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to create profession');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/professions/${editingProf?.code}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professions'] });
      closeModal();
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to update profession');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (code: string) => api.delete(`/professions/${code}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professions'] });
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to delete profession');
    }
  });

  const filteredProfessions = professions?.filter(p => 
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.ru.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddModal = () => {
    setEditingProf(null);
    reset({ code: '', en: '', ru: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (prof: ProfessionData) => {
    setEditingProf(prof);
    setValue('code', prof.code);
    setValue('en', prof.en);
    setValue('ru', prof.ru);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProf(null);
    reset();
  };

  const onSubmit = (data: any) => {
    if (editingProf) {
      updateMutation.mutate({ en: data.en, ru: data.ru });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (prof: ProfessionData) => {
    if (prof.doctorsCount > 0) {
      alert(t('professions.deleteErrorInUse', { count: prof.doctorsCount }));
      return;
    }
    
    if (window.confirm(t('professions.deleteConfirm'))) {
      deleteMutation.mutate(prof.code);
    }
  };

  return (
    <div className="card" style={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--n200)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>{t('professions.title')}</h2>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> {t('professions.add')}
          </button>
        </div>
        
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} color="var(--n500)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder={t('professions.search')}
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
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('professions.code')}</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('professions.enName')}</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('professions.ruName')}</th>
              <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('professions.doctorsCount')}</th>
              <th style={{ padding: '12px 24px', textAlign: 'right', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('professions.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--n500)' }}>{t('common.loading')}</td>
              </tr>
            ) : filteredProfessions?.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--n500)' }}>{t('professions.noProfessions')}</td>
              </tr>
            ) : (
              filteredProfessions?.map(prof => (
                <tr key={prof.id} style={{ borderBottom: '1px solid var(--n100)' }} className="table-row-hover">
                  <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontWeight: 500 }}>{prof.code}</td>
                  <td style={{ padding: '16px 24px' }}>{prof.en}</td>
                  <td style={{ padding: '16px 24px' }}>{prof.ru}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: prof.doctorsCount > 0 ? 'var(--p50)' : 'var(--n100)', color: prof.doctorsCount > 0 ? 'var(--p700)' : 'var(--n600)', fontWeight: 500 }}>
                      {prof.doctorsCount}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="btn btn-outline" style={{ padding: '6px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => openEditModal(prof)} title={t('professions.edit')}>
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px', border: 'none', color: prof.doctorsCount > 0 ? 'var(--n300)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                        onClick={() => handleDelete(prof)}
                        disabled={prof.doctorsCount > 0 || deleteMutation.isPending}
                        title={t('professions.delete')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
          animation: fadeIn 0.2s ease-out;
        }

        .modal-content {
          background: var(--bg-card);
          padding: 2rem;
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 400px;
          box-shadow: var(--shadow-md);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>{editingProf ? t('professions.editExisting') : t('professions.addNew')}</h3>
              <button className="btn btn-outline" style={{ border: 'none', padding: '4px' }} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">{t('professions.code')} (e.g. therapist)</label>
                <input 
                  type="text" 
                  className="input" 
                  disabled={!!editingProf}
                  {...register('code', { required: true, pattern: /^[a-z0-9_]+$/ })}
                  placeholder="lower_case_code"
                  style={{ width: '100%', backgroundColor: editingProf ? 'var(--n50)' : 'white' }}
                />
                {errors.code && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>Required. lowercase and underscores only.</span>}
              </div>

              <div>
                <label className="label">{t('professions.enName')}</label>
                <input 
                  type="text" 
                  className="input" 
                  {...register('en', { required: true })}
                  style={{ width: '100%' }}
                />
                {errors.en && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>Required</span>}
              </div>

              <div>
                <label className="label">{t('professions.ruName')}</label>
                <input 
                  type="text" 
                  className="input" 
                  {...register('ru', { required: true })}
                  style={{ width: '100%' }}
                />
                {errors.ru && <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>Required</span>}
              </div>

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
