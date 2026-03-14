import { useEffect, useState } from "react";

function HealthCheck() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus({ ok: false, service: "Backend not connected" }));
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: 'var(--shadow-md)',
        maxWidth: '480px',
        width: '100%',
        margin: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'var(--amber)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8 2 5 5 5 9c0 2.5 1.2 4.7 3 6.1V20a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4.9c1.8-1.4 3-3.6 3-6.1 0-4-3-7-7-7z" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy)' }}>Team Asheville</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>System Health Check</div>
          </div>
        </div>

        {!status ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <span style={{ animation: 'pulse 1s infinite', fontSize: '20px' }}>⏳</span>
            <span style={{ fontSize: '14px' }}>Checking system status...</span>
          </div>
        ) : (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: status.ok !== false ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${status.ok !== false ? '#bbf7d0' : '#fecaca'}`,
            }}>
              <span style={{ fontSize: '16px' }}>{status.ok !== false ? '✅' : '❌'}</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: status.ok !== false ? '#16a34a' : '#dc2626' }}>
                {status.ok !== false ? 'System Healthy' : 'System Error'}
              </span>
            </div>

            {status.service && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <strong>Service:</strong> {status.service}
              </div>
            )}
            {status.time && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong>Server time:</strong> {status.time}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthCheck;