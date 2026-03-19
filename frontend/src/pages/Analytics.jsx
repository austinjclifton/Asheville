import { useState, useEffect, useRef, useCallback } from 'react';
import Navigation from "../components/Navigation";
import { apiFetch } from '../api';
import { useAuth } from '../hooks/useAuth';

function buildChartDataFromAPI(readings, externalConditions) {
  if (!readings || readings.length === 0) return null;

  const extByTs = {};
  if (externalConditions && externalConditions.length > 0) {
    externalConditions.forEach(ec => {
      const ts = Math.floor(new Date(ec.bucket_at).getTime() / (10 * 60 * 1000));
      extByTs[ts] = ec.temp_c;
    });
  }

  const labels = readings.map(r => {
    const d = new Date(r.bucket_at);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const internalAvg = readings.map(r => parseFloat(parseFloat(r.temperature).toFixed(1)));

  const externalAvg = readings.map(r => {
    const ts = Math.floor(new Date(r.bucket_at).getTime() / (10 * 60 * 1000));
    for (const offset of [0, 1, -1]) {
      const val = extByTs[ts + offset];
      if (val !== undefined && val !== null) return parseFloat(parseFloat(val).toFixed(1));
    }
    return null;
  });

  const tempDiff = internalAvg.map((intT, i) => {
    const extT = externalAvg[i];
    return extT !== null ? parseFloat((intT - extT).toFixed(1)) : null;
  });

  const dayMap = {};
  readings.forEach((r, i) => {
    const day = new Date(r.bucket_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dayMap[day]) dayMap[day] = { temps: [], extTemps: [] };
    dayMap[day].temps.push(parseFloat(r.temperature));
    const extT = externalAvg[i];
    if (extT !== null) dayMap[day].extTemps.push(extT);
  });

  const summaries = Object.entries(dayMap).map(([date, { temps, extTemps }]) => {
    const intAvgVal = temps.reduce((a, b) => a + b, 0) / temps.length;
    const intMin = Math.min(...temps);
    const intMax = Math.max(...temps);
    const extAvgVal = extTemps.length ? extTemps.reduce((a, b) => a + b, 0) / extTemps.length : null;
    const extMin = extTemps.length ? Math.min(...extTemps) : null;
    const extMax = extTemps.length ? Math.max(...extTemps) : null;
    const diffVal = extAvgVal !== null ? intAvgVal - extAvgVal : null;
    // Healthy hive internal should be ~33–37°C; difference from ambient typically 10–20°C
    const isNormal = diffVal !== null ? (diffVal >= 5 && diffVal <= 25) : true;
    return {
      date,
      intAvg: `${intAvgVal.toFixed(1)}°C`,
      intRange: `${intMin.toFixed(1)}–${intMax.toFixed(1)}°C`,
      extAvg: extAvgVal !== null ? `${extAvgVal.toFixed(1)}°C` : 'N/A',
      extRange: extMin !== null ? `${extMin.toFixed(1)}–${extMax.toFixed(1)}°C` : 'N/A',
      diff: diffVal !== null ? `${diffVal.toFixed(1)}°C` : 'N/A',
      status: isNormal ? 'Normal' : 'Warning',
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
              label: 'Temp Difference (°C)',
              data: data.tempDiff,
              backgroundColor: 'rgba(34,197,94,0.75)',
              borderWidth: 0,
              borderRadius: 1,
              barPercentage: 0.85,
              categoryPercentage: 0.9,
              order: 3,
            },
            {
              type: 'line',
              label: 'Internal Avg (°C)',
              data: data.internalAvg,
              borderColor: '#f5a623',
              borderWidth: 2.5,
              backgroundColor: 'transparent',
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointHoverBackgroundColor: '#f5a623',
              order: 1,
            },
            {
              type: 'line',
              label: 'External Avg (°C)',
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
              order: 2,
            },
          ]
        : [
            {
              type: 'line',
              label: 'Internal Avg (°C)',
              data: data.internalAvg,
              borderColor: '#f5a623',
              borderWidth: 2.5,
              backgroundColor: 'rgba(245,166,35,0.15)',
              fill: true,
              tension: 0.3,
              pointRadius: 0,
              order: 1,
            },
            {
              type: 'line',
              label: 'External Avg (°C)',
              data: data.externalAvg,
              borderColor: '#1e2d4a',
              borderWidth: 2,
              backgroundColor: 'rgba(30,45,74,0.10)',
              fill: true,
              tension: 0.45,
              pointRadius: 0,
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
              cornerRadius: 8,
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
                callback: v => `${v}°C`,
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

function StatCard({ label, value, sub }) {
  // value is null when no data exists — an em-dash at 26px bold looks like a line
  const hasValue = value !== null && value !== undefined && value !== '—';
  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{label}</div>
      {hasValue ? (
        <div style={{ fontSize: '26px', fontWeight: 800, color: '#1e2d4a', letterSpacing: '-0.02em' }}>{value}</div>
      ) : (
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#cbd5e1', paddingTop: '2px', paddingBottom: '2px' }}>No data</div>
      )}
      {sub && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{sub}</div>}
    </div>
  );
}

const RANGE_DAYS = { '7D': 7, '30D': 30, '90D': 90 };
const FILTER_OPTIONS = ['All', 'Normal', 'Warning'];

function exportToCSV(summaries, range) {
  const header = 'Date,Int. Avg,Int. Range,Ext. Avg,Ext. Range,Diff,Status\n';
  const rows = summaries.map(r =>
    `${r.date},${r.intAvg},${r.intRange},${r.extAvg},${r.extRange},${r.diff},${r.status}`
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
  const [range, setRange] = useState('7D');
  const [view, setView] = useState('comparison');
  const [chartData, setChartData] = useState(null);
  const [allSummaries, setAllSummaries] = useState([]);
  const [filterIdx, setFilterIdx] = useState(0);
  const [visibleCount, setVisibleCount] = useState(5);
  const [toast, setToast] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  const hiveIdRef = useRef(null);

  // Only fetch hive data once the auth/session is confirmed ready
  useEffect(() => {
    if (!authReady || authError) return;
    apiFetch('/api/hives')
      .then(res => {
        const hives = res?.hives ?? [];
        if (hives.length > 0) {
          hiveIdRef.current = hives[0].id;
          loadData('7D', hives[0].id);
        }
      })
      .catch(() => {});
  }, [authReady, authError]);

  const loadData = useCallback(async (selectedRange, hiveId) => {
    const id = hiveId ?? hiveIdRef.current;
    if (!id) return;

    const days = RANGE_DAYS[selectedRange];
    setDataLoading(true);
    try {
      const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

      const [readingsRes, extRes] = await Promise.allSettled([
        apiFetch(`/api/readings/since?hiveId=${id}&since=${since}&order=asc&limit=500`),
        apiFetch(`/api/external-conditions/since?hiveId=${id}&since=${since}&order=asc`),
      ]);

      const readings = readingsRes.status === 'fulfilled'
        ? (readingsRes.value?.readings ?? [])
        : [];
      const externalConditions = extRes.status === 'fulfilled'
        ? (extRes.value?.externalConditions ?? [])
        : [];

      const realData = buildChartDataFromAPI(readings, externalConditions);
      setChartData(realData ?? null);
      setAllSummaries(realData?.summaries ?? []);
    } catch {
      setChartData(null);
      setAllSummaries([]);
    } finally {
      setDataLoading(false);
      setVisibleCount(5);
    }
  }, []);

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

  const intVals = chartData?.internalAvg ?? [];
  const extVals = (chartData?.externalAvg ?? []).filter(v => v !== null);
  const intAvg  = intVals.length ? (intVals.reduce((a, b) => a + b, 0) / intVals.length).toFixed(1) : null;
  const intMin  = intVals.length ? Math.min(...intVals).toFixed(1) : null;
  const intMax  = intVals.length ? Math.max(...intVals).toFixed(1) : null;
  const extAvg  = extVals.length ? (extVals.reduce((a, b) => a + b, 0) / extVals.length).toFixed(1) : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Navigation />
      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>

        {toast && (
          <div style={{
            position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
            background: toast.ok ? '#1e2d4a' : '#ef4444',
            color: 'white', padding: '10px 18px', borderRadius: '10px',
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
              Data aggregation: 10 mins &nbsp;·&nbsp; Range: {range}
              {dataLoading && ' · Loading…'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
              {['7D', '30D', '90D'].map(r => (
                <button key={r} onClick={() => setRange(r)} style={{
                  padding: '7px 16px', border: 'none',
                  background: range === r ? '#1e2d4a' : 'white',
                  color: range === r ? 'white' : '#64748b',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  opacity: dataLoading ? 0.6 : 1,
                }}>{r}</button>
              ))}
            </div>
            <button
              onClick={handleExport}
              disabled={allSummaries.length === 0}
              style={{
                padding: '7px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <StatCard
              label="Internal Avg Temp"
              value={intAvg !== null ? `${intAvg}°C` : null}
              sub={intAvg !== null ? `±${(parseFloat(intMax) - parseFloat(intMin)).toFixed(1)}°C variance` : 'No data for range'}
            />
            <StatCard label="Internal Min Temp" value={intMin !== null ? `${intMin}°C` : null} sub="Over selected range" />
            <StatCard label="Internal Max Temp" value={intMax !== null ? `${intMax}°C` : null} sub="Over selected range" />
            <StatCard label="External Avg Temp" value={extAvg !== null ? `${extAvg}°C` : null} sub="Ambient sensor" />
          </div>

          <div style={{ background: 'white', borderRadius: '12px', padding: '22px', boxShadow: 'var(--shadow-sm)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e2d4a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beehive Temperature Analytics</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>Comparing internal retention vs external ambient (°C)</div>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['comparison', 'ranges'].map(v => (
                  <button key={v} onClick={() => setView(v)} style={{
                    padding: '6px 14px', borderRadius: '6px', border: 'none',
                    background: view === v ? '#f1f5f9' : 'transparent',
                    color: view === v ? '#1e2d4a' : '#94a3b8',
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    transition: 'all 0.15s',
                  }}>{v}</button>
                ))}
              </div>
            </div>
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

          <div style={{ background: 'white', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
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
                  padding: '6px 12px', borderRadius: '8px',
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
                      <td colSpan="7" style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
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
                            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                            background: row.status === 'Normal' ? '#dcfce7' : '#fef3c7',
                            color: row.status === 'Normal' ? '#16a34a' : '#d97706',
                          }}>{row.status}</span>
                        </td>
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
                    padding: '8px 28px', border: '1.5px solid #e2e8f0', borderRadius: '8px',
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