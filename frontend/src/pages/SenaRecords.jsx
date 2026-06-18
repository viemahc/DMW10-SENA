import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import SenaRecordFormModal from '../components/SenaRecordFormModal';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './SenaRecords.css';

const localizer = momentLocalizer(moment);

const SenaRecords = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:8000/auth/admin/users/', {
          withCredentials: true,
        });
        const usersList = response.data.users || response.data.results || response.data || [];
        setUsers(Array.isArray(usersList) ? usersList : []);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (user && selectedUserId === null) {
      setSelectedUserId(user.user_id);
    }
  }, [user, selectedUserId]);

  useEffect(() => {
    if (selectedUserId !== null) {
      fetchRecords();
    }
  }, [selectedUserId, statusFilter]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:8000/api/sena/records/';
      const params = new URLSearchParams();
      
      if (selectedUserId) {
        params.append('user_id', selectedUserId);
      }
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        withCredentials: true,
      });

      const data = response.data;
      setRecords(Array.isArray(data) ? data : data.results || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching records:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (senaId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/sena/records/${senaId}/`, {
        withCredentials: true,
      });

      setRecords(records.filter(record => record.sena_id !== senaId));
    } catch (err) {
      console.error('Error deleting record:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to delete record');
    }
  };

  const handleEdit = (senaId) => {
    navigate(`/sena-records/edit/${senaId}`);
  };

  const handleEventClick = (record) => {
    // Open edit modal for the clicked event
    setEditingRecordId(record.sena_id);
    setIsModalOpen(true);
  };

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value);
    setSelectedMonth(newMonth);
    setCurrentDate(new Date(selectedYear, newMonth - 1, 1));
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);
    setSelectedYear(newYear);
    setCurrentDate(new Date(newYear, selectedMonth - 1, 1));
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'scheduled': '#5e5e5e',
      'dismissed': '#FF0000',
      'lack_of_interest': '#000000',
      'nlrc': '#800080',
      'ongoing': '#ab9f1c',
      'settled': '#008000',
      'withdrawn': '#0000FF',
    };
    return colorMap[status] || '#6c757d';
  };

  const statusLegend = [
    { status: 'scheduled', label: 'Scheduled', color: '#5e5e5e' },
    { status: 'dismissed', label: 'Dismissed', color: '#FF0000' },
    { status: 'lack_of_interest', label: 'Lack of Interest', color: '#000000' },
    { status: 'nlrc', label: 'NLRC', color: '#800080' },
    { status: 'ongoing', label: 'On Going', color: '#ab9f1c' },
    { status: 'settled', label: 'Settled', color: '#008000' },
    { status: 'withdrawn', label: 'Withdrawn', color: '#0000FF' },
  ];

  const calendarEvents = records.map(record => {
    const dateOnly = record.dateOfAppointment.split('T')[0];
    return {
      ...record,
      id: record.sena_id,
      title: `${record.senaTitle} - ${record.userFullName}`,
      start: new Date(`${dateOnly}T${record.start_time || '00:00:00'}`),
      end: new Date(`${dateOnly}T${record.end_time || '23:59:59'}`),
      resource: record,
    };
  });

  const eventStyleGetter = (event) => {
    const backgroundColor = getStatusColor(event.senaStatus);
    const lightBackgrounds = ['#FFD700', '#808080'];
    const textColor = lightBackgrounds.includes(backgroundColor) ? '#000000' : '#FFFFFF';
    
    const style = {
      backgroundColor: backgroundColor,
      borderRadius: '4px',
      opacity: 0.9,
      color: textColor,
      border: '0px',
      display: 'block',
      fontWeight: 'bold',
    };
    return { style };
  };

  if (loading) {
    return <div className="sena-records container"><p>Loading records...</p></div>;
  }

  return (
    <div className="sena-records-calendar container">
      <div className="sena-header">
        <h1>SEnA Appointment Calendar</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingRecordId(null);
            setIsModalOpen(true);
          }}
        >
          + New Record
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-section">
        <label htmlFor="user-filter">Select User:</label>
        <select 
          id="user-filter"
          value={selectedUserId || ''} 
          onChange={(e) => setSelectedUserId(parseInt(e.target.value))}
        >
          {users.map((u) => (
            <option key={u.user_id} value={u.user_id}>
              {u.firstName} {u.lastName} {u.user_id === user?.user_id ? '(You)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="date-navigation">
        <label htmlFor="month-select">Month:</label>
        <select 
          id="month-select"
          value={selectedMonth}
          onChange={handleMonthChange}
        >
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>

        <label htmlFor="year-select">Year:</label>
        <select 
          id="year-select"
          value={selectedYear}
          onChange={handleYearChange}
        >
          {Array.from({ length: 20 }, (_, i) => {
            const year = new Date().getFullYear() - 10 + i;
            return (
              <option key={year} value={year}>
                {year}
              </option>
            );
          })}
        </select>
      </div>

      <div className="legend-section">
        <h3>Status Legend</h3>
        <div className="legend-grid">
          {statusLegend.map((item) => (
            <div key={item.status} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="legend-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="calendar-wrapper">
        <Calendar
          key={`${selectedYear}-${selectedMonth}`}
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          onSelectEvent={handleEventClick}
          eventPropGetter={eventStyleGetter}
          popup
          selectable
          toolbar={false}
          defaultDate={currentDate}
        />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecordId(null);
        }}
        title={editingRecordId ? 'Edit SENA Record' : 'Create New SENA Record'}
      >
        <SenaRecordFormModal 
          recordId={editingRecordId}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRecordId(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            setEditingRecordId(null);
            fetchRecords();
          }}
        />
      </Modal>
    </div>
  );
};

export default SenaRecords;
