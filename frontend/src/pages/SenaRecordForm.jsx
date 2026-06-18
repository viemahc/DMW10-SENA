import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './SenaRecordForm.css';

const SenaRecordForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

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
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchUsers();
    if (isEditMode) {
      fetchRecord();
    }
  }, [id]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/auth/admin/users/', {
        withCredentials: true,
      });
      const usersList = response.data.users || response.data.results || response.data || [];
      setUsers(Array.isArray(usersList) ? usersList : []);
      
      // Set default user to current user if not already set
      if (!isEditMode && user) {
        setFormData((prev) => ({
          ...prev,
          user: user.user_id,
        }));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchRecord = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/sena/records/${id}/`, {
        withCredentials: true,
      });

      const data = response.data;
      setFormData({
        user: data.user || '',
        senaTitle: data.senaTitle,
        clientFirstName: data.clientFirstName,
        clientMiddleName: data.clientMiddleName || '',
        clientLastName: data.clientLastName,
        clientSuffix: data.clientSuffix || '',
        clientAge: data.clientAge,
        clientContactNumber: data.clientContactNumber,
        clientEmail: data.clientEmail,
        dateOfAppointment: formatDateTimeForInput(data.dateOfAppointment),
        start_time: data.start_time || '',
        end_time: data.end_time || '',
        senaStatus: data.senaStatus,
      });
    } catch (err) {
      console.error('Error fetching record:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch record';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeForInput = (datetimeString) => {
    if (!datetimeString) return '';
    // Convert ISO format to date format (YYYY-MM-DD)
    const date = new Date(datetimeString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateTimeForSubmit = (dateString) => {
    if (!dateString) return '';
    // Convert date format (YYYY-MM-DD) to ISO datetime with midnight time
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day, 0, 0, 0);
      return date.toISOString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const url = isEditMode
        ? `http://localhost:8000/api/sena/records/${id}/`
        : 'http://localhost:8000/api/sena/records/';

      const method = isEditMode ? 'put' : 'post';

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
        dateOfAppointment: formatDateTimeForSubmit(formData.dateOfAppointment),
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        senaStatus: formData.senaStatus,
      };

      console.log('Submitting payload:', payload);

      await axios({
        method,
        url,
        data: payload,
        withCredentials: true,
      });

      setSuccess(isEditMode ? 'Record updated successfully!' : 'Record created successfully!');
      setTimeout(() => {
        navigate('/sena-records');
      }, 1500);
    } catch (err) {
      console.error('Error saving record:', err);
      let errorMessage = 'Failed to save record';
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (typeof err.response.data === 'object') {
          // Check for field-specific errors
          const fieldErrors = Object.entries(err.response.data)
            .map(([field, msgs]) => {
              const messages = Array.isArray(msgs) ? msgs.join(', ') : msgs;
              return `${field}: ${messages}`;
            })
            .join('; ');
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  if (loading) {
    return <div className="sena-form container"><p>Loading...</p></div>;
  }

  return (
    <div className="sena-form container">
      <div className="form-header">
        <h1>{isEditMode ? 'Edit SENA Record' : 'Create New SENA Record'}</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="record-form">
        <div className="form-section">
          <h2>Program Information</h2>
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
          <h2>Client Information</h2>
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
            <div className="form-group">
              <label htmlFor="clientSuffix">Suffix</label>
              <input
                type="text"
                id="clientSuffix"
                name="clientSuffix"
                value={formData.clientSuffix}
                onChange={handleChange}
                placeholder="Jr., Sr., III, etc."
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
                placeholder="Age"
              />
            </div>
            <div className="form-group">
              <label htmlFor="clientContactNumber">Contact Number *</label>
              <input
                type="tel"
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
          <h2>Appointment Details</h2>
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
          <div className="form-row">
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
          <button type="submit" className="btn btn-primary">
            {isEditMode ? 'Update Record' : 'Create Record'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/sena-records')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SenaRecordForm;
