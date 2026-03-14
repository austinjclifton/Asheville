import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from "../components/Navigation";
import { apiFetch } from '../api';

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

const RANGE_HOURS = { '24H': 24, '7D': 24 * 7, '30D': 24 * 30 };

function generateDummyData(rangeKey) {
  const hours = RANGE_HOURS[rangeKey];
  const count = rangeKey === '24H' ? 22 : rangeKey === '7D' ? 28 : 30;
  const labels = [];
  const internal = [];
  const external = [];
  const now = Date.now();
  for (let i = count - 1; i >= 0; i--) {
    const ts = new Date(now - (i / (count - 1)) * hours * 3600 * 1000);
    if (rangeKey === '24H') {
      labels.push(ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else {
      labels.push(ts.toLocaleDateString([], { month: 'short', day: 'numeric' }));
    }
    const intVal = 34.5 + Math.sin(i * 0.4) * 0.8 + (Math.random() - 0.5) * 0.3;
    const extVal = 14 + Math.sin(i * 0.6 + 1) * 8 + (Math.random() - 0.5) * 1.5;
    internal.push(parseFloat(intVal.toFixed(2)));
    external.push(parseFloat(extVal.toFixed(2)));
  }
  return { labels, internal, external };
}

function DashboardChart({ data }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const buildChart = () => {
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      const ctx = canvasRef.current.getContext('2d');
      const Chart = window.Chart;

      const amberGrad = ctx.createLinearGradient(0, 0, 0, 280);
      amberGrad.addColorStop(0, 'rgba(245,166,35,0.22)');
      amberGrad.addColorStop(1, 'rgba(245,166,35,0.02)');

      const grayGrad = ctx.createLinearGradient(0, 0, 0, 280);
      grayGrad.addColorStop(0, 'rgba(148,163,184,0.22)');
      grayGrad.addColorStop(1, 'rgba(148,163,184,0.02)');

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'Internal',
              data: data.internal,
              borderColor: '#f5a623',
              borderWidth: 2.5,
              backgroundColor: amberGrad,
              fill: true,
              tension: 0.45,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: '#f5a623',
              pointHoverBorderColor: '#fff',
              pointHoverBorderWidth: 2,
              order: 1,
            },
            {
              label: 'External',
              data: data.external.some(v => v !== null) ? data.external : data.internal.map(() => null),
              borderColor: '#1e2d4a',
              borderWidth: 2,
              backgroundColor: grayGrad,
              fill: true,
              tension: 0.45,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: '#1e2d4a',
              pointHoverBorderColor: '#fff',
              pointHoverBorderWidth: 2,
              order: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          animation: { duration: 400, easing: 'easeInOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(255,255,255,0.97)',
              titleColor: '#1e2d4a',
              bodyColor: '#64748b',
              borderColor: '#e2e8f0',
              borderWidth: 1,
              padding: 10,
              boxPadding: 5,
              cornerRadius: 8,
              callbacks: {
                label: (c) => c.parsed.y != null ? `  ${c.dataset.label}: ${c.parsed.y.toFixed(1)}°C` : null,
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(100,116,139,0.10)', lineWidth: 1, borderDash: [4, 4] },
              border: { display: false },
              ticks: { color: '#94a3b8', font: { size: 10, family: "'DM Sans', system-ui" }, maxTicksLimit: 9, maxRotation: 0 },
            },
            y: {
              position: 'left',
              grid: { color: 'rgba(100,116,139,0.10)', lineWidth: 1, borderDash: [4, 4] },
              border: { display: false },
              ticks: { color: '#94a3b8', font: { size: 10, family: "'DM Sans', system-ui" }, maxTicksLimit: 6 },
              min: 0,
            },
          },
        },
      });
    };

    if (window.Chart) {
      buildChart();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      script.onload = buildChart;
      document.head.appendChild(script);
    }

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [data]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}

