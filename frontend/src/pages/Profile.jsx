import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    password: '',
    password_confirm: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        suffix: user.suffix || '',
        password: '',
        password_confirm: '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate passwords if provided
    if ((formData.password || formData.password_confirm) && formData.password !== formData.password_confirm) {
      setMessageType('error');
      setMessage('Passwords do not match');
      setLoading(false);
      return;
    }

    // Build request body - only include password if provided
    const requestData = {
      firstName: formData.firstName,
      middleName: formData.middleName,
      lastName: formData.lastName,
      suffix: formData.suffix,
    };

    if (formData.password) {
      requestData.password = formData.password;
      requestData.password_confirm = formData.password_confirm;
    }

    try {
      const response = await axios.put(
        'http://localhost:8000/auth/profile/update/',
        requestData,
        {
          withCredentials: true
        }
      );

      if (response.status === 200) {
        setMessageType('success');
        setMessage('Profile updated successfully!');
        // Refresh user data after a short delay
        setTimeout(async () => {
          try {
            await refreshUser();
            navigate('/dashboard');
          } catch (err) {
            console.error('Error refreshing user:', err);
            window.location.reload();
          }
        }, 1500);
      }
    } catch (error) {
      setMessageType('error');
      const errorData = error.response?.data;
      console.error('API Error:', errorData);
      
      // Show detailed error message
      if (errorData?.errors) {
        const errorMessages = Object.entries(errorData.errors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(' | ');
        setMessage(errorMessages || 'Failed to update profile');
      } else {
        setMessage(errorData?.message || 'Failed to update profile');
      }
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Edit Profile</h1>
        <p>Update your personal information</p>
      </div>

        <div className="profile-form-box">
          {message && (
            <div className={`message ${messageType}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-section-title">Personal Information</div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="middleName">Middle Name</label>
                <input
                  type="text"
                  id="middleName"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="Enter middle name (optional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="suffix">Suffix</label>
                <input
                  type="text"
                  id="suffix"
                  name="suffix"
                  value={formData.suffix}
                  onChange={handleChange}
                  placeholder="e.g., Jr., Sr. (optional)"
                />
              </div>
            </div>

            <div className="profile-info">
              <div className="info-item">
                <label>Email Address</label>
                <p className="info-value">{user?.emailAddress}</p>
                <small>Email cannot be changed</small>
              </div>
            </div>

            <div className="form-section-title">Change Password</div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password_confirm">Confirm Password</label>
                <input
                  type="password"
                  id="password_confirm"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current password"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="save-button">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => navigate('/dashboard')} className="cancel-button">
                Cancel
              </button>
            </div>
          </form>
        </div>
    </div>
  );
};

export default Profile;
