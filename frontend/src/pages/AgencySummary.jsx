import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import './AgencySummary.css';

const AgencySummary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('count'); // 'count' or 'name'
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/sena/records/', {
        withCredentials: true,
      });
      
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setRecords(data);
      processAgencies(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching records:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const processAgencies = (recordsData) => {
    const agencyMap = {};

    // Group records by agency name
    recordsData.forEach(record => {
      if (record.agency_records && record.agency_records.length > 0) {
        const agencyName = record.agency_records[0].agencyName;
        if (agencyName) {
          if (!agencyMap[agencyName]) {
            agencyMap[agencyName] = {
              name: agencyName,
              contact: record.agency_records[0].contact_number || '-',
              count: 0,
              records: []
            };
          }
          agencyMap[agencyName].count++;
          agencyMap[agencyName].records.push(record);
        }
      }
    });

    // Convert to array and sort
    let agencyList = Object.values(agencyMap);
    if (sortBy === 'count') {
      agencyList.sort((a, b) => b.count - a.count);
    } else {
      agencyList.sort((a, b) => a.name.localeCompare(b.name));
    }

    setAgencies(agencyList);
  };

  const handleSort = (newSortBy) => {
    setSortBy(newSortBy);
    if (newSortBy === 'count') {
      setAgencies([...agencies].sort((a, b) => b.count - a.count));
    } else {
      setAgencies([...agencies].sort((a, b) => a.name.localeCompare(b.name)));
    }
  };

  const filteredAgencies = agencies.filter(agency =>
    agency.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewRecords = (agencyName) => {
    // Navigate to records list with agency filter
    navigate(`/sena-records-list?agency=${encodeURIComponent(agencyName)}`);
  };

  const handleViewStats = (agency) => {
    setSelectedAgency(agency);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAgency(null);
  };

  const getStatusBreakdown = (agencyRecords) => {
    const breakdown = {};
    agencyRecords.forEach(record => {
      const status = record.clientStatus || 'unknown';
      breakdown[status] = (breakdown[status] || 0) + 1;
    });
    return breakdown;
  };

  if (loading) {
    return <div className="agency-container"><div className="loading">Loading agencies...</div></div>;
  }

  return (
    <div className="agency-container">
      <div className="agency-header">
        <div>
          <h1>🏢 Agency Summary</h1>
          <p>View complaints/reports grouped by agency</p>
        </div>
        <div className="header-stats">
          <div className="stat-box">
            <div className="stat-number">{filteredAgencies.length}</div>
            <div className="stat-label">Agencies</div>
          </div>
          <div className="stat-box">
            <div className="stat-number">{records.length}</div>
            <div className="stat-label">Total Reports</div>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="agency-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search agencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="sort-controls">
          <button
            className={`sort-btn ${sortBy === 'count' ? 'active' : ''}`}
            onClick={() => handleSort('count')}
          >
            📊 By Count
          </button>
          <button
            className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => handleSort('name')}
          >
            📝 By Name
          </button>
        </div>
      </div>

      {filteredAgencies.length === 0 ? (
        <div className="no-agencies">
          No agencies found {searchTerm && `matching "${searchTerm}"`}
        </div>
      ) : (
        <div className="agencies-grid">
          {filteredAgencies.map((agency, idx) => {
            const statusBreakdown = getStatusBreakdown(agency.records);
            const statusLabels = Object.entries(statusBreakdown)
              .map(([status, count]) => `${count} ${status?.replace(/_/g, ' ')}`)
              .join(', ');

            return (
              <div key={idx} className="agency-card">
                <div className="card-header">
                  <div className="agency-info">
                    <h2>{agency.name}</h2>
                    <p className="contact">{agency.contact}</p>
                  </div>
                  <div 
                    className="report-count"
                    onClick={() => handleViewStats(agency)}
                    style={{ cursor: 'pointer' }}
                    title="Click to view status statistics"
                  >
                    {agency.count}
                  </div>
                </div>

                <div className="card-content">
                  <div className="report-label">
                    {agency.count === 1 ? 'Report' : 'Reports'}
                  </div>

                  {statusLabels && (
                    <div className="status-breakdown">
                      <small>{statusLabels}</small>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button
                    className="btn-view-records"
                    onClick={() => handleViewRecords(agency.name)}
                  >
                    View Records →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Statistics Modal */}
      {showModal && selectedAgency && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAgency.name} - Status Breakdown</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-body">
              <div className="chart-container">
                {(() => {
                  const statusBreakdown = getStatusBreakdown(selectedAgency.records);
                  const chartData = Object.entries(statusBreakdown).map(([status, count]) => ({
                    name: status?.replace(/_/g, ' ') || 'Unknown',
                    value: count
                  }));

                  const COLORS = [
                    '#0035aa', '#28a745', '#ffc107', '#fd7e14', 
                    '#dc3545', '#20c997', '#6c757d', '#ff6b6b'
                  ];

                  return (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} reports`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>

              <div className="statistics-summary">
                <h3>Summary</h3>
                <div className="summary-grid">
                  {(() => {
                    const breakdown = getStatusBreakdown(selectedAgency.records);
                    return Object.entries(breakdown).map(([status, count]) => (
                      <div key={status} className="summary-item">
                        <div className="status-name">{status?.replace(/_/g, ' ')}</div>
                        <div className="status-count">{count}</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-close-modal" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencySummary;
