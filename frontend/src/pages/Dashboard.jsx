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
  const [userStats, setUserStats] = useState([]);
  const [userDailyStats, setUserDailyStats] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState([]);

  const statuses = [
    { value: 'scheduled', label: 'SCHEDULED' },
    { value: 'drop_due_to_absences', label: 'DROP DUE TO ABSENCES' },
    { value: 'drop_due_to_lack_of_interest', label: 'DROP DUE TO LACK OF INTEREST' },
    { value: 'endorse_to_adjudicator', label: 'ENDORSE TO ADJUDICATOR' },
    { value: 'nlrc', label: 'NLRC' },
    { value: 'ongoing', label: 'ONGOING' },
    { value: 'settled', label: 'SETTLED' },
    { value: 'withdrawn', label: 'WITHDRAWN' }
  ];

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        // Fetch all records - admin users get all records, non-admins get only their own
        // Add limit to handle pagination and get all available records
        const response = await axios.get('http://localhost:8000/api/sena/records/?limit=99999', {
          withCredentials: true,
        });
        // Handle both paginated responses (results key) and direct array responses
        let records = response.data;
        if (response.data.results) {
          records = response.data.results;
        }
        setAllRecords(Array.isArray(records) ? records : []);
      } catch (err) {
        console.error('Error fetching records:', err);
        setAllRecords([]);
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
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7); // Next Sunday (exclusive)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      let todayCount = 0;
      let weekCount = 0;
      let monthCount = 0;
      let yearCount = 0;

      allRecords.forEach(record => {
        // Filter by status if selected (use clientStatus)
        if (statusFilter && record.clientStatus !== statusFilter) return;

        // Get appointments array
        const appointments = record.appointments || [];
        
        // If no appointments, skip (or we could count it differently)
        if (appointments.length === 0) return;

        // Check each appointment date
        appointments.forEach(appointment => {
          const recordDate = new Date(appointment.dateOfAppointment);
          const recordDateOnly = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());

          if (recordDateOnly.getTime() === today.getTime()) {
            todayCount++;
          }
          
          if (recordDate >= weekStart && recordDate < weekEnd) {
            weekCount++;
          }
          
          if (recordDate >= monthStart) {
            monthCount++;
          }
          
          if (recordDate >= yearStart) {
            yearCount++;
          }
        });
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

  useEffect(() => {
    const calculateUserStats = () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7); // Next Sunday (exclusive)

      // Group records by user for WEEKLY stats
      const weeklyUserMap = new Map();
      // Group records by user for DAILY stats
      const dailyUserMap = new Map();

      allRecords.forEach(record => {
        const userName = record.userFullName || 'Unknown';
        const appointments = record.appointments || [];

        if (appointments.length === 0) return;

        // Check which appointments are this week (>= weekStart AND < weekEnd)
        const weekAppointments = appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.dateOfAppointment);
          return appointmentDate >= weekStart && appointmentDate < weekEnd;
        });

        // Check which appointments are today
        const todayAppointments = appointments.filter(appointment => {
          const appointmentDate = new Date(appointment.dateOfAppointment);
          const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
          return appointmentDateOnly.getTime() === today.getTime();
        });

        // WEEKLY STATS
        if (weekAppointments.length > 0) {
          if (!weeklyUserMap.has(userName)) {
            weeklyUserMap.set(userName, {
              userName,
              totalAppointments: 0,
              statusBreakdown: {},
            });
          }

          const weeklyData = weeklyUserMap.get(userName);
          weeklyData.totalAppointments += weekAppointments.length;

          weekAppointments.forEach(appointment => {
            const status = record.clientStatus || 'unknown';
            if (!weeklyData.statusBreakdown[status]) {
              weeklyData.statusBreakdown[status] = 0;
            }
            weeklyData.statusBreakdown[status]++;
          });
        }

        // DAILY STATS
        if (todayAppointments.length > 0) {
          if (!dailyUserMap.has(userName)) {
            dailyUserMap.set(userName, {
              userName,
              totalAppointments: 0,
              statusBreakdown: {},
            });
          }

          const dailyData = dailyUserMap.get(userName);
          dailyData.totalAppointments += todayAppointments.length;

          todayAppointments.forEach(appointment => {
            const status = record.clientStatus || 'unknown';
            if (!dailyData.statusBreakdown[status]) {
              dailyData.statusBreakdown[status] = 0;
            }
            dailyData.statusBreakdown[status]++;
          });
        }
      });

      // Convert weekly stats map to array and calculate percentages
      const weeklyStatsArray = Array.from(weeklyUserMap.values())
        .map(userData => ({
          ...userData,
          statusBreakdownWithPercent: Object.entries(userData.statusBreakdown).map(([status, count]) => ({
            status,
            count,
            percent: Math.round((count / userData.totalAppointments) * 100),
          })),
        }))
        .sort((a, b) => b.totalAppointments - a.totalAppointments);

      // Convert daily stats map to array and calculate percentages
      const dailyStatsArray = Array.from(dailyUserMap.values())
        .map(userData => ({
          ...userData,
          statusBreakdownWithPercent: Object.entries(userData.statusBreakdown).map(([status, count]) => ({
            status,
            count,
            percent: Math.round((count / userData.totalAppointments) * 100),
          })),
        }))
        .sort((a, b) => b.totalAppointments - a.totalAppointments);

      setUserStats(weeklyStatsArray);
      setUserDailyStats(dailyStatsArray);
    };

    calculateUserStats();
  }, [allRecords]);

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

      <div className="user-statistics-section">
        <h2>User Statistics - This Week</h2>
        {loading ? (
          <p>Loading...</p>
        ) : userStats.length === 0 ? (
          <p>No appointments scheduled this week</p>
        ) : (
          <div className="user-stats-list">
            {userStats.map((userData) => (
              <div key={userData.userName} className="user-stat-card">
                <div className="user-stat-header">
                  <h3>{userData.userName}</h3>
                  <span className="total-appointments">{userData.totalAppointments} appointments this week</span>
                </div>
                <div className="status-breakdown">
                  {userData.statusBreakdownWithPercent.map((item) => {
                    const statusInfo = statuses.find(s => s.value === item.status);
                    return (
                      <div key={item.status} className="status-item">
                        <span className="status-name">{statusInfo?.label || item.status}</span>
                        <span className="status-count">{item.count} ({item.percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="user-statistics-section">
        <h2>User Statistics - Today</h2>
        {loading ? (
          <p>Loading...</p>
        ) : userDailyStats.length === 0 ? (
          <p>No appointments scheduled for today</p>
        ) : (
          <div className="user-stats-list">
            {userDailyStats.map((userData) => (
              <div key={userData.userName} className="user-stat-card">
                <div className="user-stat-header">
                  <h3>{userData.userName}</h3>
                  <span className="total-appointments">{userData.totalAppointments} appointments today</span>
                </div>
                <div className="status-breakdown">
                  {userData.statusBreakdownWithPercent.map((item) => {
                    const statusInfo = statuses.find(s => s.value === item.status);
                    return (
                      <div key={item.status} className="status-item">
                        <span className="status-name">{statusInfo?.label || item.status}</span>
                        <span className="status-count">{item.count} ({item.percent}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
