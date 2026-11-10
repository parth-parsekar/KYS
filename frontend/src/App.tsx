import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileDrawer } from './components/MobileDrawer';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Subscriptions } from './pages/Subscriptions';
import { SubscriptionDetails } from './pages/SubscriptionDetails';
import { AddSubscription } from './pages/AddSubscription';
import { Analytics } from './pages/Analytics';
import { Notifications } from './pages/Notifications';
import { PreferencesBudget } from './pages/PreferencesBudget';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { EmptyStates } from './pages/EmptyStates';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-xs text-[#6B7280]">Loading KYS workspace...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block w-64 shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 pb-16">{children}</main>
      </div>

      {/* Mobile Drawer (matching Screen 23) */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Workspace Routes */}
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/subscriptions"
              element={
                <ProtectedLayout>
                  <Subscriptions />
                </ProtectedLayout>
              }
            />
            <Route
              path="/subscriptions/:id"
              element={
                <ProtectedLayout>
                  <SubscriptionDetails />
                </ProtectedLayout>
              }
            />
            <Route
              path="/add"
              element={
                <ProtectedLayout>
                  <AddSubscription />
                </ProtectedLayout>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedLayout>
                  <Analytics />
                </ProtectedLayout>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedLayout>
                  <Notifications />
                </ProtectedLayout>
              }
            />
            <Route
              path="/preferences"
              element={
                <ProtectedLayout>
                  <PreferencesBudget />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedLayout>
                  <AdminDashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/empty-states"
              element={
                <ProtectedLayout>
                  <EmptyStates />
                </ProtectedLayout>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

