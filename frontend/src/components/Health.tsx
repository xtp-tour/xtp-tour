import React, { useState, useEffect } from 'react';

interface HealthResponse {
  service?: string;
  status?: string;
  message?: string;
}

const Health: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('');

  const checkHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Make a direct fetch call to ping endpoint without authentication
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${baseUrl}/api/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setHealthData(data);
      setLastChecked(new Date().toLocaleString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ping backend');
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusBadgeClass = (status?: string) => {
    if (!status) return 'bg-secondary';
    switch (status.toLowerCase()) {
      case 'ok':
        return 'bg-success';
      case 'error':
      case 'db connection error':
        return 'bg-danger';
      default:
        return 'bg-warning';
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h2 className="mb-0">
                  <i className="bi bi-activity me-2"></i>
                  System Health Check
                </h2>
                <button 
                  className="btn btn-light btn-sm"
                  onClick={checkHealth}
                  disabled={loading}
                >
                  <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
                  {loading ? ' Checking...' : ' Refresh'}
                </button>
              </div>
            </div>
            
            <div className="card-body">
              {loading && !healthData && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 mb-0">Pinging backend...</p>
                </div>
              )}

              {error && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <div>
                    <strong>Connection Failed:</strong> {error}
                  </div>
                </div>
              )}

              {healthData && (
                <div className="row g-3">
                  <div className="col-12">
                    <div className="d-flex align-items-center mb-3">
                      <i className="bi bi-server me-2 text-primary fs-4"></i>
                      <h5 className="mb-0">Backend Status</h5>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="border rounded p-3 h-100">
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-circle-fill text-success me-2"></i>
                        <strong>Status</strong>
                      </div>
                      <span className={`badge ${getStatusBadgeClass(healthData.status)} fs-6`}>
                        {healthData.status || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="border rounded p-3 h-100">
                      <div className="d-flex align-items-center mb-2">
                        <i className="bi bi-info-circle text-primary me-2"></i>
                        <strong>Service</strong>
                      </div>
                      <code className="text-dark">{healthData.service || 'N/A'}</code>
                    </div>
                  </div>
                  
                  {healthData.message && (
                    <div className="col-12">
                      <div className="border rounded p-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-chat-text text-info me-2"></i>
                          <strong>Message</strong>
                        </div>
                        <p className="mb-0 text-muted">{healthData.message}</p>
                      </div>
                    </div>
                  )}
                  
                  {lastChecked && (
                    <div className="col-12">
                      <div className="border rounded p-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-clock text-secondary me-2"></i>
                          <strong>Last Checked</strong>
                        </div>
                        <small className="text-muted">{lastChecked}</small>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
                
        </div>
      </div>
    </div>
  );
};

export default Health; 