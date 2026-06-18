import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './SenaRecordFormModal.css';

const SenaRecordFormModal = ({ onClose, onSuccess, recordId }) => {
  const { user } = useAuth();
  const isEditing = !!recordId;
  
  const [formData, setFormData] = useState({
    user: '',
    senaTitle: '',
    clientFirstName: '',
    clientMiddleName: '',
    clientLastName: '',
    clientSuffix: '',
    clientAge: '',
    clientContactNumber: '',
    clientEmail: '',
    dateOfAppointment: '',
    start_time: '',
    end_time: '',
    senaStatus: 'scheduled',
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch users list
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

  // Set default user or fetch existing record for edit
  useEffect(() => {
    if (isEditing) {
      // Fetch existing record for editing
      const fetchRecord = async () => {
        try {
          const response = await axios.get(
            `http://localhost:8000/api/sena/records/${recordId}/`,
            { withCredentials: true }
          );
          const record = response.data;
          
          // Format date from ISO format to YYYY-MM-DD
          const dateOnly = record.dateOfAppointment.split('T')[0];
          
          setFormData({
            user: record.user,
            senaTitle: record.senaTitle,
            clientFirstName: record.clientFirstName,
            clientMiddleName: record.clientMiddleName || '',
            clientLastName: record.clientLastName,
            clientSuffix: record.clientSuffix || '',
            clientAge: record.clientAge,
            clientContactNumber: record.clientContactNumber,
            clientEmail: record.clientEmail,
            dateOfAppointment: dateOnly,
            start_time: record.start_time || '',
            end_time: record.end_time || '',
            senaStatus: record.senaStatus,
          });
        } catch (err) {
          console.error('Error fetching record:', err);
          setError('Failed to load record');
        }
      };
      fetchRecord();
    } else if (user) {
      // Set default user for new record
      setFormData((prev) => ({
        ...prev,
        user: user.user_id,
      }));
    }
  }, [recordId, user, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const checkTimeConflict = async () => {
    if (!formData.start_time || !formData.end_time || !formData.dateOfAppointment) {
      return true;
    }

    try {
      const userId = formData.user ? parseInt(formData.user, 10) : null;
      if (!userId) return true;

      const response = await axios.get(
        `http://localhost:8000/api/sena/records/?user_id=${userId}`,
        { withCredentials: true }
      );

      const records = response.data.results || response.data || [];
      const appointmentDate = formData.dateOfAppointment;
      
      const sameDay = records.filter((record) => {
        const recordDate = record.dateOfAppointment.split('T')[0];
        return recordDate === appointmentDate && record.senaStatus === 'scheduled';
      });

      const timeToMinutes = (timeStr) => {
        if (!timeStr) return null;
        const parts = timeStr.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      };

      const newEndMinutes = timeToMinutes(formData.end_time);
      const newStartMinutes = timeToMinutes(formData.start_time);

      for (const record of sameDay) {
        if (isEditing && record.sena_id === recordId) {
          continue;
        }

        const existingStart = record.start_time;
        const existingEnd = record.end_time;

        if (existingStart && existingEnd) {
          const existingStartMinutes = timeToMinutes(existingStart);
          const existingEndMinutes = timeToMinutes(existingEnd);

          if (!(newEndMinutes <= existingStartMinutes || newStartMinutes >= existingEndMinutes)) {
            setError(
              `Time slot conflict: A scheduled appointment already exists for this user on ${appointmentDate} ` +
              `from ${existingStart} to ${existingEnd}. Please select a different time slot.`
            );
            return false;
          }
        }
      }

      return true;
    } catch (err) {
      console.error('Error checking time conflict:', err);
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const noConflict = await checkTimeConflict();
      if (!noConflict) {
        setLoading(false);
        return;
      }

      const payload = {
        user: formData.user ? parseInt(formData.user, 10) : null,
        senaTitle: formData.senaTitle,
        clientFirstName: formData.clientFirstName,
        clientMiddleName: formData.clientMiddleName,
        clientLastName: formData.clientLastName,
        clientSuffix: formData.clientSuffix,
        clientAge: parseInt(formData.clientAge, 10),
        clientContactNumber: formData.clientContactNumber,
        clientEmail: formData.clientEmail,
        dateOfAppointment: `${formData.dateOfAppointment}T00:00:00.000Z`,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        senaStatus: formData.senaStatus,
      };

      if (isEditing) {
        await axios.put(
          `http://localhost:8000/api/sena/records/${recordId}/`,
          payload,
          { withCredentials: true }
        );
      } else {
        await axios.post('http://localhost:8000/api/sena/records/', payload, {
          withCredentials: true,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving record:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to save record';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{isEditing ? 'Edit SENA Record' : 'New SENA Record'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="sena-form-modal">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-section">
            <h3>Program Information</h3>
            <div className="form-group">
              <label htmlFor="senaTitle">Program Title *</label>
              <input
                type="text"
                id="senaTitle"
                name="senaTitle"
                value={formData.senaTitle}
                onChange={handleChange}
                required
                placeholder="Enter program title"
              />
            </div>

            <div className="form-row">
              {isEditing && (
                <div className="form-group">
                  <label htmlFor="senaStatus">Status *</label>
                  <select
                    id="senaStatus"
                    name="senaStatus"
                    value={formData.senaStatus}
                    onChange={handleChange}
                    required
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="dismissed">Dismissed</option>
                    <option value="lack_of_interest">Lack of Interest</option>
                    <option value="nlrc">NLRC</option>
                    <option value="ongoing">On Going</option>
                    <option value="settled">Settled</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="user">Assigned To *</label>
                <select
                  id="user"
                  name="user"
                  value={formData.user}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a user...</option>
                  {users.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.firstName} {u.lastName} {u.user_id === user?.user_id ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Client Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="clientFirstName">First Name *</label>
                <input
                  type="text"
                  id="clientFirstName"
                  name="clientFirstName"
                  value={formData.clientFirstName}
                  onChange={handleChange}
                  required
                  placeholder="First name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="clientMiddleName">Middle Name</label>
                <input
                  type="text"
                  id="clientMiddleName"
                  name="clientMiddleName"
                  value={formData.clientMiddleName}
                  onChange={handleChange}
                  placeholder="Middle name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="clientLastName">Last Name *</label>
                <input
                  type="text"
                  id="clientLastName"
                  name="clientLastName"
                  value={formData.clientLastName}
                  onChange={handleChange}
                  required
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="clientAge">Age *</label>
                <input
                  type="number"
                  id="clientAge"
                  name="clientAge"
                  value={formData.clientAge}
                  onChange={handleChange}
                  required
                  min="1"
                  max="120"
                />
              </div>

              <div className="form-group">
                <label htmlFor="clientContactNumber">Contact Number *</label>
                <input
                  type="text"
                  id="clientContactNumber"
                  name="clientContactNumber"
                  value={formData.clientContactNumber}
                  onChange={handleChange}
                  required
                  placeholder="+63-9123456789"
                />
              </div>

              <div className="form-group">
                <label htmlFor="clientEmail">Email *</label>
                <input
                  type="email"
                  id="clientEmail"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleChange}
                  required
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Appointment Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateOfAppointment">Date of Appointment *</label>
                <input
                  type="date"
                  id="dateOfAppointment"
                  name="dateOfAppointment"
                  value={formData.dateOfAppointment}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="start_time">Start Time</label>
                <input
                  type="time"
                  id="start_time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_time">End Time</label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Record' : 'Create Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SenaRecordFormModal;