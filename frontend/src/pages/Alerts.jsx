import { useState, useEffect } from 'react';
import Navigation from "../components/Navigation";
import { apiFetch, cToF } from '../api';
import { useAuth } from '../hooks/useAuth';

// Severity config for rendering
const SEVERITY_CONFIG = {
  critical: { bg: '#fef2f2', border: '#fecaca', accent: '#ef4444', label: 'CRITICAL', dot: '#ef4444' },
  warning:  { bg: '#fffbeb', border: '#fde68a', accent: '#f59e0b', label: 'WARNING',  dot: '#f59e0b' },
  info:     { bg: '#eff6ff', border: '#bfdbfe', accent: '#3b82f6', label: 'INFO',     dot: '#3b82f6' },
};

const STATUS_CONFIG = {
  active:       { bg: '#fef2f2', color: '#dc2626', label: 'Active' },
  acknowledged: { bg: '#eff6ff', color: '#2563eb', label: 'Acknowledged' },
  resolved:     { bg: '#f0fdf4', color: '#16a34a', label: 'Resolved' },
};

/**
 * Derive alert events from real sensor readings.
 * Temperatures from the sensor are in Celsius; convert to Fahrenheit before
 * comparing against thresholds (which are stored in Fahrenheit).
 */
function deriveAlertsFromReadings(readings, prefs) {
  if (!readings || readings.length === 0) return [];

  // Thresholds are in Fahrenheit
  const critLow  = parseFloat(prefs?.criticalLow  ?? '91');
  const critHigh = parseFloat(prefs?.criticalHigh ?? '104');
  const optLow   = parseFloat(prefs?.optimalLow   ?? '93');
  const optHigh  = parseFloat(prefs?.optimalHigh  ?? '99');

  const alerts = [];
  let id = 1;

  readings.forEach(r => {
    // Convert Celsius sensor reading to Fahrenheit
    const tf = cToF(parseFloat(r.temperature));
    const d = new Date(r.bucket_at);
    const timeStr = d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (tf < critLow) {
      alerts.push({
        id: id++,
        severity: 'critical',
        status: 'active',
        title: 'Temperature Below Critical Threshold',
        description: `Hive temperature dropped to ${tf.toFixed(1)}°F, below the critical low of ${critLow}°F. Immediate attention required.`,
        time: timeStr,
        temperature: `${tf.toFixed(1)}°F`,
        type: 'Below Range',
      });
    } else if (tf > critHigh) {
      alerts.push({
        id: id++,
        severity: 'critical',
        status: 'active',
        title: 'Temperature Above Critical Threshold',
        description: `Hive temperature rose to ${tf.toFixed(1)}°F, above the critical high of ${critHigh}°F. Immediate attention required.`,
        time: timeStr,
        temperature: `${tf.toFixed(1)}°F`,
        type: 'Above Range',
      });
    } else if (tf < optLow) {
      alerts.push({
        id: id++,
        severity: 'warning',
        status: 'active',
        title: 'Temperature Below Optimal Range',
        description: `Temperature at ${tf.toFixed(1)}°F is below the optimal low of ${optLow}°F. Monitor closely.`,
        time: timeStr,
        temperature: `${tf.toFixed(1)}°F`,
        type: 'Below Range',
      });
    } else if (tf > optHigh) {
      alerts.push({
        id: id++,
        severity: 'warning',
        status: 'active',
        title: 'Temperature Above Optimal Range',
        description: `Temperature at ${tf.toFixed(1)}°F is above the optimal high of ${optHigh}°F. Monitor closely.`,
        time: timeStr,
        temperature: `${tf.toFixed(1)}°F`,
        type: 'Above Range',
      });
    } else {
      alerts.push({
        id: id++,
        severity: 'info',
        status: 'resolved',
        title: 'Temperature Within Normal Range',
        description: `Temperature stable at ${tf.toFixed(1)}°F within optimal range (${optLow}–${optHigh}°F).`,
        time: timeStr,
        temperature: `${tf.toFixed(1)}°F`,
        type: 'Normal',
      });
    }
  });

  return alerts;
}

