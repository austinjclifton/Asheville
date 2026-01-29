import Navigation from "../components/Navigation";

export default function Alerts() {
  return (
    <div style={{ display: 'flex' }}>
      <Navigation />
      
      <main style={{ flex: 1, padding: '40px', background: '#f8fafc' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            Alerts
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
              Active Critical
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>1</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Active Warnings
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>0</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Resolved Today
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>1</div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Total Alerts
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>8</div>
          </div>
        </div>
        
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '15px',
            flexWrap: 'wrap'
          }}>
            <button style={{ 
              padding: '8px 16px', 
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              All
            </button>
            <button style={{ 
              padding: '8px 16px', 
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              Critical
            </button>
            <button style={{ 
              padding: '8px 16px', 
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              Warning
            </button>
            <button style={{ 
              padding: '8px 16px', 
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              Info
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <button style={{ 
                padding: '8px 16px', 
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                Active
              </button>
              <button style={{ 
                padding: '8px 16px', 
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                Acknowledged
              </button>
              <button style={{ 
                padding: '8px 16px', 
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                Resolved
              </button>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #fee2e2',
            borderLeft: '4px solid #ef4444'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginBottom: '10px'
                }}>
                  Active
                </div>
                <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  Temperature Below Critical Threshold
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
                  Hive temperature dropped to 88.2°F, which is below the safe operating range. Immediate attention required.
                </p>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Time: 2 hours ago  •  Degree: 88.2°F  •  Alert: Below Range
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #dbeafe',
            borderLeft: '4px solid #6366f1'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: '#dbeafe',
                  color: '#6366f1',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginBottom: '10px'
                }}>
                  Acknowledged
                </div>
                <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  Rapid Temperature Drop Detected
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
                  Temperature decreased by 4.5°F within 15 minutes. Check hive insulation and external conditions.
                </p>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Time: 4 hours ago  •  Degree: 90.8°F  •  Alert: Below Range
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ 
            background: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            border: '1px solid #dcfce7',
            borderLeft: '4px solid #22c55e'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  display: 'inline-block',
                  padding: '4px 12px',
                  background: '#dcfce7',
                  color: '#16a34a',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginBottom: '10px'
                }}>
                  Resolved
                </div>
                <h3 style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  Temperature Approaching Upper Limit
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
                  Current temperature at 96.8°F is approaching the upper threshold of 97°F
                </p>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Time: 8 hours ago  •  Degree: 96.8°F
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}