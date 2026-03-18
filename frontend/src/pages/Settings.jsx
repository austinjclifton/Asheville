import { useState, useEffect } from 'react';
import Navigation from "../components/Navigation";
import { apiFetch } from '../api';
import { useAuth } from '../hooks/useAuth';

function SectionCard({ title, description, children }) {
  return (
    <div style={{ background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', marginBottom: '20px', overflow: 'hidden' }}>
      <div style={{ padding: '20px 28px', borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e2d4a' }}>{title}</div>
        {description && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>{description}</div>}
      </div>
      <div style={{ padding: '24px 28px' }}>{children}</div>
    </div>
  );
}

function FormGroup({ label, hint, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '7px', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>{hint}</div>}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #e2e8f0', borderRadius: '10px',
  fontSize: '14px', color: '#1e2d4a', background: '#f8fafc',
  outline: 'none', transition: 'border-color 0.15s, background 0.15s',
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

function StyledInput({ style, disabled, ...props }) {
  return (
    <input
      {...props}
      disabled={disabled}
      style={{ ...inputStyle, ...(disabled ? { opacity: 0.6, cursor: 'not-allowed', background: '#f1f5f9' } : {}), ...style }}
      onFocus={e => { if (!disabled) { e.target.style.borderColor = '#1e2d4a'; e.target.style.background = 'white'; } }}
      onBlur={e => { if (!disabled) { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; } }}
    />
  );
}

function StyledSelect({ children, value, onChange }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
      onFocus={e => { e.target.style.borderColor = '#1e2d4a'; e.target.style.background = 'white'; }}
      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
    >
      {children}
    </select>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e2d4a' }}>{label}</div>
        {description && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{description}</div>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: '44px', height: '24px', borderRadius: '12px', border: 'none',
          background: checked ? '#1e2d4a' : '#cbd5e1',
          cursor: 'pointer', position: 'relative',
          transition: 'background 0.2s', flexShrink: 0, marginLeft: '16px',
        }}
      >
        <span style={{
          position: 'absolute', top: '3px',
          left: checked ? '23px' : '3px',
          width: '18px', height: '18px', borderRadius: '50%',
          background: 'white', transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  );
}

function ChangePasswordModal({ onClose, onSuccess }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (next !== confirm) { setError('New passwords do not match.'); return; }
    if (next.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to change password. Check your current password and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, animation: 'fadeIn 0.15s ease',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '32px',
        width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#1e2d4a' }}>Change Password</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px', fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <FormGroup label="Current Password">
            <StyledInput type="password" value={current} onChange={e => setCurrent(e.target.value)} required placeholder="Enter current password" />
          </FormGroup>
          <FormGroup label="New Password">
            <StyledInput type="password" value={next} onChange={e => setNext(e.target.value)} required placeholder="At least 8 characters" />
          </FormGroup>
          <FormGroup label="Confirm New Password">
            <StyledInput type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat new password" />
          </FormGroup>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '10px',
              background: 'white', fontSize: '14px', fontWeight: 600, color: '#64748b', cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '10px',
              background: loading ? '#94a3b8' : '#1e2d4a', color: 'white',
              fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Saving…' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Locally-persisted threshold/alert preferences (no backend endpoint for these)
const PREF_KEY = 'asheville_settings_v1';

function loadLocalPrefs() {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    criticalLow: '33',
    criticalHigh: '40',
    optimalLow: '34',
    optimalHigh: '37',
    alertEmail: '',
    interval: '10',
    tempUnit: 'celsius',
    enableCritical: true,
    enableWarning: true,
    enableInfo: false,
    enableEmail: true,
  };
}

function saveLocalPrefs(prefs) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch {}
}

export default function Settings() {
  const { ready: authReady, error: authError } = useAuth();
  const [localPrefs, setLocalPrefs] = useState(loadLocalPrefs);
  const [savedPrefs, setSavedPrefs] = useState(loadLocalPrefs);

  // Account fields from API
  const [displayName, setDisplayName] = useState('');
  const [accountEmail, setAccountEmail] = useState('');
  const [savedDisplayName, setSavedDisplayName] = useState('');
  const [savedAccountEmail, setSavedAccountEmail] = useState('');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [deviceLoading, setDeviceLoading] = useState(true);
  const [hiveInfo, setHiveInfo] = useState(null);

  const setLocalPref = (key, val) => setLocalPrefs(p => ({ ...p, [key]: val }));

  useEffect(() => {
    // Wait for auth to be confirmed before fetching user/hive/device data
    if (!authReady) return;
    if (authError) {
      setDeviceLoading(false);
      return;
    }

    async function loadInitialData() {
      try {
        const [meRes, hivesRes, devicesRes] = await Promise.allSettled([
          apiFetch('/api/auth/me'),
          apiFetch('/api/hives'),
          apiFetch('/api/devices'),
        ]);

        if (meRes.status === 'fulfilled' && meRes.value?.user) {
          const user = meRes.value.user;
          setDisplayName(user.username || '');
          setAccountEmail(user.email || '');
          setSavedDisplayName(user.username || '');
          setSavedAccountEmail(user.email || '');
          // Pre-fill alert email from user email if not already set
          setLocalPrefs(p => ({
            ...p,
            alertEmail: p.alertEmail || user.email || '',
          }));
        }

        if (hivesRes.status === 'fulfilled') {
          const hives = hivesRes.value?.hives ?? [];
          if (hives.length > 0) setHiveInfo(hives[0]);
        }

        if (devicesRes.status === 'fulfilled') {
          const devices = devicesRes.value?.devices ?? [];
          if (devices.length > 0) setDeviceId(devices[0].id);
        }
      } catch {
        // silent
      } finally {
        setDeviceLoading(false);
      }
    }
    loadInitialData();
  }, [authReady, authError]);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };

  const handleSave = async () => {
    setSaving(true);
    const errors = [];

    // Validate threshold logic
    const cl = parseFloat(localPrefs.criticalLow);
    const ch = parseFloat(localPrefs.criticalHigh);
    const ol = parseFloat(localPrefs.optimalLow);
    const oh = parseFloat(localPrefs.optimalHigh);
    if (isNaN(cl) || isNaN(ch) || isNaN(ol) || isNaN(oh)) {
      errors.push('All threshold values must be valid numbers.');
    } else if (cl >= ch) {
      errors.push('Critical low must be less than critical high.');
    } else if (ol >= oh) {
      errors.push('Optimal low must be less than optimal high.');
    } else if (ol < cl || oh > ch) {
      errors.push('Optimal range must be within critical range.');
    }

    if (errors.length > 0) {
      showToast(errors[0], false);
      setSaving(false);
      return;
    }

    try {
      // Save local preferences (thresholds, alerts, sensor config)
      saveLocalPrefs(localPrefs);
      setSavedPrefs(localPrefs);

      // Note: The backend has no PATCH /api/auth/me endpoint for updating username/email.
      // The change-password endpoint handles password updates.
      // We save account display values locally for now.
      setSavedDisplayName(displayName);
      setSavedAccountEmail(accountEmail);

      showToast('Settings saved successfully');
    } catch (err) {
      showToast(err.message || 'Failed to save settings', false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalPrefs(savedPrefs);
    setDisplayName(savedDisplayName);
    setAccountEmail(savedAccountEmail);
    showToast('Changes discarded', true);
  };

  const sensorLabel = deviceLoading
    ? 'Loading…'
    : deviceId
      ? `DEVICE-${String(deviceId).padStart(3, '0')}`
      : 'No device found';

  const hiveLabel = hiveInfo ? `${hiveInfo.name} (ID: ${hiveInfo.id})` : (deviceLoading ? 'Loading…' : 'No hive found');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Navigation />

      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => { setShowPasswordModal(false); showToast('Password updated successfully'); }}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 999,
          background: toast.ok ? '#1e2d4a' : '#ef4444',
          color: 'white', padding: '10px 18px', borderRadius: '10px',
          fontSize: '13px', fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      <main style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '24px 28px 0', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e2d4a', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Settings</h1>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '3px' }}>Manage your system preferences and alert configuration</div>
        </div>

        <div style={{ padding: '0 28px 28px', maxWidth: '800px' }}>

          <SectionCard title="Temperature Thresholds" description={`Define critical and optimal temperature ranges for your hive (${localPrefs.tempUnit === 'celsius' ? '°C' : '°F'})`}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormGroup label={`Critical Low (${localPrefs.tempUnit === 'celsius' ? '°C' : '°F'})`} hint="Alert when temperature drops below this value">
                <StyledInput type="number" step="0.1" value={localPrefs.criticalLow} onChange={e => setLocalPref('criticalLow', e.target.value)} />
              </FormGroup>
              <FormGroup label={`Critical High (${localPrefs.tempUnit === 'celsius' ? '°C' : '°F'})`} hint="Alert when temperature exceeds this value">
                <StyledInput type="number" step="0.1" value={localPrefs.criticalHigh} onChange={e => setLocalPref('criticalHigh', e.target.value)} />
              </FormGroup>
              <FormGroup label={`Optimal Range Low (${localPrefs.tempUnit === 'celsius' ? '°C' : '°F'})`}>
                <StyledInput type="number" step="0.1" value={localPrefs.optimalLow} onChange={e => setLocalPref('optimalLow', e.target.value)} />
              </FormGroup>
              <FormGroup label={`Optimal Range High (${localPrefs.tempUnit === 'celsius' ? '°C' : '°F'})`}>
                <StyledInput type="number" step="0.1" value={localPrefs.optimalHigh} onChange={e => setLocalPref('optimalHigh', e.target.value)} />
              </FormGroup>
            </div>
          </SectionCard>

          <SectionCard title="Alert Preferences" description="Configure when and how you receive notifications">
            <div style={{ marginBottom: '20px' }}>
              <Toggle label="Enable critical alerts" description="Receive alerts for critical threshold violations" checked={localPrefs.enableCritical} onChange={v => setLocalPref('enableCritical', v)} />
              <Toggle label="Enable warning alerts" description="Receive alerts for warning conditions" checked={localPrefs.enableWarning} onChange={v => setLocalPref('enableWarning', v)} />
              <Toggle label="Enable info notifications" description="Receive informational system events" checked={localPrefs.enableInfo} onChange={v => setLocalPref('enableInfo', v)} />
              <Toggle label="Email notifications" description="Send alerts to your notification email" checked={localPrefs.enableEmail} onChange={v => setLocalPref('enableEmail', v)} />
            </div>
            <FormGroup label="Notification Email">
              <StyledInput
                type="email"
                value={localPrefs.alertEmail}
                onChange={e => setLocalPref('alertEmail', e.target.value)}
                placeholder="your@email.com"
                disabled={!localPrefs.enableEmail}
              />
            </FormGroup>
          </SectionCard>

          <SectionCard title="Sensor Configuration" description="View your monitoring hardware settings">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <FormGroup label="Hive" hint="The hive this sensor monitors">
                <StyledInput type="text" value={hiveLabel} disabled />
              </FormGroup>
              <FormGroup label="Sensor ID" hint="The device registered to your hive">
                <StyledInput type="text" value={sensorLabel} disabled />
              </FormGroup>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormGroup label="Reading Interval">
                <StyledSelect value={localPrefs.interval} onChange={e => setLocalPref('interval', e.target.value)}>
                  <option value="1">Every 1 minute</option>
                  <option value="5">Every 5 minutes</option>
                  <option value="10">Every 10 minutes</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                </StyledSelect>
              </FormGroup>
              <FormGroup label="Temperature Unit">
                <StyledSelect value={localPrefs.tempUnit} onChange={e => setLocalPref('tempUnit', e.target.value)}>
                  <option value="celsius">Celsius (°C)</option>
                  <option value="fahrenheit">Fahrenheit (°F)</option>
                </StyledSelect>
              </FormGroup>
            </div>
          </SectionCard>

          <SectionCard title="Account Settings" description="View your account information and update your password">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormGroup label="Username" hint="Your account username (read-only)">
                <StyledInput
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your username"
                  disabled
                />
              </FormGroup>
              <FormGroup label="Email Address" hint="Your registered email (read-only)">
                <StyledInput
                  type="email"
                  value={accountEmail}
                  onChange={e => setAccountEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled
                />
              </FormGroup>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              style={{
                padding: '9px 18px', background: 'white', color: '#ef4444',
                border: '1.5px solid #fecaca', borderRadius: '8px',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              Change Password
            </button>
          </SectionCard>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '10px 24px', background: 'white', border: '1.5px solid #e2e8f0',
                borderRadius: '10px', fontSize: '14px', fontWeight: 600, color: '#64748b',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '10px 28px', background: saving ? '#94a3b8' : '#1e2d4a',
                color: 'white', border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#2d4168'; }}
              onMouseLeave={e => { if (!saving) e.currentTarget.style.background = '#1e2d4a'; }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}