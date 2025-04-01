import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ptBR } from 'date-fns/locale';

// Temas
import { lightTheme, darkTheme } from './themes';

// Provedor de idiomas
import { LanguageProvider } from './contexts/LanguageContext';

// Páginas
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ClientDashboard from './pages/client/Dashboard';
import AccountDetails from './pages/client/AccountDetails';
import TransferFunds from './pages/client/TransferFunds';
import Profile from './pages/client/Profile';
import TransactionHistory from './pages/client/TransactionHistory';
import NotFound from './pages/common/NotFound';
import AdminDashboard from './pages/admin/Dashboard';
import MyAccount from './pages/admin/MyAccount';
import ClientTransactions from './pages/admin/ClientTransactions';
import AdminReports from './pages/admin/AdminReports';
import TransactionsReport from './pages/admin/TransactionsReport';
import AccountStatements from './pages/admin/AccountStatements';
import AccountManagement from './pages/admin/AccountManagement';
import UserManagement from './pages/admin/UserManagement';
import TransactionMonitoring from './pages/admin/TransactionMonitoring';
import SystemSettings from './pages/admin/SystemSettings';
import TransactionReport from './pages/admin/TransactionReport';

// Componentes
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Redux actions
import { checkAuthStatus } from './store/slices/authSlice';
import { fetchUserPreferences } from './store/slices/userSlice';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector(state => state.auth);
  const userState = useSelector(state => state.user);
  const darkMode = userState?.preferences?.darkMode || false;

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserPreferences());
    }
  }, [dispatch, isAuthenticated]);

  const theme = darkMode ? darkTheme : lightTheme;

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <LanguageProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Rotas protegidas para clientes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <ClientDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/accounts/:accountId" element={
              <ProtectedRoute>
                <Layout>
                  <AccountDetails />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/transfers" element={
              <ProtectedRoute>
                <Layout>
                  <TransferFunds />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/account" element={
              <ProtectedRoute>
                <Layout>
                  <MyAccount />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Layout>
                  <TransactionHistory />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Rotas protegidas para administradores */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/my-account" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <MyAccount />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/client-transactions" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <ClientTransactions />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <AdminReports />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reports/transactions" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <TransactionsReport />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reports/statements" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <AccountStatements />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Redirecionamento para corrigir URLs antigas */}
            <Route path="/admin/account-statements" element={<Navigate to="/admin/reports/statements" replace />} />
            
            {/* Novas rotas para funcionalidades ainda não implementadas */}
            <Route path="/admin/accounts" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <AccountManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/transactions" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <TransactionMonitoring />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <SystemSettings />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/reports/transaction-report" element={
              <ProtectedRoute adminOnly={true}>
                <Layout>
                  <TransactionReport />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Página 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} />
        </LocalizationProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
