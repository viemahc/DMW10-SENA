import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen = true, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleNames = () => {
    if (!user || !user.roles || user.roles.length === 0) {
      return 'User';
    }
    return user.roles.map(role => role.roleName).join(', ');
  };

  const isAdmin = user?.roles?.some(role => role.roleName === 'Administrator');

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2>SEnA Management</h2>
        {onToggle && (
          <button className="sidebar-toggle" onClick={onToggle} title={isOpen ? 'Close sidebar' : 'Open sidebar'}>
            {isOpen ? '✕' : '☰'}
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <a href="/dashboard" className={`nav-item ${isActive('/dashboard')}`} title="Dashboard">
          <span className="icon">🏠</span> <span>Dashboard</span>
        </a>
        <a href="/sena-records" className={`nav-item ${isActive('/sena-records')}`} title="SENA Calendar">
          <span className="icon">📅</span> <span>SENA Calendar</span>
        </a>
        <a href="/sena-records-list" className={`nav-item ${isActive('/sena-records-list')}`} title="SENA Records">
          <span className="icon">📋</span> <span>SENA Records</span>
        </a>
        <a href="/agency-summary" className={`nav-item ${isActive('/agency-summary')}`} title="Agency Records">
          <span className="icon">🏢</span> <span>Agency Records</span>
        </a>
        <a href="/profile" className={`nav-item ${isActive('/profile')}`} title="Profile">
          <span className="icon">👤</span> <span>Profile</span>
        </a>
        {isAdmin && (
          <a href="/admin/users" className={`nav-item admin-item ${isActive('/admin/users')}`} title="User Management">
            <span className="icon">👥</span> <span>User Management</span>
          </a>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{getInitials()}</div>
          <div className="user-details">
            <p className="user-name">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="user-email">{user?.emailAddress}</p>
            <p className="user-role">{getRoleNames()}</p>
          </div>
        </div>

        <button onClick={handleLogout} className="logout-button" title="Logout">
          <span className="icon">🚪</span> <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
