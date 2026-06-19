import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Register from './pages/Register'
import AddUser from './pages/AddUser'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import UserManagement from './pages/UserManagement'
import SenaRecords from './pages/SenaRecords'
import SenaRecordsList from './pages/SenaRecordsList'
import SenaRecordDetail from './pages/SenaRecordDetail'
import AgencySummary from './pages/AgencySummary'
import SenaRecordForm from './pages/SenaRecordForm'
import './App.css'

// Admin-only route component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  const isAdmin = user?.roles?.some(role => role.roleName === 'Administrator');

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  
  // Don't show sidebar on login and register pages
  const showSidebar = !['/login', '/register'].includes(location.pathname);

  return (
    <div className={`app-layout ${!showSidebar ? 'no-sidebar' : ''}`} style={{ '--sidebar-open': sidebarOpen ? '1' : '0' }}>
      {showSidebar && <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={
        <ProtectedRoute>
          <AdminRoute>
            <Register />
          </AdminRoute>
        </ProtectedRoute>
      } />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/add"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AddUser />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/sena-records"
        element={
          <ProtectedRoute>
            <SenaRecords />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sena-records-list"
        element={
          <ProtectedRoute>
            <SenaRecordsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sena-records-detail/:id"
        element={
          <ProtectedRoute>
            <SenaRecordDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agency-summary"
        element={
          <ProtectedRoute>
            <AgencySummary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sena-records/new"
        element={
          <ProtectedRoute>
            <SenaRecordForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sena-records/edit/:id"
        element={
          <ProtectedRoute>
            <SenaRecordForm />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
