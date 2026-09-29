import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';
import Login from './pages/Login';
import VictimDashboard from './pages/VictimDashboard';
import CheckIn from './pages/CheckIn';
import CaseDashboard from './pages/CaseDashboard';
import CaseDetails from './pages/CaseDetails';
import Alerts from './pages/Alerts';
import Intervention from './pages/Intervention';
import Chat from './pages/Chat';
import GovernanceDashboard from './pages/GovernanceDashboard';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const App = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <ThemeProvider>
      <LanguageProvider>
        <Router>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={
                !isAuthenticated ? <Navigate to="/login" /> :
                user?.role === 'victim' ? <Navigate to="/dashboard" /> :
                <Navigate to="/cases" />
              } />
              
              {/* Victim Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRole="victim"><VictimDashboard /></ProtectedRoute>
              } />
              <Route path="/check-in" element={
                <ProtectedRoute allowedRole="victim"><CheckIn /></ProtectedRoute>
              } />

              {/* Counsellor Routes */}
              <Route path="/cases" element={
                <ProtectedRoute allowedRole="counsellor"><CaseDashboard /></ProtectedRoute>
              } />
              <Route path="/cases/:id" element={
                <ProtectedRoute allowedRole="counsellor"><CaseDetails /></ProtectedRoute>
              } />
              <Route path="/alerts" element={
                <ProtectedRoute allowedRole="counsellor"><Alerts /></ProtectedRoute>
              } />
              <Route path="/intervention" element={
                <ProtectedRoute allowedRole="counsellor"><Intervention /></ProtectedRoute>
              } />
              <Route path="/governance" element={
                <ProtectedRoute><GovernanceDashboard /></ProtectedRoute>
              } />

              {/* Shared / Universal Chat Route */}
              <Route path="/chat" element={<Chat />} />
            </Route>
          </Routes>
        </Router>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
