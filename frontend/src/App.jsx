import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { MedicineList } from './pages/medicines/MedicineList';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { SalesList } from './pages/sales/SalesList';
import { NewSale } from './pages/sales/NewSale';
import { SaleDetail } from './pages/sales/SaleDetail';
import { PurchasesList } from './pages/purchases/PurchasesList';
import { NewPurchase } from './pages/purchases/NewPurchase';
import { PurchaseDetail } from './pages/purchases/PurchaseDetail';
import { CollaborationRequest } from './pages/collaboration/CollaborationRequest';
import { CollaborationRequestsList } from './pages/collaboration/CollaborationRequestsList';
import { CollaborationRespond } from './pages/collaboration/CollaborationRespond';
import { ReportsPage } from './pages/reports/ReportsPage';
import { RolesPage } from './pages/roles/RolesPage';
import { CategoryList, BrandList, SellerList } from './pages/masters';
import { LandingPage } from './pages/LandingPage';
import { Profile } from './pages/Profile';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <>
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="medicines" element={<MedicineList />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="sales" element={<SalesList />} />
          <Route path="sales/new" element={<NewSale />} />
          <Route path="sales/:id" element={<SaleDetail />} />
          <Route path="purchases" element={<PurchasesList />} />
          <Route path="purchases/new" element={<NewPurchase />} />
          <Route path="purchases/:id" element={<PurchaseDetail />} />
          <Route path="collaboration/request" element={<CollaborationRequest />} />
          <Route path="collaboration/requests" element={<CollaborationRequestsList />} />
          <Route path="collaboration/respond/:id" element={<CollaborationRespond />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Owner']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="roles"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Owner']}>
                <RolesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="masters"
            element={<ProtectedRoute allowedRoles={['Admin', 'Owner']} />}
          >
            <Route path="categories" element={<CategoryList />} />
            <Route path="brands" element={<BrandList />} />
            <Route path="sellers" element={<SellerList />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
