import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from "../components/Navigation";
import { apiFetch } from '../api';

const RANGE_HOURS = { '24H': 24, '7D': 24 * 7, '30D': 24 * 30 };

const SYSTEM_EVENTS = [
  { type: 'warning', time: '01:29 PM', message: 'Internal temperature dropped below 33°C momentarily.' },
  { type: 'info',    time: '05:29 AM', message: 'External temperature spike detected. Hive compensation active.' },
  { type: 'info',    time: '05:29 PM', message: 'Daily sensor calibration check passed.' },
  { type: 'system',  time: '08:00 AM', message: 'Daily automated diagnostic check completed successfully.' },
];

const EVENT_STYLES = {
  warning: { bg: '#fffbeb', border: '#fde68a', labelBg: '#fef3c7', labelColor: '#d97706', text: 'WARNING' },
  info:    { bg: '#f0f9ff', border: '#bae6fd', labelBg: '#e0f2fe', labelColor: '#0284c7', text: 'INFO' },
  system:  { bg: '#f0fdf4', border: '#bbf7d0', labelBg: '#dcfce7', labelColor: '#16a34a', text: 'SYSTEM' },
};

function generateDummyData(rangeKey) {
  const hours = RANGE_HOURS[rangeKey];
  const count = rangeKey === '24H' ? 22 : rangeKey === '7D' ? 28 : 30;
  const labels = [], internal = [], external = [];
  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    const ts = new Date(now - (i / (count - 1)) * hours * 3600 * 1000);
    labels.push(rangeKey === '24H'
      ? ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : ts.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    internal.push(parseFloat((34.5 + Math.sin(i * 0.4) * 0.8 + (Math.random() - 0.5) * 0.3).toFixed(2)));
    external.push(parseFloat((14 + Math.sin(i * 0.6 + 1) * 8 + (Math.random() - 0.5) * 1.5).toFixed(2)));
  }
  return { labels, internal, external };
}

// ── Setup Wizard ──────────────────────────────────────────────────────────────

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        flexShrink: 0, background: copied ? '#22c55e' : 'rgba(255,255,255,0.12)',
        border: 'none', borderRadius: '6px', padding: '5px 10px',
        color: 'white', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
        transition: 'background 0.2s', whiteSpace: 'nowrap',
      }}
    >
      {copied ? '✓ Copied' : (label || 'Copy')}
    </button>
  );
}

