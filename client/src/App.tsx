import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ListingDetailPage } from './pages/ListingDetailPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { MyListingsPage } from './pages/MyListingsPage';
import { InventoryPage } from './pages/InventoryPage';
import { ReservationsPage } from './pages/ReservationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { useAuthStore } from './stores/authStore';

// Page transition wrapper
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.22, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// Admin Route Wrapper
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// Inner router component (needs useLocation inside BrowserRouter)
const AppRoutes: React.FC = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#131313', color: '#e5e2e1' }}>
      {!isAdminPage && <Navbar />}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public */}
            <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
            <Route path="/how-it-works" element={<PageWrapper><HowItWorksPage /></PageWrapper>} />
            <Route path="/marketplace" element={<PageWrapper><MarketplacePage /></PageWrapper>} />
            <Route path="/buy" element={<Navigate to="/marketplace" replace />} />
            <Route path="/listings/:id" element={<PageWrapper><ListingDetailPage /></PageWrapper>} />
            <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
            <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />

            {/* Protected */}
            <Route path="/create-listing" element={
              <ProtectedRoute><PageWrapper><CreateListingPage /></PageWrapper></ProtectedRoute>
            } />
            <Route path="/sell" element={<Navigate to="/create-listing" replace />} />
            <Route path="/my-listings" element={
              <ProtectedRoute><PageWrapper><MyListingsPage /></PageWrapper></ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute><PageWrapper><InventoryPage /></PageWrapper></ProtectedRoute>
            } />
            <Route path="/reservations" element={
              <ProtectedRoute><PageWrapper><ReservationsPage /></PageWrapper></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><PageWrapper><ProfilePage /></PageWrapper></ProtectedRoute>
            } />

            {/* Admin */}
            <Route path="/admin" element={
              <AdminRoute><PageWrapper><AdminDashboardPage /></PageWrapper></AdminRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
      {!isAdminPage && <Footer />}
    </div>
  );
};

export const App: React.FC = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);
