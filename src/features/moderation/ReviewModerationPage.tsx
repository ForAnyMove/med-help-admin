import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { Check, X, Star, Trash2, Edit3 } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/Modal';

export const ReviewModerationPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('reason1');
  const [rejectComment, setRejectComment] = useState('');

  const { data: listData, isLoading } = useQuery({
    queryKey: ['moderationReviews', statusFilter],
    queryFn: () => api.get<any>(`/moderation/reviews?status=${statusFilter}&limit=50`)
  });

  const updateStatus = useMutation({
    mutationFn: ({ status, comment }: { status: 'verified' | 'rejected', comment?: string }) => 
      api.put(`/moderation/reviews/${selectedReviewId}`, { status, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationReviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setSelectedReviewId(null);
      setIsRejectModalOpen(false);
      setRejectComment('');
      setRejectReason('reason1');
    }
  });

  const deleteStatus = useMutation({
    mutationFn: () => api.delete(`/moderation/reviews/${selectedReviewId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moderationReviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      setSelectedReviewId(null);
    }
  });

  const handleApprove = () => {
    if (window.confirm(t('common.confirmAction', { action: t('common.approve') }))) {
      updateStatus.mutate({ status: 'verified' });
    }
  };

  const handleSendForEdit = () => {
    let finalComment = t(`moderation.${rejectReason}`);
    if (rejectReason === 'other') {
      if (!rejectComment.trim()) return alert(t('moderation.provideReason'));
      finalComment = rejectComment.trim();
    }
    updateStatus.mutate({ status: 'rejected', comment: finalComment });
  };

  const handleDelete = () => {
    if (window.confirm(t('common.confirmAction', { action: t('moderation.deleteReview') }))) {
      deleteStatus.mutate();
    }
  };

  const statusTabs = [
    { id: 'all', label: t('common.all') },
    { id: 'pending', label: t('common.pending') },
    { id: 'verified', label: t('common.verified') },
    { id: 'rejected', label: t('common.rejected') }
  ];

  const selectedReview = listData?.items?.find((r: any) => r.id === selectedReviewId);

  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-6)', height: 'calc(100vh - 64px - 48px)' }}>
      
      {/* Left List Panel */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        {/* Header & Tabs */}
        <div style={{ padding: 'var(--spacing-4)', borderBottom: '1px solid var(--n200)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-4)' }}>{t('moderation.reviewsTitle')}</h3>

          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            {statusTabs.map(tab => (
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
            <div className="flex-center" style={{ padding: '3rem', color: 'var(--n500)' }}>{t('moderation.noReviews')}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {listData?.items?.map((review: any) => (
                <div 
                  key={review.id}
                  onClick={() => setSelectedReviewId(review.id)}
                  style={{ 
                    padding: 'var(--spacing-4)', 
                    borderBottom: '1px solid var(--n200)',
                    cursor: 'pointer',
                    backgroundColor: selectedReviewId === review.id ? 'var(--p50)' : 'transparent',
                    display: 'flex', gap: '1rem', alignItems: 'flex-start'
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--n100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star size={20} color="var(--warning)" fill="var(--warning)" />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{review.rating} / 5</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--n500)' }}>
                        {t('moderation.byPatient')} {review.consultations?.profiles?.first_name} {review.consultations?.profiles?.last_name}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--n700)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {review.feedback || t('moderation.noTextFeedback')}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 12, 
                    backgroundColor: review.moderation_status === 'pending' ? 'var(--warning-bg)' : review.moderation_status === 'verified' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: review.moderation_status === 'pending' ? 'var(--warning)' : review.moderation_status === 'verified' ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {review.moderation_status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Detail Panel */}
      {selectedReview && (
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
          {/* Detail Header */}
          <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--n200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1,2,3,4,5].map(star => (
                  <Star key={star} size={24} color={star <= selectedReview.rating ? 'var(--warning)' : 'var(--n200)'} fill={star <= selectedReview.rating ? 'var(--warning)' : 'transparent'} />
                ))}
              </div>
              <h2 style={{ margin: 0 }}>{selectedReview.rating} / 5</h2>
            </div>
            
            <p style={{ color: 'var(--n500)' }}>
              {t('moderation.postedOn', { date: format(new Date(selectedReview.created_at), 'PPpp') })}
            </p>
            <p style={{ color: 'var(--n500)', marginTop: '4px' }}>
              {t('moderation.byPatient')} <strong>{selectedReview.consultations?.profiles?.first_name} {selectedReview.consultations?.profiles?.last_name}</strong>
            </p>
          </div>

          {/* Detail Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-6)' }}>
            <h4 style={{ marginBottom: '1rem' }}>{t('moderation.feedback')}</h4>
            <div style={{ padding: '1rem', backgroundColor: 'var(--n50)', border: '1px solid var(--n200)', borderRadius: '12px', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '1rem' }}>
              {selectedReview.feedback || <em>{t('moderation.noTextFeedback')}</em>}
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ padding: 'var(--spacing-4)', borderTop: '1px solid var(--n200)', display: 'flex', gap: '1rem', background: 'var(--n50)' }}>
            <button 
              className="btn btn-danger" 
              style={{ flex: 1 }}
              onClick={handleDelete}
              disabled={updateStatus.isPending || deleteStatus.isPending}
            >
              <Trash2 size={18} /> {t('moderation.deleteReview')}
            </button>
            
            {selectedReview.moderation_status !== 'rejected' && (
              <button 
                className="btn btn-outline" 
                style={{ flex: 1, borderColor: 'var(--warning)', color: 'var(--warning)' }}
                onClick={() => setIsRejectModalOpen(true)}
                disabled={updateStatus.isPending || deleteStatus.isPending}
              >
                <Edit3 size={18} /> {t('moderation.sendForEdit')}
              </button>
            )}

            {selectedReview.moderation_status !== 'verified' && selectedReview.moderation_status !== 'approved' && (
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, backgroundColor: 'var(--success)' }}
                onClick={handleApprove}
                disabled={updateStatus.isPending || deleteStatus.isPending}
              >
                <Check size={18} /> {t('common.approve')}
              </button>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title={t('moderation.editReason')}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" name="reason" checked={rejectReason === 'reason1'} onChange={() => setRejectReason('reason1')} />
            {t('moderation.reason1')}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" name="reason" checked={rejectReason === 'reason2'} onChange={() => setRejectReason('reason2')} />
            {t('moderation.reason2')}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" name="reason" checked={rejectReason === 'reason3'} onChange={() => setRejectReason('reason3')} />
            {t('moderation.reason3')}
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="radio" name="reason" checked={rejectReason === 'other'} onChange={() => setRejectReason('other')} />
            {t('moderation.reasonOther')}
          </label>

          {rejectReason === 'other' && (
            <textarea
              className="input"
              rows={3}
              placeholder={t('moderation.provideReason')}
              value={rejectComment}
              onChange={e => setRejectComment(e.target.value)}
            />
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsRejectModalOpen(false)}>
              {t('common.cancel')}
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSendForEdit} disabled={updateStatus.isPending}>
              {t('moderation.sendForEdit')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
