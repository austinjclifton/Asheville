import { useState, useEffect } from 'react';
import Navigation from "../components/Navigation";
import { apiFetch } from '../api';
  
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
 
function StyledInput({ style, ...props }) {
  return (
    <input
      {...props}
      style={{ ...inputStyle, ...style }}
      onFocus={e => { e.target.style.borderColor = '#1e2d4a'; e.target.style.background = 'white'; }}
      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = props.disabled ? '#f1f5f9' : '#f8fafc'; }}
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
      setError(err.message || 'Failed to change password.');
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
 
 
const DEFAULT_SETTINGS = {
  criticalLow: '88',
  criticalHigh: '97',
  optimalLow: '92',
  optimalHigh: '95',
  alertEmail: '',
  displayName: '',
  accountEmail: '',
  interval: '10',
  tempUnit: 'fahrenheit',
  enableCritical: true,
  enableWarning: true,
  enableInfo: false,
  enableEmail: true,
};
 
export default function Settings() {
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [deviceLoading, setDeviceLoading] = useState(true);
 
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
 
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [meRes, devicesRes] = await Promise.allSettled([
          apiFetch('/api/auth/me'),
          apiFetch('/api/devices'),
        ]);
 
        if (meRes.status === 'fulfilled' && meRes.value?.user) {
          const user = meRes.value.user;
          setForm(f => ({
            ...f,
            displayName: user.username || '',
            accountEmail: user.email || '',
            alertEmail: f.alertEmail || user.email || '',
          }));
          setSaved(f => ({
            ...f,
            displayName: user.username || '',
            accountEmail: user.email || '',
          }));
        }
 
        if (devicesRes.status === 'fulfilled') {
          const devices = devicesRes.value?.devices ?? [];
          if (devices.length > 0) {
            setDeviceId(devices[0].id);
          }
        }
      } catch {
      } finally {
        setDeviceLoading(false);
      }
    }
    loadInitialData();
  }, []);
 
  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  };
 
  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      setSaved(form);
      showToast('Settings saved successfully');
    } catch (err) {
      showToast(err.message || 'Failed to save settings', false);
    } finally {
      setSaving(false);
    }
  };
 
  const handleCancel = () => {
    setForm(saved);
    showToast('Changes discarded', true);
  };
 
  const sensorLabel = deviceLoading
    ? 'Loading…'
    : deviceId
      ? `DEVICE-${String(deviceId).padStart(3, '0')}`
      : 'No device found';
 
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
 
          <SectionCard title="Temperature Thresholds" description="Define critical and optimal temperature ranges for your hive">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormGroup label="Critical Low (°F)" hint="Alert when temperature drops below this value">
                <StyledInput type="number" value={form.criticalLow} onChange={e => set('criticalLow', e.target.value)} />
              </FormGroup>
              <FormGroup label="Critical High (°F)" hint="Alert when temperature exceeds this value">
                <StyledInput type="number" value={form.criticalHigh} onChange={e => set('criticalHigh', e.target.value)} />
              </FormGroup>
              <FormGroup label="Optimal Range Low (°F)">
                <StyledInput type="number" value={form.optimalLow} onChange={e => set('optimalLow', e.target.value)} />
              </FormGroup>
              <FormGroup label="Optimal Range High (°F)">
                <StyledInput type="number" value={form.optimalHigh} onChange={e => set('optimalHigh', e.target.value)} />
              </FormGroup>
            </div>
          </SectionCard>
 
          <SectionCard title="Alert Preferences" description="Configure when and how you receive notifications">
            <div style={{ marginBottom: '20px' }}>
              <Toggle label="Enable critical alerts" description="Receive alerts for critical threshold violations" checked={form.enableCritical} onChange={v => set('enableCritical', v)} />
              <Toggle label="Enable warning alerts" description="Receive alerts for warning conditions" checked={form.enableWarning} onChange={v => set('enableWarning', v)} />
              <Toggle label="Enable info notifications" description="Receive informational system events" checked={form.enableInfo} onChange={v => set('enableInfo', v)} />
              <Toggle label="Email notifications" description="Send alerts to your notification email" checked={form.enableEmail} onChange={v => set('enableEmail', v)} />
            </div>
            <FormGroup label="Notification Email">
              <StyledInput type="email" value={form.alertEmail} onChange={e => set('alertEmail', e.target.value)} placeholder="your@email.com" disabled={!form.enableEmail} style={!form.enableEmail ? { opacity: 0.5, cursor: 'not-allowed' } : {}} />
            </FormGroup>
          </SectionCard>
 
          <SectionCard title="Sensor Configuration" description="Configure your monitoring hardware settings">
            <FormGroup label="Sensor ID" hint="The device registered to your hive">
              <StyledInput type="text" value={sensorLabel} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </FormGroup>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormGroup label="Reading Interval">
                <StyledSelect value={form.interval} onChange={e => set('interval', e.target.value)}>
                  <option value="1">Every 1 minute</option>
                  <option value="5">Every 5 minutes</option>
                  <option value="10">Every 10 minutes</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                </StyledSelect>
              </FormGroup>
              <FormGroup label="Temperature Unit">
                <StyledSelect value={form.tempUnit} onChange={e => set('tempUnit', e.target.value)}>
                  <option value="fahrenheit">Fahrenheit (°F)</option>
                  <option value="celsius">Celsius (°C)</option>
                </StyledSelect>
              </FormGroup>
            </div>
          </SectionCard>

          <SectionCard title="Account Settings" description="Update your personal information and security settings">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormGroup label="Username" hint="Your account username">
                <StyledInput type="text" value={form.displayName} onChange={e => set('displayName', e.target.value)} placeholder="Your username" />
              </FormGroup>
              <FormGroup label="Email Address">
                <StyledInput type="email" value={form.accountEmail} onChange={e => set('accountEmail', e.target.value)} placeholder="your@email.com" />
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
 