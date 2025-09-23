import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import StudentDashboard from './components/Student/StudentDashboard.jsx';
import CoordinatorDashboard from './components/Coordinator/CoordinatorDashboard.jsx';
import HoDDashboard from './components/HoD/HoDDashboard.jsx';
import AdminDashboard from './components/Admin/AdminDashboard.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

function AppContent() {
  const { user, logout } = useAuth();

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  const getDashboard = () => {
    switch (user?.role) {
      case 'student':
        return <StudentDashboard />;
      case 'coordinator':
        return <CoordinatorDashboard />;
      case 'hod':
        return <HoDDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <Navigate to="/login" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login />} 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              {getDashboard()}
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;