function CodeRow({ label, value }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', borderRadius: '8px', padding: '9px 12px' }}>
        <code style={{ flex: 1, color: '#f5a623', fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>{value}</code>
        <CopyButton text={value} />
      </div>
    </div>
  );
}

function SetupWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [hiveName, setHiveName] = useState('');
  const [hiveNotes, setHiveNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hive, setHive] = useState(null);
  const [device, setDevice] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!hiveName.trim()) { setError('Hive name is required.'); return; }
    setError(''); setLoading(true);
    try {
      const hiveRes = await apiFetch('/api/hives', {
        method: 'POST',
        body: JSON.stringify({ name: hiveName.trim(), notes: hiveNotes.trim() || null }),
      });
      const newHive = hiveRes.hive;
      setHive(newHive);
      const deviceRes = await apiFetch(`/api/hives/${newHive.id}/devices`, {
        method: 'POST',
        body: JSON.stringify({ installedAt: new Date().toISOString() }),
      });
      setDevice(deviceRes.device);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to create hive. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ingestUrl = `${window.location.origin}/ingest/readings`;
  const examplePayload = device ? JSON.stringify({ deviceId: String(device.id), temperature: "34.5", rssi: "-70" }, null, 2) : '';

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.72)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 200, padding: '24px', animation: 'fadeIn 0.2s ease',
    }}>
      <div style={{
        background: 'white', borderRadius: '20px',
        width: '100%', maxWidth: step === 2 ? '560px' : '440px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'fadeIn 0.25s ease',
      }}>
        {/* Header */}
        <div style={{ background: '#1e2d4a', padding: '22px 26px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: '#f5a623', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C8 2 5 5 5 9c0 2.5 1.2 4.7 3 6.1V20a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4.9c1.8-1.4 3-3.6 3-6.1 0-4-3-7-7-7z" fill="white"/></svg>
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '16px' }}>{step === 1 ? 'Connect Your Sensor' : 'Sensor Ready!'}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '1px' }}>Step {step} of 2 — {step === 1 ? 'Create your hive' : 'Configure your device'}</div>
            </div>
          </div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.12)', borderRadius: '2px' }}>
            <div style={{ height: '100%', background: '#f5a623', borderRadius: '2px', width: step === 1 ? '50%' : '100%', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 26px' }}>
          {step === 1 && (
            <>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px', lineHeight: 1.6 }}>
                No hive is registered yet. Give your hive a name and we'll create a device ID for your sensor automatically.
              </p>
              {error && (
                <div style={{ marginBottom: '16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px', fontWeight: 500 }}>{error}</div>
              )}
              <form onSubmit={handleCreate}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    Hive Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text" value={hiveName} onChange={e => setHiveName(e.target.value)}
                    placeholder="e.g. Backyard Hive #1" required autoFocus
                    style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#1e2d4a', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }}
                    onFocus={e => { e.target.style.borderColor = '#1e2d4a'; e.target.style.background = 'white'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                    Notes <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <textarea
                    value={hiveNotes} onChange={e => setHiveNotes(e.target.value)}
                    placeholder="Location, colony type, etc." rows={2}
                    style={{ width: '100%', padding: '11px 14px', resize: 'vertical', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', color: '#1e2d4a', background: '#f8fafc', outline: 'none', fontFamily: 'inherit' }}
                    onFocus={e => { e.target.style.borderColor = '#1e2d4a'; e.target.style.background = 'white'; }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: '10px', background: loading ? '#94a3b8' : '#1e2d4a', color: 'white', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {loading ? <><span style={{ animation: 'pulse 1s infinite' }}>●</span> Creating…</> : 'Create Hive & Register Device →'}
                </button>
              </form>
            </>
          )}

          {step === 2 && device && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', padding: '11px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>
                  Hive <strong>"{hive?.name}"</strong> created — Device ID <strong>{device.id}</strong> registered.
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: 1.6 }}>
                Point your sensor at the endpoint below. Include your <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>INGEST_SECRET</code> in the header.
              </p>

              <CodeRow label="POST Endpoint" value={ingestUrl} />
              <CodeRow label="Device ID" value={String(device.id)} />

              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Required Headers</div>
                <div style={{ background: '#0f172a', borderRadius: '8px', padding: '10px 12px' }}>
                  <code style={{ color: '#86efac', fontFamily: 'monospace', fontSize: '12px', display: 'block' }}>x-ingest-token: YOUR_INGEST_SECRET</code>
                  <code style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px', display: 'block', marginTop: '3px' }}>Content-Type: application/json</code>
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>Example JSON Body</div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: '#0f172a', borderRadius: '8px', padding: '10px 12px' }}>
                  <pre style={{ flex: 1, color: '#f5a623', fontFamily: 'monospace', fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap' }}>{examplePayload}</pre>
                  <CopyButton text={examplePayload} label="Copy" />
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.6 }}>
                  <strong>temperature</strong> — Celsius string, e.g. "34.5" &nbsp;·&nbsp; <strong>rssi</strong> — dBm string from −200 to 0
                </div>
              </div>

              <button onClick={() => onComplete(hive, device)} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: '10px', background: '#1e2d4a', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                Go to Dashboard →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── No-readings banner ────────────────────────────────────────────────────────

function NoReadingsBanner({ deviceId }) {
  const curlCmd = `curl -X POST ${window.location.origin}/ingest/readings \\
  -H "Content-Type: application/json" \\
  -H "x-ingest-token: YOUR_INGEST_SECRET" \\
  -d '{"deviceId":"${deviceId}","temperature":"34.5","rssi":"-70"}'`;

  return (
    <div style={{ margin: '0 28px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" style={{ flexShrink: 0, marginTop: '1px' }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>
            Waiting for first sensor reading
          </div>
          <div style={{ fontSize: '12px', color: '#78350f', lineHeight: 1.6, marginBottom: '10px' }}>
            Device ID <code style={{ background: '#fef3c7', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>{deviceId}</code> is registered. Send a test POST:
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', background: '#0f172a', borderRadius: '8px', padding: '10px 12px' }}>
            <pre style={{ flex: 1, color: '#f5a623', fontFamily: 'monospace', fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{curlCmd}</pre>
            <CopyButton text={curlCmd} label="Copy" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Chart ─────────────────────────────────────────────────────────────────────

function DashboardChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;
    const buildChart = () => {
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      const ctx = canvasRef.current.getContext('2d');
      const Chart = window.Chart;
      const amberGrad = ctx.createLinearGradient(0,0,0,280);
      amberGrad.addColorStop(0,'rgba(245,166,35,0.22)'); amberGrad.addColorStop(1,'rgba(245,166,35,0.02)');
      const grayGrad = ctx.createLinearGradient(0,0,0,280);
      grayGrad.addColorStop(0,'rgba(148,163,184,0.22)'); grayGrad.addColorStop(1,'rgba(148,163,184,0.02)');
      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: { labels: data.labels, datasets: [
          { label: 'Internal', data: data.internal, borderColor: '#f5a623', borderWidth: 2.5, backgroundColor: amberGrad, fill: true, tension: 0.45, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#f5a623', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2, order: 1 },
          { label: 'External', data: data.external.some(v=>v!==null)?data.external:data.internal.map(()=>null), borderColor: '#1e2d4a', borderWidth: 2, backgroundColor: grayGrad, fill: true, tension: 0.45, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#1e2d4a', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2, order: 2 },
        ]},
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          animation: { duration: 400, easing: 'easeInOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: 'rgba(255,255,255,0.97)', titleColor: '#1e2d4a', bodyColor: '#64748b', borderColor: '#e2e8f0', borderWidth: 1, padding: 10, boxPadding: 5, cornerRadius: 8, callbacks: { label: c => c.parsed.y!=null ? `  ${c.dataset.label}: ${c.parsed.y.toFixed(1)}°C` : null } },
          },
          scales: {
            x: { grid: { color: 'rgba(100,116,139,0.10)', lineWidth: 1, borderDash: [4,4] }, border: { display: false }, ticks: { color: '#94a3b8', font: { size: 10, family: "'DM Sans', system-ui" }, maxTicksLimit: 9, maxRotation: 0 } },
            y: { position: 'left', grid: { color: 'rgba(100,116,139,0.10)', lineWidth: 1, borderDash: [4,4] }, border: { display: false }, ticks: { color: '#94a3b8', font: { size: 10, family: "'DM Sans', system-ui" }, maxTicksLimit: 6 }, min: 0 },
          },
        },
      });
    };
    if (window.Chart) { buildChart(); } else {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      s.onload = buildChart; document.head.appendChild(s);
    }
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [data]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}

// ── Temp Card ─────────────────────────────────────────────────────────────────

function TempCard({ title, value, delta, sensor, accentColor, Icon }) {
  const isNeg = delta < 0;
  return (
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', flex: 1, boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ height: '3px', background: accentColor }} />
      <div style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ color: accentColor, display: 'flex', alignItems: 'center' }}><Icon /></span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: isNeg ? '#ef4444' : '#94a3b8', background: isNeg ? '#fef2f2' : '#f1f5f9', padding: '3px 9px', borderRadius: '6px', lineHeight: 1 }}>
            {isNeg ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><polygon points="12,18 4,6 20,6" fill="#ef4444" transform="rotate(180,12,12)"/></svg> : <svg width="8" height="8" viewBox="0 0 8 8"><rect width="8" height="8" rx="1" fill="#94a3b8"/></svg>}
            {Math.abs(delta).toFixed(1)}°C
          </div>
        </div>
        <div style={{ fontSize: '42px', fontWeight: 800, color: '#1e2d4a', letterSpacing: '-0.03em', lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: '3px' }}>
          {value}<span style={{ fontSize: '18px', fontWeight: 500, color: '#64748b' }}>°C</span>
        </div>
        <div style={{ marginTop: '10px', fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>{sensor}</div>
      </div>
    </div>
  );
}

const ThermIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>;
const WindIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>;

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [showSetup, setShowSetup] = useState(false);
  const [latest, setLatest] = useState(null);
  const [externalCondition, setExternalCondition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('24H');
  const [hive, setHive] = useState(null);
  const [device, setDevice] = useState(null);
  const [chartData, setChartData] = useState(() => generateDummyData('24H'));
  const [hasRealReadings, setHasRealReadings] = useState(false);
  const hiveIdRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const hivesRes = await apiFetch('/api/hives');
        const hives = hivesRes?.hives ?? [];
        if (!hives.length) { setShowSetup(true); setLoading(false); return; }

        const foundHive = hives[0];
        setHive(foundHive);
        hiveIdRef.current = foundHive.id;

        const devicesRes = await apiFetch(`/api/hives/${foundHive.id}/devices`);
        const devices = devicesRes?.devices ?? [];
        if (devices.length > 0) setDevice(devices[0]);

        const [latestRes, extRes] = await Promise.allSettled([
          apiFetch(`/api/readings/latest?hiveId=${foundHive.id}`),
          apiFetch(`/api/external-conditions/latest?hiveId=${foundHive.id}`),
        ]);

        if (latestRes.status === 'fulfilled') {
          const r = latestRes.value?.reading ?? latestRes.value?.readings?.[0] ?? null;
          setLatest(r);
          if (r) setHasRealReadings(true);
        }
        if (extRes.status === 'fulfilled') setExternalCondition(extRes.value?.externalCondition ?? null);

        await fetchChartData(foundHive.id, '24H');
      } catch {
        setChartData(generateDummyData('24H'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fetchChartData = useCallback(async (hid, range) => {
    const id = hid ?? hiveIdRef.current;
    if (!id) { setChartData(generateDummyData(range)); return; }
    setChartLoading(true);
    try {
      const since = new Date(Date.now() - RANGE_HOURS[range] * 3600 * 1000).toISOString();
      const res = await apiFetch(`/api/readings/since?hiveId=${id}&since=${since}&order=asc&limit=200`);
      const readings = res?.readings ?? [];
      if (readings.length > 1) {
        const labels = readings.map(r => {
          const d = new Date(r.bucket_at);
          return range === '24H' ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        });
        const internal = readings.map(r => parseFloat(parseFloat(r.temperature_c ?? 0).toFixed(2)));
        setChartData({ labels, internal, external: internal.map(() => null) });
        setHasRealReadings(true);
      } else {
        setChartData(generateDummyData(range));
      }
    } catch { setChartData(generateDummyData(range)); }
    finally { setChartLoading(false); }
  }, []);

  const handleRangeChange = r => { setTimeRange(r); fetchChartData(hiveIdRef.current, r); };

  const handleSetupComplete = (newHive, newDevice) => {
    setHive(newHive); setDevice(newDevice);
    hiveIdRef.current = newHive.id;
    setShowSetup(false);
    fetchChartData(newHive.id, '24H');
  };

  const latestC = latest?.temperature_c != null ? parseFloat(parseFloat(latest.temperature_c).toFixed(1)) : 34.7;
  const externalC = externalCondition?.temp_c != null ? parseFloat(parseFloat(externalCondition.temp_c).toFixed(1)) : 18.7;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Navigation />
      {showSetup && <SetupWizard onComplete={handleSetupComplete} />}

      <main style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e2d4a', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>HIVE ID:</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e2d4a' }}>
              #{hive?.id ?? '—'}{hive?.name ? ` · ${hive.name}` : ''}
            </span>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: hasRealReadings ? '#22c55e' : '#f59e0b',
              display: 'inline-block',
              boxShadow: `0 0 0 3px ${hasRealReadings ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
            }} title={hasRealReadings ? 'Receiving data' : 'No readings yet'} />
          </div>
        </div>

        {!loading && hive && device && !hasRealReadings && <NoReadingsBanner deviceId={device.id} />}

        <div style={{ padding: '0 28px 28px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <TempCard title="Internal Temperature" value={loading ? '…' : latestC} delta={0.1} sensor={device ? `Device ${device.id}` : 'Brood Nest Sensor A1'} accentColor="#f5a623" Icon={ThermIcon} />
            <TempCard title="External Temperature" value={loading ? '…' : externalC} delta={-1.2} sensor="Environment Sensor E2" accentColor="#1e2d4a" Icon={WindIcon} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '22px 22px 14px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e2d4a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Temperature Analysis
                    {chartLoading && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#94a3b8', fontWeight: 500, textTransform: 'none' }}>Loading…</span>}
                    {!hasRealReadings && !loading && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#f59e0b', fontWeight: 500, textTransform: 'none' }}>Demo data</span>}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '3px' }}>Internal vs External Correlation</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['24H', '7D', '30D'].map(r => (
                    <button key={r} onClick={() => handleRangeChange(r)} style={{ padding: '5px 12px', borderRadius: '6px', border: 'none', background: timeRange === r ? '#1e2d4a' : '#f1f5f9', color: timeRange === r ? 'white' : '#64748b', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s', opacity: chartLoading ? 0.6 : 1 }}>{r}</button>
                  ))}
                </div>
              </div>
              <div style={{ height: '290px' }}>{chartData && <DashboardChart data={chartData} />}</div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '22px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e2d4a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Events</div>
                <button onClick={() => navigate('/alerts')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 800, color: '#f5a623', letterSpacing: '0.05em', textTransform: 'uppercase' }}>View All</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {SYSTEM_EVENTS.map((evt, i) => {
                  const s = EVENT_STYLES[evt.type];
                  return (
                    <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '10px', padding: '11px 13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, background: s.labelBg, color: s.labelColor, padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.05em' }}>{s.text}</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {evt.time}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.45 }}>{evt.message}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}