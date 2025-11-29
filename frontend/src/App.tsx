import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DiscussionDetail from './pages/DiscussionDetail';
import ModerationPanel from './pages/ModerationPanel';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    // Initialize theme
    setTheme(theme);
  }, [theme, setTheme]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<MainLayout />}>
          <Route index element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="discussion/:id" element={<PrivateRoute><DiscussionDetail /></PrivateRoute>} />
          <Route path="moderation" element={<PrivateRoute><ModerationPanel /></PrivateRoute>} />
          <Route path="admin/users" element={<PrivateRoute><UserManagement /></PrivateRoute>} />
          <Route path="settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
