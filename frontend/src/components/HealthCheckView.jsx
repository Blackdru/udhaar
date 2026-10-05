import React, { useState, useEffect, useCallback } from 'react';
import { getWsUrl, API_BASE_URL } from '../utils/api';

export default function HealthCheckView({ onBack }) {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  // Frontend State
  const [frontendHealth, setFrontendHealth] = useState({
    status: 'healthy',
    service: 'Udhaar Frontend Web Client',
    version: '1.0.0',
    framework: 'React 19 + Vite',
    environment: import.meta.env.MODE || 'production',
    isOnline: navigator.onLine,
    localStorageStatus: 'unknown',
    clientTimestamp: new Date().toISOString()
  });

  // Backend State
  const [backendHealth, setBackendHealth] = useState(null);
  const [backendLatency, setBackendLatency] = useState(null);
  const [backendError, setBackendError] = useState(null);

  // WebSocket State
  const [wsStatus, setWsStatus] = useState('checking');

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setBackendError(null);
    const startTime = performance.now();

    // 1. Check Frontend LocalStorage
    let lsOk = 'operational';
    try {
      const testKey = '__health_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
    } catch {
      lsOk = 'restricted';
    }

    setFrontendHealth({
      status: 'healthy',
      service: 'Udhaar Frontend Web Client',
      version: '1.0.0',
      framework: 'React 19 + Vite',
      environment: import.meta.env.MODE || 'production',
      isOnline: navigator.onLine,
      localStorageStatus: lsOk,
      clientTimestamp: new Date().toISOString()
    });

    // 2. Check Backend API Health
    try {
      const apiUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/health` : '/api/health';
      const res = await fetch(apiUrl, {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      const latency = Math.round(performance.now() - startTime);
      setBackendLatency(latency);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      setBackendHealth(data);
    } catch (err) {
      setBackendHealth({
        status: 'unreachable',
        message: err.message || 'Could not connect to backend server'
      });
      setBackendError(err.message);
    }

    // 3. Test WebSocket Connectivity
    try {
      const wsUrl = getWsUrl();
      const socket = new WebSocket(wsUrl);
      const timer = setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          socket.close();
          setWsStatus('unavailable');
        }
      }, 3500);

      socket.onopen = () => {
        clearTimeout(timer);
        setWsStatus('connected');
        socket.close();
      };

      socket.onerror = () => {
        clearTimeout(timer);
        setWsStatus('unavailable');
      };
    } catch {
      setWsStatus('unavailable');
    }

    setLastChecked(new Date().toLocaleTimeString());
    setLoading(false);
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  const isAllHealthy = frontendHealth.status === 'healthy' && backendHealth?.status === 'healthy';

  const combinedPayload = {
    overallStatus: isAllHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    frontend: frontendHealth,
    backend: backendHealth,
    network: {
      latencyMs: backendLatency,
      webSocket: wsStatus,
      navigatorOnline: navigator.onLine
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(combinedPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatUptime = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)' }}>
      {/* Top Header */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={onBack}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.84rem' }}
            >
              ← Back
            </button>
            <div>
              <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>System Diagnostics</h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status monitor for Frontend & Backend</p>
            </div>
          </div>

          <button
            id="btn-health-refresh"
            onClick={checkHealth}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.84rem' }}
          >
            {loading ? 'Checking...' : 'Re-check'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 16px', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Overall Status Banner */}
        <div
          className="card-surface"
          style={{
            padding: '18px 20px',
            borderLeft: `4px solid ${isAllHealthy ? 'var(--emerald)' : 'var(--amber)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {isAllHealthy ? 'All Systems Fully Operational' : 'Degraded System Performance'}
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: isAllHealthy ? 'var(--emerald-bg)' : 'var(--amber-bg)',
                  color: isAllHealthy ? 'var(--emerald-text)' : 'var(--amber-text)',
                  border: `1px solid ${isAllHealthy ? 'var(--emerald-border)' : 'var(--amber-border)'}`
                }}
              >
                {isAllHealthy ? 'HEALTHY' : 'ATTENTION'}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Last evaluated at {lastChecked || 'just now'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="btn-secondary"
              style={{ padding: '7px 12px', fontSize: '0.82rem' }}
            >
              {showRawJson ? 'Hide JSON' : 'Raw JSON'}
            </button>
            <button
              onClick={handleCopyJson}
              className="btn-secondary"
              style={{ padding: '7px 12px', fontSize: '0.82rem' }}
            >
              {copied ? 'Copied!' : 'Copy Report'}
            </button>
          </div>
        </div>

        {/* 2-Column Health Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* Card 1: Frontend Health */}
          <div className="card-surface" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>Frontend Web Client</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SPA Client Runtime</p>
              </div>
              <span className="badge-active">HEALTHY</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Service</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{frontendHealth.service}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Version</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-main)' }}>v{frontendHealth.version}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Framework</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{frontendHealth.framework}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Network</span>
                <span style={{ fontWeight: 600, color: frontendHealth.isOnline ? 'var(--emerald-text)' : 'var(--ruby-text)' }}>
                  {frontendHealth.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Storage</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{frontendHealth.localStorageStatus}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Route</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-main)' }}>/health</span>
              </div>
            </div>
          </div>

          {/* Card 2: Backend Health */}
          <div className="card-surface" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>Backend API Engine</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Express Server & Database</p>
              </div>
              <span className={backendHealth?.status === 'healthy' ? 'badge-active' : 'badge-voided'}>
                {backendHealth?.status ? backendHealth.status.toUpperCase() : 'CHECKING'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Server URL</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{API_BASE_URL || 'Local / Relative Proxy'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Endpoints</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-main)' }}>/health & /api/health</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Latency</span>
                <span style={{ fontWeight: 700, color: backendLatency < 150 ? 'var(--emerald-text)' : 'var(--amber-text)' }}>
                  {backendLatency !== null ? `${backendLatency} ms` : '...'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Database</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {backendHealth?.database?.mode || backendHealth?.databaseMode || 'Local SQLite'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Storage Engine</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{backendHealth?.storageMode || 'Local Disk'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)' }}>WebSocket</span>
                <span style={{ fontWeight: 600, color: wsStatus === 'connected' ? 'var(--emerald-text)' : 'var(--text-muted)' }}>
                  {wsStatus === 'connected' ? 'Live Connected' : wsStatus === 'checking' ? 'Testing...' : 'Ready / Standing by'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Raw JSON viewer */}
        {showRawJson && (
          <div className="card-surface" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>Diagnostics JSON</h3>
              <button
                onClick={handleCopyJson}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.76rem' }}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre
              style={{
                background: 'var(--bg-subtle)',
                padding: 14,
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                color: 'var(--text-main)',
                overflowX: 'auto',
                maxHeight: 260,
                border: '1px solid var(--border-subtle)'
              }}
            >
              {JSON.stringify(combinedPayload, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
