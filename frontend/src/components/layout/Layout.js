import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminLayout from '../../layouts/AdminLayout';
import ClientLayout from '../../layouts/ClientLayout';

/**
 * Layout principal que decide qual layout renderizar com base no papel do usuário
 * Recebe children como props para renderizar o conteúdo dentro do layout
 */
const Layout = ({ children }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Verificação adicional de autenticação
    const token = localStorage.getItem('token');
    if (!token && location.pathname !== '/login') {
      // Se não houver token e não estiver na página de login, redireciona
      navigate('/login');
    }
  }, [location.pathname, navigate]);
  
  // Verifica se estamos em uma rota de administrador
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  // Console log para ajudar no diagnóstico
  console.log('Layout renderizando:', { 
    isAuthenticated, 
    user: user ? { id: user.id, role: user.role } : null,
    path: location.pathname,
    isAdminRoute
  });
  
  // Verifica se o usuário existe antes de acessar suas propriedades
  if (!isAuthenticated || !user) {
    console.log('Layout: Usuário não autenticado ou não existe');
    // Renderiza um layout básico
    return (
      <div className="loading-container" style={{ padding: '20px', minHeight: '100vh' }}>
        {children}
      </div>
    );
  }
  
  try {
    // Renderiza o layout apropriado com base no papel do usuário e na rota atual
    if (user.role === 'admin' || isAdminRoute) {
      return <AdminLayout>{children}</AdminLayout>;
    }
    
    // Para usuários comuns
    return <ClientLayout>{children}</ClientLayout>;
  } catch (error) {
    console.error('Erro ao renderizar layout:', error);
    // Fallback em caso de erro no layout
    return (
      <div className="error-container" style={{ padding: '20px', minHeight: '100vh' }}>
        <div style={{ marginBottom: '20px' }}>
          Ocorreu um erro ao carregar a interface. Por favor, tente novamente.
        </div>
        {children}
      </div>
    );
  }
};

export default Layout;
