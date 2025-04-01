import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Componente para proteger rotas que requerem autenticação e privilégios de administrador
 * Redireciona para a página de login se o usuário não estiver autenticado
 * Redireciona para o dashboard se o usuário não for administrador
 * Aceita children como props para renderizar o conteúdo protegido
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useSelector(state => state.auth);

  // Se ainda estiver carregando, não faz nada
  if (loading) {
    return <div>Carregando...</div>;
  }

  // Se não estiver autenticado, redireciona para o login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Se não for administrador, redireciona para o dashboard
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  // Se estiver autenticado e for administrador, renderiza os children
  return children;
};

export default AdminRoute;
