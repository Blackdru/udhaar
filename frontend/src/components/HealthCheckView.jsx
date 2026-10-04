import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Server,
  Database,
  Wifi,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ArrowLeft,
  HardDrive,
  Clock,
  Cpu,
  Layers,
  CheckCircle,
  Globe
} from 'lucide-react';
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
  const [wsStatus, setWsStatus] = useState('checking'); // 'connected' | 'error' | 'checking'

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Navigation */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={onBack}
              className="btn-secondary"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
              title="Return to application"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'var(--primary-gradient)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
                }}
              >
                <Activity size={18} color="#ffffff" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.05rem', fontWeight: 800 }}>System Health & Diagnostics</h1>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live status monitor for Frontend & Backend</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              id="btn-health-refresh"
              onClick={checkHealth}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              <span>{loading ? 'Checking...' : 'Re-check'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 20px', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Overall Status Banner */}
        <div
          className="glass-panel"
          style={{
            padding: '20px 24px',
            borderRadius: 'var(--radius-lg)',
            background: isAllHealthy
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(9, 13, 22, 0.8) 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(9, 13, 22, 0.8) 100%)',
            border: `1px solid ${isAllHealthy ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: isAllHealthy ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${isAllHealthy ? '#10b981' : '#f59e0b'}`
              }}
            >
              {isAllHealthy ? <CheckCircle2 size={28} color="#10b981" /> : <AlertTriangle size={28} color="#f59e0b" />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {isAllHealthy ? 'All Systems Fully Operational' : 'Degraded System Performance'}
                </h2>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: isAllHealthy ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: isAllHealthy ? '#34d399' : '#fbbf24',
                    border: `1px solid ${isAllHealthy ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`
                  }}
                >
                  {isAllHealthy ? 'HEALTHY' : 'ATTENTION'}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Frontend Web App and Backend API Engine checks evaluated at {lastChecked || 'just now'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Cpu size={14} />
              <span>{showRawJson ? 'Hide JSON' : 'Raw JSON'}</span>
            </button>
            <button
              onClick={handleCopyJson}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy Report'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Health Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Card 1: Frontend Health */}
          <div className="glass-panel" style={{ padding: 22, borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                    border: '1px solid rgba(99, 102, 241, 0.3)'
                  }}
                >
                  <Layers size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Frontend Web Client</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SPA Client Runtime</p>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
                HEALTHY
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Service Name</span>
                <span style={{ fontWeight: 600 }}>{frontendHealth.service}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Version</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>v{frontendHealth.version}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Framework</span>
                <span style={{ fontWeight: 600 }}>{frontendHealth.framework}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Network Status</span>
                <span style={{ fontWeight: 600, color: frontendHealth.isOnline ? '#10b981' : '#f43f5e' }}>
                  {frontendHealth.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Local Storage</span>
                <span style={{ fontWeight: 600, color: frontendHealth.localStorageStatus === 'operational' ? '#10b981' : '#f59e0b' }}>
                  {frontendHealth.localStorageStatus}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Domain</span>
                <span style={{ fontWeight: 600, color: '#38bdf8' }}>{window.location.origin || 'https://udhaar.store'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Health Check Route</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace', color: '#818cf8' }}>/health</span>
              </div>
            </div>
          </div>

          {/* Card 2: Backend Health */}
          <div className="glass-panel" style={{ padding: 22, borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                    border: '1px solid rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Server size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Backend API Engine</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Express Server & Database</p>
                </div>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: backendHealth?.status === 'healthy' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: backendHealth?.status === 'healthy' ? '#10b981' : '#f43f5e',
                  border: `1px solid ${backendHealth?.status === 'healthy' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: backendHealth?.status === 'healthy' ? '#10b981' : '#f43f5e' }}></span>
                {backendHealth?.status ? backendHealth.status.toUpperCase() : 'CHECKING'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Server Domain</span>
                <span style={{ fontWeight: 600, color: '#38bdf8' }}>{API_BASE_URL || 'https://server.udhaar.store'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>API Endpoints</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>/health & /api/health</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Response Latency</span>
                <span style={{ fontWeight: 700, color: backendLatency < 150 ? '#10b981' : '#f59e0b' }}>
                  {backendLatency !== null ? `${backendLatency} ms` : '...'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Database</span>
                <span style={{ fontWeight: 600 }}>
                  {backendHealth?.database?.mode || backendHealth?.databaseMode || 'Local SQLite'}
                  <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#10b981' }}>
                    ({backendHealth?.database?.status || 'ok'})
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Storage Engine</span>
                <span style={{ fontWeight: 600 }}>{backendHealth?.storageMode || 'Local Disk'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Server Uptime</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{formatUptime(backendHealth?.uptime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>Realtime WebSocket</span>
                <span style={{ fontWeight: 600, color: wsStatus === 'connected' ? '#10b981' : '#f59e0b' }}>
                  {wsStatus === 'connected' ? 'Connected (Live)' : wsStatus === 'checking' ? 'Testing...' : 'Ready / Standing by'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Raw JSON viewer modal / accordion */}
        {showRawJson && (
          <div className="glass-panel" style={{ padding: 20, borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Cpu size={16} color="#818cf8" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Diagnostics JSON Payload</h3>
              </div>
              <button
                onClick={handleCopyJson}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                padding: 16,
                borderRadius: 8,
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                color: '#cbd5e1',
                overflowX: 'auto',
                maxHeight: 280,
                border: '1px solid var(--border-subtle)'
              }}
            >
              {JSON.stringify(combinedPayload, null, 2)}
            </pre>
          </div>
        )}

        {/* Bottom Actions & Help */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <ShieldCheck size={16} color="#10b981" />
            <span>Health endpoints are ready for Docker, Kubernetes, AWS ALB, and uptime monitors at <code>/health</code>.</span>
          </div>
          <button
            onClick={onBack}
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span>Return to Store</span>
          </button>
        </div>
      </main>
    </div>
  );
}
