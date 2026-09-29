import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { CreditCard, Repeat, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export const BillingPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'transactions' | 'subscriptions'>('transactions');

  const { data: transactions, isLoading: isTxLoading } = useQuery({
    queryKey: ['billing', 'transactions'],
    queryFn: () => api.get<any[]>('/billing/transactions'),
    enabled: activeTab === 'transactions'
  });

  const { data: subscriptions, isLoading: isSubLoading } = useQuery({
    queryKey: ['billing', 'subscriptions'],
    queryFn: () => api.get<any[]>('/billing/subscriptions'),
    enabled: activeTab === 'subscriptions'
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return <CheckCircle size={16} color="var(--success)" />;
      case 'failed':
      case 'canceled':
        return <XCircle size={16} color="var(--danger)" />;
      case 'pending':
        return <Clock size={16} color="var(--warning)" />;
      case 'past_due':
        return <AlertCircle size={16} color="var(--danger)" />;
      case 'refunded':
        return <Clock size={16} color="var(--n500)" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return 'var(--success)';
      case 'failed':
      case 'canceled':
      case 'past_due':
        return 'var(--danger)';
      case 'pending':
        return 'var(--warning)';
      default:
        return 'var(--n600)';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100); // Assuming amount is in cents
  };

  return (
    <div className="card" style={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ padding: 'var(--spacing-6)', borderBottom: '1px solid var(--n200)' }}>
        <h2 style={{ margin: '0 0 1.5rem 0' }}>{t('billing.title')}</h2>
        
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--n200)' }}>
          <button
            className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', 
              borderBottom: activeTab === 'transactions' ? '2px solid var(--p500)' : '2px solid transparent',
              color: activeTab === 'transactions' ? 'var(--p600)' : 'var(--n500)',
              background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              cursor: 'pointer', fontWeight: 500
            }}
          >
            <CreditCard size={18} /> {t('billing.tabTransactions')}
          </button>
          <button
            className={`tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscriptions')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', 
              borderBottom: activeTab === 'subscriptions' ? '2px solid var(--p500)' : '2px solid transparent',
              color: activeTab === 'subscriptions' ? 'var(--p600)' : 'var(--n500)',
              background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              cursor: 'pointer', fontWeight: 500
            }}
          >
            <Repeat size={18} /> {t('billing.tabSubscriptions')}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'transactions' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--n50)', zIndex: 1 }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('billing.txId')}</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('billing.date')}</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('billing.user')}</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('billing.type')}</th>
                <th style={{ padding: '12px 24px', textAlign: 'right', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('billing.amount')}</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('billing.status')}</th>
              </tr>
            </thead>
            <tbody>
              {isTxLoading ? (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--n500)' }}>{t('common.loading')}</td></tr>
              ) : transactions?.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--n500)' }}>{t('billing.noTransactions')}</td></tr>
              ) : (
                transactions?.map((tx: any) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--n100)' }} className="table-row-hover">
                    <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontSize: '0.875rem' }}>{tx.id}</td>
                    <td style={{ padding: '16px 24px', fontSize: '0.875rem' }}>{format(new Date(tx.created_at), 'PPpp')}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 500 }}>{tx.user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--n500)' }}>{tx.user.email}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--n100)', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                        {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: getStatusColor(tx.status), fontSize: '0.875rem', textTransform: 'capitalize', fontWeight: 500 }}>
                        {getStatusIcon(tx.status)} {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'subscriptions' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--n50)', zIndex: 1 }}>
              <tr>
                <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('billing.txId')}</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('billing.user')}</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('billing.plan')}</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('billing.amount')}</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('billing.nextBilling')}</th>
                <th style={{ padding: '12px 24px', textAlign: 'left', borderBottom: '1px solid var(--n200)', color: 'var(--n500)', fontWeight: 500 }}>{t('billing.status')}</th>
              </tr>
            </thead>
            <tbody>
              {isSubLoading ? (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--n500)' }}>{t('common.loading')}</td></tr>
              ) : subscriptions?.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--n500)' }}>{t('billing.noSubscriptions')}</td></tr>
              ) : (
                subscriptions?.map((sub: any) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid var(--n100)' }} className="table-row-hover">
                    <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontSize: '0.875rem' }}>{sub.id}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 500 }}>{sub.user.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--n500)' }}>{sub.user.email}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>{sub.plan}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 500 }}>
                      {formatCurrency(sub.amount, sub.currency)} / mo
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '0.875rem' }}>
                      {format(new Date(sub.current_period_end), 'PP')}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: getStatusColor(sub.status), fontSize: '0.875rem', textTransform: 'capitalize', fontWeight: 500 }}>
                        {getStatusIcon(sub.status)} {sub.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .table-row-hover:hover {
          background-color: var(--n50);
        }
      `}</style>
    </div>
  );
};