function TempCard({ title, value, delta, sensor, accentColor, Icon }) {
  const isNeg = delta < 0;
  return (
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', flex: 1, boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ height: '3px', background: accentColor }} />
      <div style={{ padding: '18px 22px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span style={{ color: accentColor, display: 'flex', alignItems: 'center' }}><Icon /></span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{title}</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '12px', fontWeight: 700,
            color: isNeg ? '#ef4444' : '#94a3b8',
            background: isNeg ? '#fef2f2' : '#f1f5f9',
            padding: '3px 9px', borderRadius: '6px', lineHeight: 1,
          }}>
            {isNeg
              ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><polygon points="12,18 4,6 20,6" fill="#ef4444" transform="rotate(180,12,12)"/></svg>
              : <svg width="8" height="8" viewBox="0 0 8 8"><rect width="8" height="8" rx="1" fill="#94a3b8"/></svg>
            }
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('24H');
  const [hiveId, setHiveId] = useState(null);
  const [chartData, setChartData] = useState(() => generateDummyData('24H'));
  const hiveIdRef = useRef(null);

  // Initial load: fetch hive + latest reading
  useEffect(() => {
    async function load() {
      try {
        const hivesRes = await apiFetch('/api/hives');
        const hives = hivesRes?.hives ?? hivesRes ?? [];
        if (!hives?.length) { setLoading(false); return; }
        const hive = hives[0];
        setHiveId(hive.id);
        hiveIdRef.current = hive.id;

        const latestRes = await apiFetch(`/api/readings/latest?hiveId=${hive.id}`);
        setLatest(latestRes?.reading ?? latestRes?.readings?.[0] ?? latestRes);

        // Load initial 24H chart
        await fetchChartData(hive.id, '24H');
      } catch (err) {
        setError(err.message);
        // Fall back to dummy data
        setChartData(generateDummyData('24H'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fetchChartData = useCallback(async (hid, range) => {
    const id = hid ?? hiveIdRef.current;
    if (!id) {
      setChartData(generateDummyData(range));
      return;
    }
    setChartLoading(true);
    try {
      const hours = RANGE_HOURS[range];
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      const readingsRes = await apiFetch(`/api/readings/since?hiveId=${id}&since=${since}&order=asc&limit=200`);
      const readings = readingsRes?.readings ?? readingsRes ?? [];
      if (readings.length > 1) {
        const labels = readings.map(r => {
          const d = new Date(r.recorded_at || r.recordedAt);
          if (isNaN(d)) return '';
          return range === '24H'
            ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
        });
        const internal = readings.map(r => {
          const f = parseFloat(r.temperature_f ?? r.temperatureF ?? 0);
          return parseFloat(((f - 32) * 5 / 9).toFixed(2));
        });
        setChartData({ labels, internal, external: internal.map(() => null) });
      } else {
        setChartData(generateDummyData(range));
      }
    } catch {
      setChartData(generateDummyData(range));
    } finally {
      setChartLoading(false);
    }
  }, []);

  // When time range button is clicked
  const handleRangeChange = (range) => {
    setTimeRange(range);
    fetchChartData(hiveIdRef.current, range);
  };

  const latestF = parseFloat(latest?.temperature_f ?? latest?.temperatureF ?? 0);
  const latestC = latestF ? parseFloat(((latestF - 32) * 5 / 9).toFixed(1)) : 34.7;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Navigation />
      <main style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e2d4a', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>HIVE ID:</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e2d4a' }}>#{hiveId ?? '8821'}</span>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 0 3px rgba(34,197,94,0.2)' }} />
          </div>
        </div>

        {error && (
          <div style={{ margin: '0 28px 12px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div style={{ padding: '0 28px 28px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <TempCard title="Internal Temperature" value={loading ? '…' : latestC} delta={0.1} sensor="Brood Nest Sensor A1" accentColor="#f5a623" Icon={ThermIcon} />
            <TempCard title="External Temperature" value={loading ? '…' : 18.7} delta={-1.2} sensor="Environment Sensor E2" accentColor="#1e2d4a" Icon={WindIcon} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>
            {/* Chart */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '22px 22px 14px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e2d4a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Temperature Analysis
                    {chartLoading && <span style={{ marginLeft: '8px', fontSize: '10px', color: '#94a3b8', fontWeight: 500, textTransform: 'none' }}>Loading…</span>}
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '3px' }}>Internal vs External Correlation</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['24H', '7D', '30D'].map(r => (
                    <button key={r} onClick={() => handleRangeChange(r)} style={{
                      padding: '5px 12px', borderRadius: '6px', border: 'none',
                      background: timeRange === r ? '#1e2d4a' : '#f1f5f9',
                      color: timeRange === r ? 'white' : '#64748b',
                      fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                      opacity: chartLoading ? 0.6 : 1,
                    }}>{r}</button>
                  ))}
                </div>
              </div>
              <div style={{ height: '290px' }}>
                {chartData && <DashboardChart data={chartData} />}
              </div>
            </div>

            {/* System Events */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '22px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e2d4a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Events</div>
                <button
                  onClick={() => navigate('/alerts')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 800, color: '#f5a623', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                >
                  View All
                </button>
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