function StatCard({ value, label, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px 22px',
      boxShadow: 'var(--shadow-sm)',
      flex: 1,
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: '32px', fontWeight: 800, color, letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem('asheville_settings_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch {}
  // Defaults in Fahrenheit
  return { criticalLow: '91', criticalHigh: '104', optimalLow: '93', optimalHigh: '99' };
}

export default function Alerts() {
  const { ready: authReady, error: authError } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    if (!authReady) return;
    if (authError) {
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }

    async function fetchAlerts() {
      setLoading(true);
      setError('');
      try {
        const hivesRes = await apiFetch('/api/hives');
        const hives = hivesRes?.hives ?? [];
        if (hives.length === 0) {
          setAlerts([]);
          setLoading(false);
          return;
        }
        const hiveId = hives[0].id;
        // Fetch last 7 days of readings to generate alerts
        const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
        const readingsRes = await apiFetch(`/api/readings/since?hiveId=${hiveId}&since=${since}&order=desc&limit=100`);
        const readings = readingsRes?.readings ?? [];
        const prefs = loadPrefs();
        const derived = deriveAlertsFromReadings(readings, prefs);
        setAlerts(derived);
      } catch (err) {
        setError(err.message || 'Failed to load activity data.');
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAlerts();
  }, [authReady, authError]);

  const filtered = alerts.filter(a => {
    const s = severityFilter === 'all' || a.severity === severityFilter;
    const st = statusFilter === 'all' || a.status === statusFilter;
    return s && st;
  });

  const stats = {
    critical: alerts.filter(a => a.status === 'active' && a.severity === 'critical').length,
    warnings: alerts.filter(a => a.status === 'active' && a.severity === 'warning').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    total: alerts.length,
  };

  const acknowledge = (id) => setAlerts(a => a.map(x => x.id === id ? { ...x, status: 'acknowledged' } : x));
  const resolve = (id) => setAlerts(a => a.map(x => x.id === id ? { ...x, status: 'resolved' } : x));
  const dismiss = (id) => setAlerts(a => a.filter(x => x.id !== id));

  const FilterBtn = ({ value, label, color, active, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: '8px',
        border: active ? 'none' : '1.5px solid var(--border)',
        background: active ? (color || 'var(--navy)') : 'white',
        color: active ? 'white' : 'var(--text-secondary)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Navigation />

      <main style={{ flex: 1, overflow: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '28px 32px 0', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Activity
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'event' : 'events'} found · Based on last 7 days of sensor readings`}
          </div>
        </div>

        <div style={{ padding: '0 32px 32px' }}>
          {/* Stat cards */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <StatCard value={loading ? '…' : stats.critical} label="Active Critical" color="#ef4444" />
            <StatCard value={loading ? '…' : stats.warnings} label="Active Warnings" color="#f59e0b" />
            <StatCard value={loading ? '…' : stats.resolved} label="Normal Readings" color="#22c55e" />
            <StatCard value={loading ? '…' : stats.total} label="Total Events (7d)" color="var(--navy)" />
          </div>

          {/* Filters */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: '20px',
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>Severity:</span>
            <FilterBtn value="all" label="All" active={severityFilter === 'all'} onClick={() => setSeverityFilter('all')} />
            <FilterBtn value="critical" label="Critical" color="#ef4444" active={severityFilter === 'critical'} onClick={() => setSeverityFilter('critical')} />
            <FilterBtn value="warning" label="Warning" color="#f59e0b" active={severityFilter === 'warning'} onClick={() => setSeverityFilter('warning')} />
            <FilterBtn value="info" label="Info" color="#3b82f6" active={severityFilter === 'info'} onClick={() => setSeverityFilter('info')} />

            <div style={{ height: '24px', width: '1px', background: 'var(--border)', margin: '0 4px' }} />

            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '4px' }}>Status:</span>
            <FilterBtn value="active" label="Active" active={statusFilter === 'active'} onClick={() => setStatusFilter('active')} />
            <FilterBtn value="acknowledged" label="Acknowledged" active={statusFilter === 'acknowledged'} onClick={() => setStatusFilter('acknowledged')} />
            <FilterBtn value="resolved" label="Resolved" active={statusFilter === 'resolved'} onClick={() => setStatusFilter('resolved')} />
            <FilterBtn value="all" label="All" active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
          </div>

          {/* Alert list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ background: 'white', borderRadius: '12px', padding: '60px 24px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'pulse 1s infinite' }}>⏳</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>Loading activity data…</div>
              </div>
            ) : error ? (
              <div style={{ background: 'white', borderRadius: '12px', padding: '40px 24px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#ef4444', marginBottom: '8px' }}>Error loading activity</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{error}</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '60px 24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔕</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {alerts.length === 0 ? 'No sensor readings found' : 'No events match these filters'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {alerts.length === 0
                    ? 'Send readings from your sensor to see activity here.'
                    : 'Try adjusting your filters to see more results.'}
                </div>
              </div>
            ) : (
              filtered.map((alert) => {
                const sc = SEVERITY_CONFIG[alert.severity];
                const stc = STATUS_CONFIG[alert.status];
                return (
                  <div
                    key={alert.id}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      boxShadow: 'var(--shadow-sm)',
                      borderLeft: `4px solid ${sc.accent}`,
                      overflow: 'hidden',
                      animation: 'fadeIn 0.3s ease',
                    }}
                  >
                    <div style={{ padding: '18px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                      {/* Status dot */}
                      <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: sc.accent,
                        marginTop: '5px',
                        flexShrink: 0,
                        boxShadow: `0 0 0 3px ${sc.accent}28`,
                      }} />

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em',
                            background: `${sc.accent}18`, color: sc.accent,
                            padding: '2px 8px', borderRadius: '20px',
                          }}>
                            {sc.label}
                          </span>
                          <span style={{
                            fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
                            background: stc.bg, color: stc.color,
                            padding: '2px 8px', borderRadius: '20px',
                          }}>
                            {stc.label}
                          </span>
                        </div>

                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                          {alert.title}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                          {alert.description}
                        </div>
                        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            {alert.time}
                          </span>
                          <span>🌡 {alert.temperature}</span>
                          <span>⚠ {alert.type}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0, alignItems: 'center' }}>
                        {alert.status === 'active' && (
                          <>
                            <button
                              onClick={() => acknowledge(alert.id)}
                              style={{
                                padding: '7px 14px',
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Acknowledge
                            </button>
                            <button
                              onClick={() => resolve(alert.id)}
                              style={{
                                padding: '7px 14px',
                                background: '#f0fdf4',
                                color: '#16a34a',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Resolve
                            </button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <button
                            onClick={() => resolve(alert.id)}
                            style={{
                              padding: '7px 14px',
                              background: '#f0fdf4',
                              color: '#16a34a',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          onClick={() => dismiss(alert.id)}
                          style={{
                            padding: '7px',
                            background: 'transparent',
                            color: 'var(--text-muted)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="Dismiss"
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}