import Navigation from "../components/Navigation";
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';

//Dummy data for 24-hour temperature tracking
const hoursData = [
  '12am', '1am', '2am', '3am', '4am', '5am', 
  '6am', '7am', '8am', '9am', '10am', '11am',
  '12pm', '1pm', '2pm'
];

const hiveTemperatureData = [
  93.2, 92.8, 92.5, 92.3, 92.1, 92.4,
  92.8, 93.5, 94.2, 94.8, 95.1, 95.3,
  95.0, 94.7, 94.9
];

const externalTemperatureData = [
  65.2, 64.1, 63.5, 62.8, 62.3, 63.1,
  65.4, 68.2, 71.5, 75.3, 78.8, 80.5,
  81.2, 81.7, 81.9
];

//Dummy data for status breakdown
const statusData = [
  { id: 0, value: 85, label: 'Normal', color: '#22c55e' },
  { id: 1, value: 10, label: 'Warning', color: '#f59e0b' },
  { id: 2, value: 5, label: 'Critical', color: '#ef4444' },
];

export default function Dashboard() {
  return (
    <div style={{ display: 'flex' }}>
      <Navigation />
      
      <main style={{ flex: 1, padding: '40px', background: '#f8fafc' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            Dashboard
          </h1>
        </div>
        
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
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>94.9°F</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              External Temperature
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>81.9°F</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Last Update
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>2:50pm</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Hive Status
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>Stable</div>
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
                {
                  data: externalTemperatureData,
                  label: 'External Temperature',
                  color: '#3b82f6',
                  curve: 'natural'
                }
              ]}
              height={300}
              margin={{ left: 50, right: 20, top: 20, bottom: 50 }}
            />
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
              <div style={{ marginBottom: '8px' }}>Sensor Status: Connected</div>
              <div style={{ marginBottom: '8px' }}>Last Sync: 2:50 PM</div>
              <div style={{ marginBottom: '8px' }}>Signal Strength: Strong</div>
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