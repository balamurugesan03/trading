
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import CardTilt from './components/CardTilt';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import DashboardPage from './pages/customer/DashboardPage';
import DepositPage from './pages/customer/DepositPage';
import WithdrawPage from './pages/customer/WithdrawPage';
import WalletPage from './pages/customer/WalletPage';
import TeamPage from './pages/customer/TeamPage';
import KycPage from './pages/customer/KycPage';
import ProfilePage from './pages/customer/ProfilePage';
import SupportPage from './pages/customer/SupportPage';
import NotificationsPage from './pages/customer/NotificationsPage';

import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UsersPage from './pages/admin/UsersPage';
import KycAdminPage from './pages/admin/KycAdminPage';
import DepositsAdminPage from './pages/admin/DepositsAdminPage';
import WithdrawalsAdminPage from './pages/admin/WithdrawalsAdminPage';
import PackagesAdminPage from './pages/admin/PackagesAdminPage';
import RoiSettingsPage from './pages/admin/RoiSettingsPage';
import LevelSettingsPage from './pages/admin/LevelSettingsPage';
import IncentivesAdminPage from './pages/admin/IncentivesAdminPage';
import WalletManagementPage from './pages/admin/WalletManagementPage';
import ReportsPage from './pages/admin/ReportsPage';
import NotificationsAdminPage from './pages/admin/NotificationsAdminPage';
import SupportAdminPage from './pages/admin/SupportAdminPage';

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <CardTilt />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<CustomerLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/deposit" element={<DepositPage />} />
              <Route path="/withdraw" element={<WithdrawPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/kyc" element={<KycPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute role="super_admin" />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/kyc" element={<KycAdminPage />} />
              <Route path="/admin/deposits" element={<DepositsAdminPage />} />
              <Route path="/admin/withdrawals" element={<WithdrawalsAdminPage />} />
              <Route path="/admin/packages" element={<PackagesAdminPage />} />
              <Route path="/admin/roi-settings" element={<RoiSettingsPage />} />
              <Route path="/admin/level-settings" element={<LevelSettingsPage />} />
              <Route path="/admin/incentives" element={<IncentivesAdminPage />} />
              <Route path="/admin/wallets" element={<WalletManagementPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/notifications" element={<NotificationsAdminPage />} />
              <Route path="/admin/support" element={<SupportAdminPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
