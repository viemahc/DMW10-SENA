import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    year: 0,
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState([]);

  const statuses = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'dismissed', label: 'Dismissed' },
    { value: 'lack_of_interest', label: 'Lack of Interest' },
    { value: 'nlrc', label: 'NLRC' },
    { value: 'ongoing', label: 'On Going' },
    { value: 'settled', label: 'Settled' },
    { value: 'withdrawn', label: 'Withdrawn' }
  ];

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8000/api/sena/records/', {
          withCredentials: true,
        });
        setAllRecords(response.data || []);
      } catch (err) {
        console.error('Error fetching records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  useEffect(() => {
    const calculateStats = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      let todayCount = 0;
      let weekCount = 0;
      let monthCount = 0;
      let yearCount = 0;

      allRecords.forEach(record => {
        // Filter by status if selected
        if (statusFilter && record.senaStatus !== statusFilter) return;

        const recordDate = new Date(record.dateOfAppointment);
        const recordDateOnly = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());

        if (recordDateOnly.getTime() === today.getTime()) {
          todayCount++;
        }
        
        if (recordDate >= weekStart) {
          weekCount++;
        }
        
        if (recordDate >= monthStart) {
          monthCount++;
        }
        
        if (recordDate >= yearStart) {
          yearCount++;
        }
      });

      setStats({
        today: todayCount,
        week: weekCount,
        month: monthCount,
        year: yearCount,
      });
    };

    calculateStats();
  }, [statusFilter, allRecords]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome to Dashboard</h1>
        <p>You are successfully logged in</p>
      </div>

      <div className="filter-section">
        <label htmlFor="status-filter">Filter by Status:</label>
        <select 
          id="status-filter" 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {statuses.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>
      
      <div className="dashboard-cards">
        <div className="card stats-card">
          <h2>Today</h2>
          <div className="stat-number">{loading ? '-' : stats.today}</div>
          <p>Records</p>
        </div>
        <div className="card stats-card">
          <h2>This Week</h2>
          <div className="stat-number">{loading ? '-' : stats.week}</div>
          <p>Records</p>
        </div>
        <div className="card stats-card">
          <h2>This Month</h2>
          <div className="stat-number">{loading ? '-' : stats.month}</div>
          <p>Records</p>
        </div>
        <div className="card stats-card">
          <h2>This Year</h2>
          <div className="stat-number">{loading ? '-' : stats.year}</div>
          <p>Records</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
