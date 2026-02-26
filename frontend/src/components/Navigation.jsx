import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, setCsrfToken } from '../api';

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "D" },
    { href: "/analytics", label: "Analytics", icon: "An" },
    { href: "/alerts", label: "Alerts", icon: "Al" },
    { href: "/settings", label: "Settings", icon: "S" },
  ];

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {
      //ignore errors
    }
    setCsrfToken(null);
    navigate('/');
  };

  return (
    <nav style={{
      width: '60px',
      background: '#FFFFFF',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 0',
      gap: '20px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        background: '#f59e0b',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        marginBottom: '20px'
      }}>
        Bee
      </div>
      
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            background: location.pathname === item.href ? '#334155' : 'transparent',
            fontSize: '20px',
            transition: 'background 0.2s',
            textDecoration: 'none',
            color: 'inherit'
          }}
          title={item.label}
        >
          {item.icon}
        </Link>
      ))}
      
      <div style={{ marginTop: 'auto' }}>
        <a
          href="#"
          onClick={handleLogout}
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            textDecoration: 'none',
            color: 'inherit',
            cursor: 'pointer'
          }}
          title="Logout"
        >
          Logout
        </a>
      </div>
    </nav>
  );
}