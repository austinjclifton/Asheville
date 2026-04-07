import { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from "../components/Navigation";
import { apiFetch } from '../api';
import { useAuth } from '../hooks/useAuth';

function fmtDate(d) {
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}

function fmtTime(d) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

/**
 * Detect gaps in readings — if consecutive readings are more than `thresholdMs`
 * apart, insert null entries to break the chart line.
 */
function insertGaps(readings, thresholdMs) {
  if (!readings || readings.length === 0) return readings;
  const result = [readings[0]];
  for (let i = 1; i < readings.length; i++) {
    const prev = new Date(readings[i-1].bucket_at).getTime();
    const curr = new Date(readings[i].bucket_at).getTime();
    if (curr - prev > thresholdMs) {
      // Insert a null sentinel between the two readings
      result.push({ __gap: true, bucket_at: new Date((prev + curr) / 2).toISOString() });
    }
    result.push(readings[i]);
  }
  return result;
}

function buildChartDataFromAPI(readings, externalConditions, range = '24H') {
  if (!readings || readings.length === 0) return null;

  // Gap threshold: for 24H use 30min, for 7D use 4h, for 30D use 2 days
  const gapThresholds = { '24H': 30 * 60 * 1000, '7D': 4 * 60 * 60 * 1000, '30D': 48 * 60 * 60 * 1000 };
  const gapThreshold = gapThresholds[range] || 30 * 60 * 1000;

  // Build external lookup by 10-min bucket
  const extByTs = {};
  if (externalConditions && externalConditions.length > 0) {
    externalConditions.forEach(ec => {
      const ts = Math.floor(new Date(ec.bucket_at).getTime() / (10 * 60 * 1000));
      extByTs[ts] = ec.temperature;
    });
  }

  // Insert gap sentinels into raw readings
  const readingsWithGaps = insertGaps(readings, gapThreshold);

  const labels = readingsWithGaps.map(r => {
    if (r.__gap) return '';
    const d = new Date(r.bucket_at);
    if (range === '24H') return fmtTime(d);
    return fmtDate(d);
  });

  // For 7D and 30D: use RAW readings (no averaging), just formatted differently
  const internalAvg = readingsWithGaps.map(r => {
    if (r.__gap) return null;
    return parseFloat(parseFloat(r.temperature).toFixed(1));
  });

  const externalAvg = readingsWithGaps.map(r => {
    if (r.__gap) return null;
    const ts = Math.floor(new Date(r.bucket_at).getTime() / (10 * 60 * 1000));
    for (const offset of [0, 1, -1]) {
      const val = extByTs[ts + offset];
      if (val !== undefined && val !== null) return parseFloat(parseFloat(val).toFixed(1));
    }
    return null;
  });

  const tempDiff = internalAvg.map((intT, i) => {
    if (intT === null) return null;
    const extT = externalAvg[i];
    return extT !== null ? parseFloat((intT - extT).toFixed(1)) : null;
  });

  // Summaries grouped by calendar date — use raw (non-gapped) readings for table
  const dayMap = {};
  readings.forEach(r => {
    const d = new Date(r.bucket_at);
    const day = fmtDate(d);
    if (!dayMap[day]) dayMap[day] = { temps: [], extTemps: [], rssis: [] };
    dayMap[day].temps.push(parseFloat(r.temperature));
    if (r.rssi != null) dayMap[day].rssis.push(r.rssi);
    const ts = Math.floor(new Date(r.bucket_at).getTime() / (10 * 60 * 1000));
    for (const offset of [0, 1, -1]) {
      const val = extByTs[ts + offset];
      if (val !== undefined && val !== null) { dayMap[day].extTemps.push(parseFloat(val)); break; }
    }
  });

  const summaries = Object.entries(dayMap).map(([date, { temps, extTemps, rssis }]) => {
    const intAvgVal = temps.reduce((a, b) => a + b, 0) / temps.length;
    const intMin = Math.min(...temps);
    const intMax = Math.max(...temps);
    const extAvgVal = extTemps.length ? extTemps.reduce((a, b) => a + b, 0) / extTemps.length : null;
    const extMin = extTemps.length ? Math.min(...extTemps) : null;
    const extMax = extTemps.length ? Math.max(...extTemps) : null;
    const diffVal = extAvgVal !== null ? intAvgVal - extAvgVal : null;
    const isNormal = diffVal !== null ? (diffVal >= 9 && diffVal <= 45) : true;
    const avgRssi = rssis.length ? Math.round(rssis.reduce((a, b) => a + b, 0) / rssis.length) : null;
    return {
      date,
      intAvg: `${intAvgVal.toFixed(1)}°F`,
      intRange: `${intMin.toFixed(1)}–${intMax.toFixed(1)}°F`,
      extAvg: extAvgVal !== null ? `${extAvgVal.toFixed(1)}°F` : 'N/A',
      extRange: extMin !== null ? `${extMin.toFixed(1)}–${extMax.toFixed(1)}°F` : 'N/A',
      diff: diffVal !== null ? `${diffVal.toFixed(1)}°F` : 'N/A',
      status: isNormal ? 'Normal' : 'Warning',
      avgRssi: avgRssi !== null ? `${avgRssi} dBm` : 'N/A',
    };
  });

  return { labels, internalAvg, externalAvg, tempDiff, summaries };
}

function AnalyticsChart({ data, view }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    const buildChart = () => {
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      const ctx = canvasRef.current.getContext('2d');
      const Chart = window.Chart;

      const datasets = view === 'comparison'
        ? [
            {
              type: 'bar',
              label: 'Temp Difference (°F)',
              data: data.tempDiff,
              backgroundColor: 'rgba(34,197,94,0.75)',
              borderWidth: 0,
              borderRadius: 0,
              barPercentage: 0.85,
              categoryPercentage: 0.9,
              order: 3,
            },
            {
              type: 'line',
              label: 'Internal (°F)',
              data: data.internalAvg,
              borderColor: '#f5a623',
              borderWidth: 2.5,
              backgroundColor: 'transparent',
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHoverBackgroundColor: '#f5a623',
              spanGaps: false,
              order: 1,
            },
            {
              type: 'line',
              label: 'External (°F)',
              data: data.externalAvg,
              borderColor: '#1e2d4a',
              borderWidth: 2,
              borderDash: [5, 4],
              backgroundColor: 'transparent',
              fill: false,
              tension: 0.45,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHoverBackgroundColor: '#1e2d4a',
              spanGaps: false,
              order: 2,
            },
          ]
        : [
            {
              type: 'line',
              label: 'Internal (°F)',
              data: data.internalAvg,
              borderColor: '#f5a623',
              borderWidth: 2.5,
              backgroundColor: 'rgba(245,166,35,0.15)',
              fill: true,
              tension: 0.3,
              pointRadius: 0,
              spanGaps: false,
              order: 1,
            },
            {
              type: 'line',
              label: 'External (°F)',
              data: data.externalAvg,
              borderColor: '#1e2d4a',
              borderWidth: 2,
              backgroundColor: 'rgba(30,45,74,0.10)',
              fill: true,
              tension: 0.45,
              pointRadius: 0,
              spanGaps: false,
              order: 2,
            },
          ];

      chartRef.current = new Chart(ctx, {
        data: { labels: data.labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          animation: { duration: 500 },
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              align: 'start',
              labels: {
                color: '#64748b',
                font: { size: 11, family: "'DM Sans', system-ui" },
                boxWidth: 12, boxHeight: 12, padding: 20,
                usePointStyle: true, pointStyleWidth: 12,
              },
            },
            tooltip: {
              backgroundColor: 'rgba(255,255,255,0.97)',
              titleColor: '#1e2d4a',
              bodyColor: '#64748b',
              borderColor: '#e2e8f0',
              borderWidth: 1,
              padding: 10,
              cornerRadius: 0,
              callbacks: {
                label: (c) => c.parsed.y != null ? `  ${c.dataset.label}: ${c.parsed.y.toFixed(1)}` : null,
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(100,116,139,0.10)', borderDash: [3,3] },
              border: { display: false },
              ticks: {
                color: '#94a3b8',
                font: { size: 10, family: "'DM Sans', system-ui" },
                maxRotation: 0,
                autoSkip: true,
                callback: function(val) { return this.getLabelForValue(val) || null; },
              },
            },
            y: {
              position: 'left',
              grid: { color: 'rgba(100,116,139,0.10)', borderDash: [3,3] },
              border: { display: false },
              ticks: {
                color: '#94a3b8',
                font: { size: 10, family: "'DM Sans', system-ui" },
                maxTicksLimit: 6,
                callback: v => `${v}°F`,
              },
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
  }, [data, view]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}

// Range → days, limits, and gap thresholds
const RANGE_DAYS = { '24H': 1, '7D': 7, '30D': 30 };
// For 7D and 30D, use higher limits to get raw (non-aggregated) readings
const RANGE_LIMITS = { '24H': 300, '7D': 5000, '30D': 10000 };
const FILTER_OPTIONS = ['All', 'Normal', 'Warning'];

// Auto-refresh interval in ms
const AUTO_REFRESH_INTERVAL = 60 * 1000; // 1 minute

function exportToCSV(summaries, range) {
  const header = 'Date,Int. Avg,Int. Range,Ext. Avg,Ext. Range,Diff,Status,Avg RSSI\n';
  const rows = summaries.map(r =>
    `${r.date},${r.intAvg},${r.intRange},${r.extAvg},${r.extRange},${r.diff},${r.status},${r.avgRssi}`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `beehive-analytics-${range}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Analytics() {
  const { ready: authReady, error: authError } = useAuth();
  const [range, setRange] = useState('24H');
  const [view, setView] = useState('ranges');
  const [chartData, setChartData] = useState(null);
  const [allSummaries, setAllSummaries] = useState([]);
  const [filterIdx, setFilterIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5);
  const [toast, setToast] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const hiveIdRef = useRef(null);
  const autoRefreshTimerRef = useRef(null);

  useEffect(() => {
    if (!authReady || authError) return;
    apiFetch('/api/hives')
      .then(res => {
        const hives = res?.hives ?? [];
        if (hives.length > 0) {
          hiveIdRef.current = hives[0].id;
          loadData('24H', hives[0].id);
        }
      })
      .catch(() => {});
  }, [authReady, authError]);

  const loadData = useCallback(async (selectedRange, hiveId) => {
    const id = hiveId ?? hiveIdRef.current;
    if (!id) return;

    const days = RANGE_DAYS[selectedRange];
    const limit = RANGE_LIMITS[selectedRange] ?? 500;
    setDataLoading(true);
    try {
      const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

      const [readingsRes, extRes] = await Promise.allSettled([
        apiFetch(`/api/readings/since?hiveId=${id}&since=${since}&order=asc&limit=${limit}`),
        apiFetch(`/api/external-conditions/since?hiveId=${id}&since=${since}&order=asc&limit=${limit}`),
      ]);

      const readings = readingsRes.status === 'fulfilled'
        ? (readingsRes.value?.readings ?? [])
        : [];
      const externalConditions = extRes.status === 'fulfilled'
        ? (extRes.value?.externalConditions ?? [])
        : [];

      const realData = buildChartDataFromAPI(readings, externalConditions, selectedRange);
      setChartData(realData ?? null);
      setAllSummaries(realData?.summaries ?? []);
      setLastRefreshed(new Date());
    } catch {
      setChartData(null);
      setAllSummaries([]);
    } finally {
      setDataLoading(false);
      setVisibleCount(5);
    }
  }, []);

  // Range change
  useEffect(() => {
    if (!authReady || authError) return;
    if (hiveIdRef.current) {
      loadData(range, hiveIdRef.current);
    } else {
      setChartData(null);
      setAllSummaries([]);
      setVisibleCount(5);
    }
  }, [range, loadData, authReady, authError]);

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    if (autoRefreshEnabled && hiveIdRef.current) {
      autoRefreshTimerRef.current = setInterval(() => {
        if (hiveIdRef.current) loadData(range, hiveIdRef.current);
      }, AUTO_REFRESH_INTERVAL);
    }
    return () => { if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current); };
  }, [autoRefreshEnabled, range, loadData]);

  const handleManualRefresh = () => {
    if (hiveIdRef.current && !dataLoading) {
      loadData(range, hiveIdRef.current);
    }
  };

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleExport = () => {
    exportToCSV(allSummaries, range);
    showToast(`Exported ${allSummaries.length} rows as CSV`);
  };

  const handleFilterCycle = () => {
    setFilterIdx(i => (i + 1) % FILTER_OPTIONS.length);
  };

  const currentFilter = FILTER_OPTIONS[filterIdx];
  const filteredSummaries = currentFilter === 'All'
    ? allSummaries
    : allSummaries.filter(r => r.status === currentFilter);
  const visibleSummaries = filteredSummaries.slice(0, visibleCount);
  const hasMore = visibleCount < filteredSummaries.length;

  const fmtLastRefreshed = (d) => {
    if (!d) return '';
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Navigation />
      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>

        {toast && (
          <div style={{
            position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
            background: toast.ok ? '#1e2d4a' : '#ef4444',
            color: 'white', padding: '10px 18px',
            fontSize: '13px', fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'fadeIn 0.2s ease',
          }}>
            {toast.msg}
          </div>
        )}

        <div style={{ padding: '24px 28px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1e2d4a', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Analytics</h1>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Raw readings — Range: {range}
              {dataLoading && ' · Refreshing…'}
              {lastRefreshed && !dataLoading && ` · Updated ${fmtLastRefreshed(lastRefreshed)}`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'white', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              {['24H', '7D', '30D'].map(r => (
                <button key={r} onClick={() => setRange(r)} style={{
                  padding: '7px 16px', border: 'none',
                  background: range === r ? '#1e2d4a' : 'white',
                  color: range === r ? 'white' : '#64748b',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  opacity: dataLoading ? 0.6 : 1,
                }}>{r}</button>
              ))}
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={dataLoading}
              title="Refresh data"
              style={{
                padding: '7px 12px', border: '1.5px solid #e2e8f0',
                background: 'white', color: dataLoading ? '#94a3b8' : '#1e2d4a',
                fontSize: '12px', fontWeight: 700, cursor: dataLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px',
                boxShadow: 'var(--shadow-sm)', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!dataLoading) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ animation: dataLoading ? 'spin 1s linear infinite' : 'none' }}
              >
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Refresh
            </button>

            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefreshEnabled(v => !v)}
              title={autoRefreshEnabled ? 'Auto-refresh ON (1 min) — click to disable' : 'Auto-refresh OFF — click to enable'}
              style={{
                padding: '7px 12px', border: '1.5px solid #e2e8f0',
                background: autoRefreshEnabled ? '#1e2d4a' : 'white',
                color: autoRefreshEnabled ? 'white' : '#64748b',
                fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px',
                boxShadow: 'var(--shadow-sm)', transition: 'all 0.15s',
                letterSpacing: '0.03em', textTransform: 'uppercase',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill={autoRefreshEnabled ? 'white' : 'none'} stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
              </svg>
              Auto
            </button>

            <button
              onClick={handleExport}
              disabled={allSummaries.length === 0}
              style={{
                padding: '7px 14px', border: '1.5px solid #e2e8f0',
                background: 'white', color: '#1e2d4a', fontSize: '12px', fontWeight: 700,
                cursor: allSummaries.length === 0 ? 'not-allowed' : 'pointer',
                opacity: allSummaries.length === 0 ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: 'var(--shadow-sm)', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (allSummaries.length) e.currentTarget.style.background = '#f8fafc'; }}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        <div style={{ padding: '0 28px 28px' }}>
          <div style={{ background: 'white', padding: '22px', boxShadow: 'var(--shadow-sm)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e2d4a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beehive Temperature Analytics</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                  {range === '24H' ? 'Raw 10-min readings (°F)' : `Raw readings (°F) — ${range} view`}
                  &nbsp;·&nbsp;
                  <span style={{ color: '#64748b' }}>Gaps shown where data is missing</span>
                </div>
              </div>
            </div>

            {/* Spin keyframe for refresh icon */}
            <style>{`
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>

            <div style={{ height: '340px' }}>
              {dataLoading || !chartData ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '32px' }}>📈</span>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                    {dataLoading ? 'Loading chart data…' : 'No readings available for the selected range.'}
                  </span>
                </div>
              ) : (
                <AnalyticsChart data={chartData} view={view} />
              )}
            </div>
          </div>

          <div style={{ background: 'white', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e2d4a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Daily Summaries
                <span style={{ marginLeft: '8px', fontSize: '11px', fontWeight: 500, color: '#94a3b8', textTransform: 'none', letterSpacing: 0 }}>
                  {filteredSummaries.length} rows
                </span>
              </div>
              <button
                onClick={handleFilterCycle}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px',
                  border: '1.5px solid #e2e8f0', background: currentFilter !== 'All' ? '#1e2d4a' : 'white',
                  fontSize: '11px', fontWeight: 700,
                  color: currentFilter !== 'All' ? 'white' : '#64748b',
                  cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em',
                  transition: 'all 0.15s',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Filter: {currentFilter}
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafbfc' }}>
                    {[
                      { label: 'DATE',       color: '#94a3b8' },
                      { label: 'INT. AVG',   color: '#f5a623' },
                      { label: 'INT. RANGE', color: '#f5a623' },
                      { label: 'EXT. AVG',   color: '#1e2d4a' },
                      { label: 'EXT. RANGE', color: '#94a3b8' },
                      { label: 'DIFF',       color: '#22c55e' },
                      { label: 'STATUS',     color: '#94a3b8' },
                      { label: 'AVG RSSI',   color: '#94a3b8' },
                    ].map(h => (
                      <th key={h.label} style={{
                        padding: '10px 20px', textAlign: 'left',
                        fontSize: '10px', fontWeight: 700, color: h.color,
                        letterSpacing: '0.07em', textTransform: 'uppercase',
                        borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap',
                      }}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleSummaries.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        {dataLoading ? 'Loading summaries…' : 'No records found. Send readings from your sensor to see data here.'}
                      </td>
                    </tr>
                  ) : (
                    visibleSummaries.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 20px', fontSize: '13px', fontWeight: 600, color: '#1e2d4a', whiteSpace: 'nowrap' }}>{row.date}</td>
                        <td style={{ padding: '12px 20px', fontSize: '13px', color: '#f5a623', fontWeight: 700 }}>{row.intAvg}</td>
                        <td style={{ padding: '12px 20px', fontSize: '13px', color: '#f5a623' }}>{row.intRange}</td>
                        <td style={{ padding: '12px 20px', fontSize: '13px', color: '#1e2d4a', fontWeight: 600 }}>{row.extAvg}</td>
                        <td style={{ padding: '12px 20px', fontSize: '13px', color: '#64748b' }}>{row.extRange}</td>
                        <td style={{ padding: '12px 20px', fontSize: '13px', color: '#22c55e', fontWeight: 700 }}>{row.diff}</td>
                        <td style={{ padding: '12px 20px' }}>
                          <span style={{
                            padding: '3px 10px', fontSize: '11px', fontWeight: 700,
                            background: row.status === 'Normal' ? '#dcfce7' : '#fef3c7',
                            color: row.status === 'Normal' ? '#16a34a' : '#d97706',
                          }}>{row.status}</span>
                        </td>
                        <td style={{ padding: '12px 20px', fontSize: '13px', color: '#64748b' }}>{row.avgRssi}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px', textAlign: 'center' }}>
              {hasMore ? (
                <button
                  onClick={() => setVisibleCount(c => c + 5)}
                  style={{
                    padding: '8px 28px', border: '1.5px solid #e2e8f0',
                    background: 'white', fontSize: '12px', fontWeight: 700,
                    color: '#1e2d4a', cursor: 'pointer', textTransform: 'uppercase',
                    letterSpacing: '0.05em', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'white'}
                >
                  Load More ({filteredSummaries.length - visibleCount} remaining)
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {filteredSummaries.length === 0 ? 'No data to display' : `All ${filteredSummaries.length} rows shown`}
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}