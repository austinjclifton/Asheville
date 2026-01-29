import Navigation from "../components/Navigation";

export default function Analytics() {
  return (
    <div style={{ display: 'flex' }}>
      <Navigation />
      
      <main style={{ flex: 1, padding: '40px', background: '#f8fafc' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            Analytics
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
              <button style={{ 
                padding: '8px 16px', 
                background: '#f59e0b', 
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Week
              </button>
              <button style={{ 
                padding: '8px 16px', 
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Month
              </button>
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', height: '400px' }}>
            <div style={{ 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#94a3b8'
            }}>
              Temperature Trends Chart Placeholder
            </div>
          </div>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '20px'
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>
              Temperature Distribution
            </h3>
            <div style={{ 
              height: '200px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#94a3b8'
            }}>
              Distribution Chart Placeholder
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>
              Status Breakdown
            </h3>
            <div style={{ 
              height: '200px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#94a3b8'
            }}>
              Status Chart Placeholder
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}