import { useState, useEffect } from 'react';
import Navigation from "../components/Navigation";
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { apiFetch } from '../api';

export default function Dashboard() {
  const [latest, setLatest] = useState(null);
  const [history, setHistory] = useState([]);
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const hives = await apiFetch('/api/hives');
        if (!hives || hives.length === 0) return;
        const hive = hives[0];

        const latestReading = await apiFetch(`/api/readings/latest?hiveId=${hive.id}`);
        setLatest(latestReading);

        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const readings = await apiFetch(`/api/readings/since?hiveId=${hive.id}&since=${since}`);
        setHistory(readings || []);

        const devices = await apiFetch('/api/devices');
        if (devices && devices.length > 0) setDevice(devices[0]);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const hoursData = history.map(r => {
    const d = new Date(r.timestamp || r.time || r.createdAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });
  const hiveTemperatureData = history.map(r => r.hiveTemperature ?? r.hive_temperature ?? r.temperature ?? null);
  const externalTemperatureData = history.map(r => r.externalTemperature ?? r.external_temperature ?? r.externalTemp ?? null);

  const normal = history.filter(r => {
    const t = r.hiveTemperature ?? r.hive_temperature ?? r.temperature;
    return t >= 92 && t <= 96;
  }).length;
  const warning = history.filter(r => {
    const t = r.hiveTemperature ?? r.hive_temperature ?? r.temperature;
    return (t >= 88 && t < 92) || (t > 96 && t <= 97);
  }).length;
  const critical = history.filter(r => {
    const t = r.hiveTemperature ?? r.hive_temperature ?? r.temperature;
    return t < 88 || t > 97;
  }).length;
  const total = history.length || 1;

  const statusData = [
    { id: 0, value: normal || 85, label: 'Normal', color: '#22c55e' },
    { id: 1, value: warning || 10, label: 'Warning', color: '#f59e0b' },
    { id: 2, value: critical || 5, label: 'Critical', color: '#ef4444' },
  ];

  const hiveTemp = latest?.hiveTemperature ?? latest?.hive_temperature ?? latest?.temperature;
  const extTemp = latest?.externalTemperature ?? latest?.external_temperature ?? latest?.externalTemp;
  const lastUpdate = latest?.timestamp ?? latest?.time ?? latest?.createdAt;
  const lastUpdateStr = lastUpdate
    ? new Date(lastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--';

  const getHiveStatus = (temp) => {
    if (temp == null) return '--';
    if (temp < 88 || temp > 97) return 'Critical';
    if (temp < 92 || temp > 96) return 'Warning';
    return 'Stable';
  };

  const deviceStatus = device?.status ?? device?.connected ? 'Connected' : null;
  const deviceLastSync = device?.lastSync ?? device?.last_sync ?? lastUpdateStr;
  const signalStrength = device?.signalStrength ?? device?.signal_strength ?? device?.signal ?? 'Strong';

  return (
    <div style={{ display: 'flex' }}>
      <Navigation />
      
      <main style={{ flex: 1, padding: '40px', background: '#f8fafc' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            Dashboard
          </h1>
        </div>

        {error && (
          <div style={{ marginBottom: '20px', padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', color: '#dc2626', fontSize: '14px' }}>
            {error}
          </div>
        )}
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Hive Temperature
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {loading ? '…' : hiveTemp != null ? `${hiveTemp.toFixed(1)}°F` : '—'}
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              External Temperature
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {loading ? '…' : extTemp != null ? `${extTemp.toFixed(1)}°F` : '—'}
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Last Update
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {loading ? '…' : lastUpdateStr}
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Hive Status
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {loading ? '…' : getHiveStatus(hiveTemp)}
            </div>
          </div>
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
            Alert Activity
          </h2>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ 
              padding: '15px', 
              border: '1px solid #fee2e2',
              borderRadius: '6px',
              marginBottom: '10px',
              background: '#fef2f2'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '5px' }}>
                Temperature Below Critical Threshold
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                Hive temperature dropped to 88.2°F
              </div>
            </div>
            
            <div style={{ 
              padding: '15px', 
              border: '1px solid #e0e7ff',
              borderRadius: '6px',
              background: '#eef2ff'
            }}>
              <div style={{ fontWeight: '500', marginBottom: '5px' }}>
                Temperature Approaching Upper Limit
              </div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                Current temperature at 96.8°F
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
            Temperature Activity (Last 24 Hours)
          </h2>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            {!loading && hoursData.length > 0 ? (
              <LineChart
                xAxis={[{ 
                  scaleType: 'point', 
                  data: hoursData,
                  label: 'Time'
                }]}
                series={[
                  {
                    data: hiveTemperatureData,
                    label: 'Hive Temperature',
                    color: '#f59e0b',
                    curve: 'natural'
                  },
                  ...(externalTemperatureData.some(v => v != null) ? [{
                    data: externalTemperatureData,
                    label: 'External Temperature',
                    color: '#3b82f6',
                    curve: 'natural'
                  }] : [])
                ]}
                height={300}
                margin={{ left: 50, right: 20, top: 20, bottom: 50 }}
              />
            ) : (
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                {loading ? 'Loading…' : 'No historical data available'}
              </div>
            )}
          </div>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '20px',
          marginTop: '30px'
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>System Status</h3>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              <div style={{ marginBottom: '8px' }}>Sensor Status: {loading ? '…' : deviceStatus ?? 'Connected'}</div>
              <div style={{ marginBottom: '8px' }}>Last Sync: {loading ? '…' : deviceLastSync}</div>
              <div style={{ marginBottom: '8px' }}>Signal Strength: {loading ? '…' : signalStrength}</div>
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>Status Breakdown</h3>
            <PieChart
              series={[
                {
                  data: statusData,
                  highlightScope: { faded: 'global', highlighted: 'item' },
                  faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                }
              ]}
              height={200}
            />
          </div>
        </div>
      </main>
    </div>
  );
}