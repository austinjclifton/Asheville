import { useState } from 'react';
import Navigation from "../components/Navigation";

//Dummy alerts data
const initialAlerts = [
  {
    id: 1,
    severity: 'critical',
    status: 'active',
    title: 'Temperature Below Critical Threshold',
    description: 'Hive temperature dropped to 88.2°F, which is below the safe operating range. Immediate attention required.',
    time: '2 hours ago',
    temperature: '88.2°F',
    type: 'Below Range'
  },
  {
    id: 2,
    severity: 'warning',
    status: 'acknowledged',
    title: 'Rapid Temperature Drop Detected',
    description: 'Temperature decreased by 4.5°F within 15 minutes. Check hive insulation and external conditions.',
    time: '4 hours ago',
    temperature: '90.8°F',
    type: 'Below Range'
  },
  {
    id: 3,
    severity: 'info',
    status: 'resolved',
    title: 'Temperature Approaching Upper Limit',
    description: 'Current temperature at 96.8°F is approaching the upper threshold of 97°F',
    time: '8 hours ago',
    temperature: '96.8°F',
    type: 'Normal'
  },
  {
    id: 4,
    severity: 'warning',
    status: 'active',
    title: 'External Temperature Rising',
    description: 'External temperature has risen to 85°F, monitor hive cooling system.',
    time: '1 hour ago',
    temperature: '85.0°F',
    type: 'Warning'
  },
  {
    id: 5,
    severity: 'info',
    status: 'resolved',
    title: 'Temperature Stabilized',
    description: 'Hive temperature has returned to normal operating range.',
    time: '12 hours ago',
    temperature: '94.2°F',
    type: 'Normal'
  }
];

