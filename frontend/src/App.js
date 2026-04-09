import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from './components/ui/sonner';
import './App.css';
import Simulator from './pages/Simulator';
import Reports from './pages/Reports';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import UserDashboard from './pages/UserDashboard';
import Customers from './pages/Customers';
import Loans from './pages/Loans';
import LoanDetails from './pages/LoanDetails';
import Installments from './pages/Installments';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const NOTIFICATION_POPUP_SESSION_KEY = 'credicontrol_notifications_popup_shown';

axios.defaults.withCredentials = true;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const formatApiErrorDetail = (detail) => {
  if (detail == null) return 'Algo deu errado. Tente novamente.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(' ');
  if (detail && typeof detail.msg === 'string') return detail.msg;
  return String(detail);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const resetNotificationPopupSession = () => {
    sessionStorage.removeItem(NOTIFICATION_POPUP_SESSION_KEY);
  };

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      setUser(false);
      resetNotificationPopupSession();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    resetNotificationPopupSession();
    const response = await axios.post(`${API}/auth/login`, { email, password });
    setUser(response.data);
    return response.data;
  };

  const register = async (name, email, password) => {
    resetNotificationPopupSession();
    const response = await axios.post(`${API}/auth/register`, { name, email, password });
    setUser(response.data);
    return response.data;
  };

  const logout = async () => {
    await axios.post(`${API}/auth/logout`);
    setUser(false);
    resetNotificationPopupSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

const AuthLoadingScreen = () => (
  <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500" />
  </div>
);

const ProtectedUserRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'user') {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoadingScreen />;

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/home'} replace />;
  }

  return children;
};

function App() {
  return (
    <div className="App min-h-screen bg-neutral-950">
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              <Route
                path="/home"
                element={
                  <ProtectedUserRoute>
                    <Home />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedUserRoute>
                    <UserDashboard />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedUserRoute>
                    <Customers />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/loans"
                element={
                  <ProtectedUserRoute>
                    <Loans />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/simulator"
                element={
                  <ProtectedUserRoute>
                    <Simulator />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedUserRoute>
                    <Reports />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/loans/:id"
                element={
                  <ProtectedUserRoute>
                    <LoanDetails />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/installments"
                element={
                  <ProtectedUserRoute>
                    <Installments />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedUserRoute>
                    <Notifications />
                  </ProtectedUserRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedUserRoute>
                    <Settings />
                  </ProtectedUserRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedAdminRoute>
                    <AdminUsers />
                  </ProtectedAdminRoute>
                }
              />

              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>

            <Toaster position="top-right" richColors />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
export { API };