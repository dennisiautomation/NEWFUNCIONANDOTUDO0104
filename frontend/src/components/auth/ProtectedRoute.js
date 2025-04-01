import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Componente para proteger rotas que requerem autenticação
 * Redireciona para a página de login se o usuário não estiver autenticado
 * Aceita children como props para renderizar o conteúdo protegido
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, user } = useSelector(state => state.auth);

  // Se ainda estiver carregando, mostra um indicador de carregamento
  if (loading) {
    return <div className="loading-container">Carregando...</div>;
  }

  // Se não estiver autenticado, redireciona para o login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Se a rota requer privilégios de administrador e o usuário não é admin, redireciona
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  // Se estiver autenticado e tiver as permissões necessárias, renderiza os children
  return children;
};

export default ProtectedRoute;