export default function Alerts() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  //Filter alerts based on selected filters
  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSeverity && matchesStatus;
  });

  //Calculate statistics
  const stats = {
    activeCritical: alerts.filter(a => a.status === 'active' && a.severity === 'critical').length,
    activeWarnings: alerts.filter(a => a.status === 'active' && a.severity === 'warning').length,
    resolvedToday: alerts.filter(a => a.status === 'resolved' && a.time.includes('hours')).length,
    total: alerts.length
  };

  //Handle acknowledging an alert
  const handleAcknowledge = (alertId) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
    ));
  };

  //Handle resolving an alert
  const handleResolve = (alertId) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, status: 'resolved' } : alert
    ));
  };

  //Handle dismissing an alert
  const handleDismiss = (alertId) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  //Get alert styling based on severity
  const getAlertStyle = (severity) => {
    switch(severity) {
      case 'critical':
        return {
          border: '1px solid #fee2e2',
          borderLeft: '4px solid #ef4444',
          background: 'white'
        };
      case 'warning':
        return {
          border: '1px solid #fef3c7',
          borderLeft: '4px solid #f59e0b',
          background: 'white'
        };
      case 'info':
        return {
          border: '1px solid #dbeafe',
          borderLeft: '4px solid #6366f1',
          background: 'white'
        };
      default:
        return {
          border: '1px solid #e5e7eb',
          borderLeft: '4px solid #6b7280',
          background: 'white'
        };
    }
  };

  //Get badge styling based on status
  const getBadgeStyle = (status) => {
    switch(status) {
      case 'active':
        return {
          background: '#fee2e2',
          color: '#dc2626'
        };
      case 'acknowledged':
        return {
          background: '#dbeafe',
          color: '#6366f1'
        };
      case 'resolved':
        return {
          background: '#dcfce7',
          color: '#16a34a'
        };
      default:
        return {
          background: '#f3f4f6',
          color: '#6b7280'
        };
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Navigation />
      
      <main style={{ flex: 1, padding: '40px', background: '#f8fafc' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
            Alerts
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'} found
          </p>
        </div>
        
        {/* Statistics Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Active Critical
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
              {stats.activeCritical}
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Active Warnings
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
              {stats.activeWarnings}
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Resolved Today
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#22c55e' }}>
              {stats.resolvedToday}
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px' }}>
              Total Alerts
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {stats.total}
            </div>
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            marginBottom: '15px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: '500', fontSize: '14px', color: '#64748b', marginRight: '10px' }}>
              Severity:
            </span>
            <button 
              onClick={() => setSeverityFilter('all')}
              style={{ 
                padding: '8px 16px', 
                background: severityFilter === 'all' ? '#f59e0b' : 'white',
                color: severityFilter === 'all' ? 'white' : '#334155',
                border: severityFilter === 'all' ? 'none' : '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              All
            </button>
            <button 
              onClick={() => setSeverityFilter('critical')}
              style={{ 
                padding: '8px 16px', 
                background: severityFilter === 'critical' ? '#ef4444' : 'white',
                color: severityFilter === 'critical' ? 'white' : '#334155',
                border: severityFilter === 'critical' ? 'none' : '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Critical
            </button>
            <button 
              onClick={() => setSeverityFilter('warning')}
              style={{ 
                padding: '8px 16px', 
                background: severityFilter === 'warning' ? '#f59e0b' : 'white',
                color: severityFilter === 'warning' ? 'white' : '#334155',
                border: severityFilter === 'warning' ? 'none' : '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Warning
            </button>
            <button 
              onClick={() => setSeverityFilter('info')}
              style={{ 
                padding: '8px 16px', 
                background: severityFilter === 'info' ? '#6366f1' : 'white',
                color: severityFilter === 'info' ? 'white' : '#334155',
                border: severityFilter === 'info' ? 'none' : '1px solid #e2e8f0',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Info
            </button>
            
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontWeight: '500', fontSize: '14px', color: '#64748b', marginRight: '10px' }}>
                Status:
              </span>
              <button 
                onClick={() => setStatusFilter('active')}
                style={{ 
                  padding: '8px 16px', 
                  background: statusFilter === 'active' ? '#f59e0b' : 'white',
                  color: statusFilter === 'active' ? 'white' : '#334155',
                  border: statusFilter === 'active' ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Active
              </button>
              <button 
                onClick={() => setStatusFilter('acknowledged')}
                style={{ 
                  padding: '8px 16px', 
                  background: statusFilter === 'acknowledged' ? '#f59e0b' : 'white',
                  color: statusFilter === 'acknowledged' ? 'white' : '#334155',
                  border: statusFilter === 'acknowledged' ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Acknowledged
              </button>
              <button 
                onClick={() => setStatusFilter('resolved')}
                style={{ 
                  padding: '8px 16px', 
                  background: statusFilter === 'resolved' ? '#f59e0b' : 'white',
                  color: statusFilter === 'resolved' ? 'white' : '#334155',
                  border: statusFilter === 'resolved' ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Resolved
              </button>
              <button 
                onClick={() => setStatusFilter('all')}
                style={{ 
                  padding: '8px 16px', 
                  background: statusFilter === 'all' ? '#f59e0b' : 'white',
                  color: statusFilter === 'all' ? 'white' : '#334155',
                  border: statusFilter === 'all' ? 'none' : '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                All
              </button>
            </div>
          </div>
        </div>
        
        {/* Alerts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredAlerts.length === 0 ? (
            <div style={{ 
              background: 'white', 
              padding: '40px', 
              borderRadius: '8px',
              textAlign: 'center',
              color: '#94a3b8'
            }}>
              No alerts found matching the selected filters.
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div 
                key={alert.id}
                style={{ 
                  ...getAlertStyle(alert.severity),
                  padding: '20px', 
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'inline-block',
                      padding: '4px 12px',
                      ...getBadgeStyle(alert.status),
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      marginBottom: '10px',
                      textTransform: 'capitalize'
                    }}>
                      {alert.status}
                    </div>
                    <h3 style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
                      {alert.title}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '10px', lineHeight: '1.5' }}>
                      {alert.description}
                    </p>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                      Time: {alert.time}  •  Degree: {alert.temperature}  •  Alert: {alert.type}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '10px', marginLeft: '20px' }}>
                    {alert.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          style={{
                            padding: '8px 16px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#2563eb'}
                          onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => handleResolve(alert.id)}
                          style={{
                            padding: '8px 16px',
                            background: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            transition: 'background 0.2s'
                          }}
                          onMouseOver={(e) => e.target.style.background = '#16a34a'}
                          onMouseOut={(e) => e.target.style.background = '#22c55e'}
                        >
                          Resolve
                        </button>
                      </>
                    )}
                    
                    {alert.status === 'acknowledged' && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        style={{
                          padding: '8px 16px',
                          background: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#16a34a'}
                        onMouseOut={(e) => e.target.style.background = '#22c55e'}
                      >
                        Resolve
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      style={{
                        padding: '8px 16px',
                        background: 'white',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        borderRadius: '4px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#ef4444';
                        e.target.style.color = 'white';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.color = '#ef4444';
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}