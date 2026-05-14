import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import AuthCallback from './pages/AuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { WhatsAppButton } from './components/WhatsAppButton';

// Lazy Load Pages
const Pawn = lazy(() => import('./pages/Pawn'));
const Admin = lazy(() => import('./pages/Admin'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>
);

function AppContent() {
  const location = useLocation();
  const showNavbar = !['/login', '/auth/callback'].includes(location.pathname) && !location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && <Navbar />}
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* Redirect /jewelry to home page since it's now combined */}
          <Route path="/jewelry" element={<Navigate to="/" replace />} />
          <Route path="/pawn" element={<Pawn />} />
          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </Suspense>
      <WhatsAppButton />
    </div>
  );
}

import { CartProvider } from './context/CartContext';
import { RateProvider } from './context/RateContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <RateProvider>
        <WishlistProvider>
          <CartProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <AppContent />
            </Router>
          </CartProvider>
        </WishlistProvider>
      </RateProvider>
    </AuthProvider>
  );
}

export default App;
