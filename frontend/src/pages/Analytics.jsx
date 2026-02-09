import { useState } from 'react';
import Navigation from "../components/Navigation";
import { LineChart } from '@mui/x-charts/LineChart';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';

// Dummy data for weekly temperature trends
const weeklyDaysData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const weeklyHiveTemp = [93.5, 94.2, 93.8, 94.5, 95.1, 94.8, 94.9];
const weeklyExternalTemp = [75.3, 78.1, 76.5, 79.2, 80.8, 81.3, 81.9];

// Dummy data for monthly temperature trends
const monthlyDaysData = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29];
const monthlyHiveTemp = [
  92.1, 92.8, 93.2, 93.5, 93.8, 94.1, 94.3, 94.5, 
  94.7, 94.8, 94.9, 95.0, 95.1, 94.9, 94.8
];
const monthlyExternalTemp = [
  68.2, 70.5, 72.1, 73.8, 75.2, 76.8, 77.5, 78.9, 
  79.5, 80.1, 80.8, 81.2, 81.5, 81.7, 81.9
];

// Dummy data for temperature distribution (bar chart)
const tempRanges = ['88-90°F', '90-92°F', '92-94°F', '94-96°F', '96-98°F'];
const tempDistribution = [5, 15, 35, 30, 15];

// Dummy data for status breakdown
const statusData = [
  { id: 0, value: 420, label: 'Normal', color: '#22c55e' },
  { id: 1, value: 65, label: 'Warning', color: '#f59e0b' },
  { id: 2, value: 23, label: 'Critical', color: '#ef4444' },
];

// Dummy data for hourly variance
const hoursData = Array.from({ length: 24 }, (_, i) => `${i}:00`);
const varianceData = [
  1.2, 1.1, 0.9, 0.8, 0.7, 0.9, 1.1, 1.3, 1.5, 1.8, 2.1, 2.3,
  2.5, 2.4, 2.2, 2.0, 1.9, 1.7, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('week');

  return (
    <div style={{ display: 'flex' }}>
      <Navigation />
      
      <main style={{ flex: 1, padding: '40px', background: '#f8fafc' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            Analytics
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            Displaying dummy data for demonstration
          </p>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Avg Temperature
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>94.5°F</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Min Temperature
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>90.8°F</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Max Temperature
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>97.3°F</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Variance
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>±1.8°F</div>
          </div>
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
              Temperature Trends
            </h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setTimeRange('week')}
                style={{ 
                  padding: '8px 16px', 
                  background: timeRange === 'week' ? '#f59e0b' : 'white', 
                  color: timeRange === 'week' ? 'white' : '#334155',
                  border: timeRange === 'week' ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Week
              </button>
              <button 
                onClick={() => setTimeRange('month')}
                style={{ 
                  padding: '8px 16px', 
                  background: timeRange === 'month' ? '#f59e0b' : 'white',
                  color: timeRange === 'month' ? 'white' : '#334155',
                  border: timeRange === 'month' ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Month
              </button>
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }}>
            <LineChart
              xAxis={[{ 
                scaleType: 'point', 
                data: timeRange === 'week' ? weeklyDaysData : monthlyDaysData,
                label: timeRange === 'week' ? 'Day of Week' : 'Day of Month'
              }]}
              yAxis={[{
                label: 'Temperature (°F)'
              }]}
              series={[
                {
                  data: timeRange === 'week' ? weeklyHiveTemp : monthlyHiveTemp,
                  label: 'Hive Temperature',
                  color: '#f59e0b',
                  curve: 'natural',
                  showMark: true
                },
                {
                  data: timeRange === 'week' ? weeklyExternalTemp : monthlyExternalTemp,
                  label: 'External Temperature',
                  color: '#3b82f6',
                  curve: 'natural',
                  showMark: true
                }
              ]}
              height={400}
              margin={{ left: 70, right: 20, top: 20, bottom: 60 }}
            />
          </div>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>
              Temperature Distribution
            </h3>
            <BarChart
              xAxis={[{ 
                scaleType: 'band', 
                data: tempRanges,
                label: 'Temperature Range'
              }]}
              yAxis={[{
                label: 'Frequency (%)'
              }]}
              series={[{
                data: tempDistribution,
                label: 'Distribution',
                color: '#f59e0b'
              }]}
              height={300}
              margin={{ left: 60, right: 20, top: 20, bottom: 60 }}
            />
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>
              Status Breakdown
            </h3>
            <PieChart
              series={[
                {
                  data: statusData,
                  highlightScope: { faded: 'global', highlighted: 'item' },
                  faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                }
              ]}
              height={300}
            />
          </div>
        </div>

        <div style={{ background: 'white', padding: '30px', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px' }}>
            Temperature Variance by Hour (24-Hour Cycle)
          </h2>
          <LineChart
            xAxis={[{ 
              scaleType: 'point', 
              data: hoursData,
              label: 'Hour of Day',
              tickLabelInterval: (value, index) => index % 2 === 0
            }]}
            yAxis={[{
              label: 'Variance (±°F)'
            }]}
            series={[
              {
                data: varianceData,
                label: 'Temperature Variance',
                color: '#8b5cf6',
                curve: 'natural',
                area: true
              }
            ]}
            height={300}
            margin={{ left: 60, right: 20, top: 20, bottom: 60 }}
          />
        </div>
      </main>
    </div>
  );
}