import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Chat from './pages/Chat.tsx';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Verify from './pages/Verify';
import VerifyLogin from './pages/VerifyLogin';
import PaymentSuccess from './pages/PaymentSuccess';
import Premium from './pages/Premium';
import './index.css';

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('token');
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const emailVerified = localStorage.getItem('emailVerified');
  const location = useLocation();

  if (!token || !isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check if email is verified
  if (emailVerified !== 'true') {
    return <Navigate to="/login" state={{ from: location, needsVerification: true }} replace />;
  }

  return (
    <div className="page-transition">
      {children}
    </div>
  );
}

function Logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return <Navigate to="/login" replace />;
}

function App() {
  useEffect(() => {
    const onUnload = () => {};
    window.addEventListener('unload', onUnload);
    return () => {
      window.removeEventListener('unload', onUnload);
    };
  }, []);

  useEffect(() => {
    (window as any).__APP_VERSION__ = 'chat-ui-2026-03-18-1937';
  }, []);

  return (
    <div className="app-container" data-app-version="chat-ui-2026-03-18-1937">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/login" element={
          <div className="page-transition">
            <Login />
          </div>
        } />
        <Route path="/logout" element={<Logout />} />
        <Route path="/premium" element={<RequireAuth><Premium /></RequireAuth>} />
        <Route path="/payment-success" element={
          <div className="page-transition">
            <PaymentSuccess />
          </div>
        } />
        <Route path="/verify" element={
          <div className="page-transition">
            <Verify />
          </div>
        } />
        <Route path="/verify-login" element={
          <div className="page-transition">
            <VerifyLogin />
          </div>
        } />
      </Routes>
    </div>
  );
}

export default App;
