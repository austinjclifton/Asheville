import { useState } from 'react';
import Navigation from "../components/Navigation";

const INITIAL_ALERTS = [
  {
    id: 1,
    severity: 'critical',
    status: 'active',
    title: 'Temperature Below Critical Threshold',
    description: 'Hive temperature dropped to 88.2°F, which is below the safe operating range. Immediate attention required.',
    time: '2 hours ago',
    temperature: '88.2°F',
    type: 'Below Range',
  },
  {
    id: 2,
    severity: 'warning',
    status: 'acknowledged',
    title: 'Rapid Temperature Drop Detected',
    description: 'Temperature decreased by 4.5°F within 15 minutes. Check hive insulation and external conditions.',
    time: '4 hours ago',
    temperature: '90.8°F',
    type: 'Below Range',
  },
  {
    id: 3,
    severity: 'info',
    status: 'resolved',
    title: 'Temperature Approaching Upper Limit',
    description: 'Current temperature at 96.8°F is approaching the upper threshold of 97°F.',
    time: '8 hours ago',
    temperature: '96.8°F',
    type: 'Normal',
  },
  {
    id: 4,
    severity: 'warning',
    status: 'active',
    title: 'External Temperature Rising',
    description: 'External temperature has risen to 85°F, monitor hive cooling system.',
    time: '1 hour ago',
    temperature: '85.0°F',
    type: 'Warning',
  },
  {
    id: 5,
    severity: 'info',
    status: 'resolved',
    title: 'Temperature Stabilized',
    description: 'Hive temperature has returned to normal operating range.',
    time: '12 hours ago',
    temperature: '94.2°F',
    type: 'Normal',
  },
];

const SEVERITY_CONFIG = {
  critical: { bg: '#fef2f2', border: '#fecaca', accent: '#ef4444', label: 'CRITICAL', dot: '#ef4444' },
  warning: { bg: '#fffbeb', border: '#fde68a', accent: '#f59e0b', label: 'WARNING', dot: '#f59e0b' },
  info: { bg: '#eff6ff', border: '#bfdbfe', accent: '#3b82f6', label: 'INFO', dot: '#3b82f6' },
};

const STATUS_CONFIG = {
  active: { bg: '#fef2f2', color: '#dc2626', label: 'Active' },
  acknowledged: { bg: '#eff6ff', color: '#2563eb', label: 'Acknowledged' },
  resolved: { bg: '#f0fdf4', color: '#16a34a', label: 'Resolved' },
};

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

export default function Alerts() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

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
            {filtered.length} {filtered.length === 1 ? 'alert' : 'alerts'} found
          </div>
        </div>

        <div style={{ padding: '0 32px 32px' }}>
          {/* Stat cards */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <StatCard value={stats.critical} label="Active Critical" color="#ef4444" />
            <StatCard value={stats.warnings} label="Active Warnings" color="#f59e0b" />
            <StatCard value={stats.resolved} label="Resolved" color="#22c55e" />
            <StatCard value={stats.total} label="Total Alerts" color="var(--navy)" />
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
            {filtered.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '60px 24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔕</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-secondary)' }}>No alerts found</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Try adjusting your filters to see more results.
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
                      {/* Left: dot */}
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