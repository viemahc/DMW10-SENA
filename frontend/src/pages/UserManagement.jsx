import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './UserManagement.css';

const UserManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (user && user.roles && !user.roles.some(r => r.roleName === 'Administrator')) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Fetch users and roles
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/auth/admin/users/', {
        withCredentials: true
      });
      if (response.data.status === 'success') {
        setUsers(response.data.users);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load users: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get('http://localhost:8000/auth/admin/roles/', {
        withCredentials: true
      });
      if (response.data.status === 'success') {
        setAvailableRoles(response.data.roles);
      }
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const handleSelectUser = (selectedUser) => {
    setSelectedUser(selectedUser);
    setSuccessMessage('');
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      const response = await axios.post(
        `http://localhost:8000/auth/admin/users/${selectedUser.user_id}/assign-role/`,
        { role_id: selectedRole },
        { withCredentials: true }
      );

      if (response.data.status === 'success') {
        setSelectedUser(response.data.user);
        setUsers(users.map(u => u.user_id === selectedUser.user_id ? response.data.user : u));
        setShowRoleModal(false);
        setSelectedRole(null);
        setSuccessMessage('Role assigned successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      alert('Failed to assign role: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRemoveRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to remove this role?')) return;

    try {
      const response = await axios.delete(
        `http://localhost:8000/auth/admin/users/${selectedUser.user_id}/remove-role/${roleId}/`,
        { withCredentials: true }
      );

      if (response.data.status === 'success') {
        setSelectedUser(response.data.user);
        setUsers(users.map(u => u.user_id === selectedUser.user_id ? response.data.user : u));
        setSuccessMessage('Role removed successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      alert('Failed to remove role: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await axios.delete(
        `http://localhost:8000/auth/admin/users/${selectedUser.user_id}/delete/`,
        { withCredentials: true }
      );

      if (response.data.status === 'success') {
        setUsers(users.filter(u => u.user_id !== selectedUser.user_id));
        setSelectedUser(null);
        setShowDeleteModal(false);
        setSuccessMessage('User deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      alert('Failed to delete user: ' + (err.response?.data?.message || err.message));
      setShowDeleteModal(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.emailAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const assignedRoleIds = selectedUser?.roles?.map(r => r.role_id) || [];
  const unassignedRoles = availableRoles.filter(r => !assignedRoleIds.includes(r.role_id));

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <div>
          <h1>👥 User Management</h1>
          <p>Manage users and assign roles</p>
        </div>
        <button 
          className="btn-add-user"
          onClick={() => navigate('/admin/users/add')}
        >
          + Add User
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="user-management-layout">
          <div className="users-list-section">
            <div className="list-header">
              <h3>Users ({filteredUsers.length})</h3>
            </div>
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="users-list">
              {filteredUsers.length === 0 ? (
                <div className="no-users">No users found</div>
              ) : (
                filteredUsers.map(u => (
                  <div
                    key={u.user_id}
                    className={`user-item ${selectedUser?.user_id === u.user_id ? 'selected' : ''}`}
                    onClick={() => handleSelectUser(u)}
                  >
                    <div className="user-avatar">
                      {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                    </div>
                    <div className="user-info">
                      <div className="user-name">{u.full_name}</div>
                      <div className="user-email">{u.emailAddress}</div>
                      <div className="user-roles">
                        {u.roles.length > 0 ? (
                          u.roles.map(r => (
                            <span key={r.role_id} className="role-badge">{r.roleName}</span>
                          ))
                        ) : (
                          <span className="role-badge role-badge-none">No roles</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {selectedUser && (
            <div className="user-detail-section">
              <div className="detail-header">
                <div className="header-content">
                  <div className="detail-avatar">
                    {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                  </div>
                  <div className="detail-info">
                    <h2>{selectedUser.full_name}</h2>
                    <p>{selectedUser.emailAddress}</p>
                  </div>
                </div>
              </div>

              <div className="detail-body">
                <div className="detail-section">
                  <h3>Personal Information</h3>
                  <div className="detail-row">
                    <span className="label">First Name:</span>
                    <span className="value">{selectedUser.firstName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Middle Name:</span>
                    <span className="value">{selectedUser.middleName || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Last Name:</span>
                    <span className="value">{selectedUser.lastName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Suffix:</span>
                    <span className="value">{selectedUser.suffix || '-'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Member Since:</span>
                    <span className="value">{new Date(selectedUser.dateCreated).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="roles-header">
                    <h3>Assigned Roles</h3>
                    {unassignedRoles.length > 0 && (
                      <button
                        className="btn-add-role"
                        onClick={() => setShowRoleModal(true)}
                      >
                        + Add Role
                      </button>
                    )}
                  </div>

                  {selectedUser.roles.length === 0 ? (
                    <div className="no-roles">No roles assigned</div>
                  ) : (
                    <div className="roles-list">
                      {selectedUser.roles.map(role => (
                        <div key={role.role_id} className="role-item">
                          <span className="role-name">{role.roleName}</span>
                          <button
                            className="btn-remove-role"
                            onClick={() => handleRemoveRole(role.role_id)}
                            title="Remove role"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="detail-actions">
                  <button
                    className="btn-delete-user"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    🗑️ Delete User
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {showRoleModal && unassignedRoles.length > 0 && (
        <div className="modal-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Role to {selectedUser.firstName} {selectedUser.lastName}</h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedRole(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="role-selection">
                {unassignedRoles.map(role => (
                  <label key={role.role_id} className="role-option">
                    <input
                      type="radio"
                      name="role"
                      value={role.role_id}
                      checked={selectedRole === role.role_id}
                      onChange={(e) => setSelectedRole(Number(e.target.value))}
                    />
                    <div className="role-info">
                      <span className="role-name">{role.roleName}</span>
                      <span className="role-description">{role.roleDescription}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedRole(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleAssignRole}
                disabled={!selectedRole}
              >
                Assign Role
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal modal-danger" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete User</h3>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="delete-confirmation">
                <div className="warning-icon">⚠️</div>
                <p>Are you sure you want to delete <strong>{selectedUser.full_name}</strong>?</p>
                <p className="warning-text">This action cannot be undone. All associated data will be permanently deleted.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteUser}
              >
                Yes, Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
