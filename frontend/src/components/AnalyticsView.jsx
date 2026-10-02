import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, CreditCard, Calendar, BarChart3, AlertCircle } from 'lucide-react';

export default function AnalyticsView({ token, onSelectCustomer }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/owner/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.message || 'Unable to load analytics.');
      }
    } catch (e) {
      setError('Network error while loading analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading Store Analytics...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--accent-rose)' }}>{error}</div>;
  }

  const { summary, dailyTrend = [], topDebtors = [] } = data || {};

  // Find max daily amount for chart scaling
  const maxDayAmount = Math.max(...dailyTrend.map((d) => d.amount), 1000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="animate-fade-in">
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Total Outstanding
            </span>
            <CreditCard size={18} color="#818cf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
            ₹{Number(summary?.totalOutstanding || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
            {summary?.totalActiveTransactions || 0} active credit entries
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Today's Udhaar
            </span>
            <TrendingUp size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#10b981' }}>
            ₹{Number(summary?.todayUdhaar || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {summary?.todayCount || 0} records today
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              This Month's Udhaar
            </span>
            <Calendar size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#f59e0b' }}>
            ₹{Number(summary?.thisMonthUdhaar || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {summary?.thisMonthCount || 0} monthly transactions
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Customer Base
            </span>
            <Users size={18} color="#ec4899" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
            {summary?.totalCustomers || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Avg Ticket: ₹{Number(summary?.averageTicketSize || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Daily Trend Bar Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Daily Udhaar Recorded (Past 7 Days)</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily credit volume recorded via QR & ledger</p>
            </div>
            <BarChart3 size={20} color="#818cf8" />
          </div>

          {dailyTrend.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 40 }}>No daily transactions in past 7 days</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 180, paddingTop: 20 }}>
              {dailyTrend.map((item, idx) => {
                const heightPercent = Math.max(12, Math.round((item.amount / maxDayAmount) * 100));
                const dayLabel = new Date(item.day).toLocaleDateString('en-IN', { weekday: 'short' });
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      ₹{item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}k` : item.amount}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 36,
                        height: `${heightPercent}%`,
                        background: 'linear-gradient(180deg, #6366f1 0%, #4338ca 100%)',
                        borderRadius: '6px 6px 2px 2px',
                        transition: 'height 0.4s ease',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.25)'
                      }}
                      title={`${item.day}: ₹${item.amount} (${item.count} entries)`}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top 5 Outstanding Debtors */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Top Customers by Outstanding</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Highest credit balances in your ledger</p>
            </div>
            <Users size={20} color="#f59e0b" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topDebtors.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 30 }}>No customer credit recorded yet</p>
            ) : (
              topDebtors.map((debtor, i) => {
                const totalOut = summary?.totalOutstanding || 1;
                const sharePercent = Math.min(100, Math.round((debtor.outstanding / totalOut) * 100));
                return (
                  <div
                    key={debtor.id}
                    onClick={() => onSelectCustomer && onSelectCustomer(debtor.id)}
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)')}
                    onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {i + 1}
                        </span>
                        <div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{debtor.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 6 }}>+91 {debtor.mobile}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-heading)' }}>
                        ₹{Number(debtor.outstanding).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Progress distribution bar */}
                    <div style={{ height: 5, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${sharePercent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #6366f1, #f59e0b)',
                          borderRadius: 999
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
