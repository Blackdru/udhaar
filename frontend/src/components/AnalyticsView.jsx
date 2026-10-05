import React, { useState, useEffect } from 'react';

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
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading store analytics...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: 40, color: 'var(--ruby-text)' }}>{error}</div>;
  }

  const { summary, dailyTrend = [], topDebtors = [] } = data || {};
  const maxDayAmount = Math.max(...dailyTrend.map((d) => d.amount), 1000);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }} className="animate-fade-in">
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="card-surface" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Total Outstanding
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-main)', marginTop: 4 }}>
            ₹{Number(summary?.totalOutstanding || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--emerald-text)', fontWeight: 600 }}>
            {summary?.totalActiveTransactions || 0} active ledger entries
          </span>
        </div>

        <div className="card-surface" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Today's Udhaar
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--emerald)', marginTop: 4 }}>
            ₹{Number(summary?.todayUdhaar || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {summary?.todayCount || 0} records today
          </span>
        </div>

        <div className="card-surface" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            This Month's Udhaar
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--amber)', marginTop: 4 }}>
            ₹{Number(summary?.thisMonthUdhaar || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {summary?.thisMonthCount || 0} monthly transactions
          </span>
        </div>

        <div className="card-surface" style={{ padding: '20px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Customer Accounts
          </span>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-main)', marginTop: 4 }}>
            {summary?.totalCustomers || 0}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Avg Ticket: ₹{Number(summary?.averageTicketSize || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Charts & Top Customers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Daily Trend Bar Chart */}
        <div className="card-surface" style={{ padding: '22px' }}>
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Daily Udhaar (Past 7 Days)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Credit volume recorded via QR & register
            </p>
          </div>

          {dailyTrend.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No daily transactions in past 7 days</p>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 180, paddingTop: 16 }}>
              {dailyTrend.map((item, idx) => {
                const heightPercent = Math.max(10, Math.round((item.amount / maxDayAmount) * 100));
                const dayLabel = new Date(item.day).toLocaleDateString('en-IN', { weekday: 'short' });
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      ₹{item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}k` : item.amount}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 32,
                        height: `${heightPercent}%`,
                        background: 'var(--primary)',
                        borderRadius: '4px 4px 1px 1px',
                        transition: 'height 0.3s ease'
                      }}
                      title={`${item.day}: ₹${item.amount} (${item.count} entries)`}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Outstanding Customers */}
        <div className="card-surface" style={{ padding: '22px' }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Top Outstanding Accounts
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Highest customer credit balances
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topDebtors.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>No customer credit recorded yet</p>
            ) : (
              topDebtors.map((debtor, i) => {
                const totalOut = summary?.totalOutstanding || 1;
                const sharePercent = Math.min(100, Math.round((debtor.outstanding / totalOut) * 100));
                return (
                  <div
                    key={debtor.id}
                    onClick={() => onSelectCustomer && onSelectCustomer(debtor.id)}
                    className="card-interactive"
                    style={{
                      padding: '12px 14px',
                      background: 'var(--bg-page)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {i + 1}
                        </span>
                        <div>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>{debtor.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 6 }}>+91 {debtor.mobile}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                        ₹{Number(debtor.outstanding).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div style={{ height: 4, background: 'var(--border-subtle)', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${sharePercent}%`,
                          height: '100%',
                          background: 'var(--primary)',
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
