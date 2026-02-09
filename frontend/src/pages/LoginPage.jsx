import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    //Add authentication logic here later
    navigate('/dashboard');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#0a1929'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '8px',
        width: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Asheville</h1>
          <p style={{ color: '#666' }}>North Carolina</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Email Address
            </label>
            <input 
              type="email" 
              placeholder="Enter your email"
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
              Password
            </label>
            <input 
              type="password" 
              placeholder="Enter your password"
              style={{ 
                width: '100%', 
                padding: '10px', 
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <label>
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" style={{ color: '#f59e0b' }}>Forgot password?</a>
          </div>
          
          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
