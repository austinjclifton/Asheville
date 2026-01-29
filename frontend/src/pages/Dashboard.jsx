import Navigation from "../components/Navigation";

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
            Temperature Activity
          </h2>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', height: '300px' }}>
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#94a3b8'
            }}>
              Chart Placeholder
            </div>
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
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Status information placeholder
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}