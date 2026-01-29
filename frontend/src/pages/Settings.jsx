import Navigation from "../components/Navigation";

export default function Settings() {
  return (
    <div style={{ display: 'flex' }}>
      <Navigation />
      
      <main style={{ flex: 1, padding: '40px', background: '#f8fafc' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            Settings
          </h1>
          <p style={{ color: '#64748b' }}>Manage your system preferences and alerts</p>
        </div>
        
        <div style={{ maxWidth: '800px' }}>
            
          {/* Temperature Thresholds Section */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
              Temperature Thresholds
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Critical Low (°F)
              </label>
              <input 
                type="number" 
                defaultValue="88"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                Alert when temperature drops below this value
              </p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Critical High (°F)
              </label>
              <input 
                type="number" 
                defaultValue="97"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                Alert when temperature exceeds this value
              </p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Optimal Range Low (°F)
              </label>
              <input 
                type="number" 
                defaultValue="92"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Optimal Range High (°F)
              </label>
              <input 
                type="number" 
                defaultValue="95"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          
          {/* Alert Preferences Section */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
              Alert Preferences
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ marginRight: '10px' }} />
                <span style={{ fontSize: '14px' }}>Enable critical alerts</span>
              </label>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ marginRight: '10px' }} />
                <span style={{ fontSize: '14px' }}>Enable warning alerts</span>
              </label>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" style={{ marginRight: '10px' }} />
                <span style={{ fontSize: '14px' }}>Enable info notifications</span>
              </label>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ marginRight: '10px' }} />
                <span style={{ fontSize: '14px' }}>Send email notifications</span>
              </label>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Notification Email
              </label>
              <input 
                type="email" 
                placeholder="your@email.com"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          
          {/* Sensor Configuration Section */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
              Sensor Configuration
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Sensor ID
              </label>
              <input 
                type="text" 
                defaultValue="SENSOR-001"
                disabled
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  background: '#f8fafc',
                  color: '#64748b'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Reading Interval (minutes)
              </label>
              <select 
                defaultValue="5"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="1">1 minute</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Temperature Unit
              </label>
              <select 
                defaultValue="fahrenheit"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="fahrenheit">Fahrenheit (°F)</option>
                <option value="celsius">Celsius (°C)</option>
              </select>
            </div>
          </div>
          
          {/* Account Settings Section */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
              Account Settings
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Display Name
              </label>
              <input 
                type="text" 
                placeholder="Your name"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Email
              </label>
              <input 
                type="email" 
                placeholder="your@email.com"
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div>
              <button style={{
                padding: '10px 20px',
                background: 'white',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}>
                Change Password
              </button>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
            <button style={{
              padding: '10px 24px',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              Cancel
            </button>
            <button style={{
              padding: '10px 24px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              Save Changes
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}