import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, setCsrfToken } from '../api';
 
const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/analytics',
    label: 'Analytics',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: '/alerts',
    label: 'Activity',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
];
 
function getSavedExpanded() {
  try { return localStorage.getItem('nav_expanded') !== 'false'; } catch { return true; }
}
 
function getInitials(name) {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
 
export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(getSavedExpanded);
  const [user, setUser] = useState(null);
 
  // On mount, refresh the CSRF token (handles page refresh) and fetch user info.
  useEffect(() => {
    async function initAuth() {
      try {
        const [csrfRes, meRes] = await Promise.all([
          apiFetch('/api/auth/csrf'),
          apiFetch('/api/auth/me'),
        ]);
        setCsrfToken(csrfRes.csrfToken);
        setUser(meRes.user);
      } catch {
        // Session may have expired — navigation will handle redirects.
      }
    }
    initAuth();
  }, []);
 
  const handleToggle = () => {
    setIsExpanded(prev => {
      const next = !prev;
      try { localStorage.setItem('nav_expanded', String(next)); } catch {}
      return next;
    });
  };
 
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (_) {}
    setCsrfToken(null);
    navigate('/');
  };
 
  const displayName = user?.username || 'User';
  const initials = getInitials(displayName);
 
  return (
    <aside style={{
      width: isExpanded ? '240px' : '72px',
      minHeight: '100vh',
      background: '#1e2d4a',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      height: '100vh',
    }}>
      {/* Logo */}
      <div style={{
        padding: isExpanded ? '28px 20px 24px' : '28px 16px 24px',
        display: 'flex', alignItems: 'center', gap: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          width: '40px', height: '40px', background: '#f5a623',
          borderRadius: '10px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8 2 5 5 5 9c0 2.5 1.2 4.7 3 6.1V20a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-4.9c1.8-1.4 3-3.6 3-6.1 0-4-3-7-7-7z" fill="white" opacity="0.95"/>
          </svg>
        </div>
        {isExpanded && (
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '18px', lineHeight: 1.2 }}>Asheville</div>
          </div>
        )}
      </div>
 
      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              title={!isExpanded ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                gap: '12px',
                padding: isExpanded ? '10px 12px' : '10px',
                borderRadius: '10px',
                color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '14px',
                transition: 'all 0.15s ease',
                textDecoration: 'none',
                justifyContent: isExpanded ? 'flex-start' : 'center',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }
              }}
              onMouseLeave={e => {
                if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }
              }}
            >
              {isActive && (
                <span style={{
                  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                  width: '3px', height: '20px', background: '#f5a623', borderRadius: '0 3px 3px 0',
                }} />
              )}
              <span style={{ color: isActive ? '#f5a623' : 'inherit', flexShrink: 0 }}>{item.icon}</span>
              {isExpanded && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
 
      {/* Bottom: toggle + user */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 10px' }}>
        {/* Toggle */}
        <button
          onClick={handleToggle}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: isExpanded ? 'flex-end' : 'center',
            padding: '8px 12px', background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.4)', cursor: 'pointer', borderRadius: '8px', marginBottom: '8px',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {isExpanded
              ? <polyline points="15 18 9 12 15 6" />
              : <polyline points="9 18 15 12 9 6" />
            }
          </svg>
        </button>
 
        {/* User row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px',
          justifyContent: isExpanded ? 'space-between' : 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', background: '#f5a623',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '13px', flexShrink: 0,
            }}>
              {initials}
            </div>
            {isExpanded && (
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>{displayName}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{user?.email || 'Beekeeper'}</div>
              </div>
            )}
          </div>
          {isExpanded && (
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}