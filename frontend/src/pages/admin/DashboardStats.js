import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  SwapHoriz as SwapHorizIcon,
  AttachMoney as AttachMoneyIcon,
  Group as GroupIcon,
  CreditCard as CreditCardIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { fetchDashboardStats, clearDashboardError } from '../../store/slices/adminReportSlice';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

const AdminDashboardStats = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Selecionar dados do Redux store
  const {
    data: dashboardData,
    loading,
    error
  } = useSelector((state) => state.adminReports.dashboard);
  
  // Estado local para controle de intervalo de tempo
  const [timeRange, setTimeRange] = useState('month'); // 'day', 'week', 'month', 'year'
  
  // Buscar dados do dashboard
  const fetchDashboardData = () => {
    dispatch(fetchDashboardStats({ timeRange }));
  };
  
  // Buscar dados quando o componente montar ou o intervalo de tempo mudar
  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);
  
  // Limpar erro
  const handleClearError = () => {
    dispatch(clearDashboardError());
  };
  
  // Formatar moeda
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  // Formatar número
  const formatNumber = (number) => {
    return new Intl.NumberFormat('pt-BR').format(number);
  };
  
  // Formatar porcentagem
  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };
  
  // Obter cor para tendência
  const getTrendColor = (value) => {
    if (value > 0) return theme.palette.success.main;
    if (value < 0) return theme.palette.error.main;
    return theme.palette.text.secondary;
  };
  
  // Obter ícone para tendência
  const getTrendIcon = (value) => {
    if (value > 0) return <TrendingUpIcon sx={{ color: theme.palette.success.main }} />;
    if (value < 0) return <TrendingDownIcon sx={{ color: theme.palette.error.main }} />;
    return null;
  };
  
  // Configuração para gráfico de transações por tipo
  const getTransactionsByTypeChartData = () => {
    if (!dashboardData || !dashboardData.transactionsByType) return null;
    
    const { transactionsByType } = dashboardData;
    
    return {
      labels: Object.keys(transactionsByType),
      datasets: [
        {
          label: 'Transações por Tipo',
          data: Object.values(transactionsByType),
          backgroundColor: [
            theme.palette.primary.main,
            theme.palette.secondary.main,
            theme.palette.success.main,
            theme.palette.error.main,
            theme.palette.warning.main,
            theme.palette.info.main
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  // Configuração para gráfico de transações por dia
  const getTransactionsByDayChartData = () => {
    if (!dashboardData || !dashboardData.transactionsByDay) return null;
    
    const { transactionsByDay } = dashboardData;
    
    return {
      labels: transactionsByDay.map(item => item.date),
      datasets: [
        {
          label: 'Número de Transações',
          data: transactionsByDay.map(item => item.count),
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.light,
          tension: 0.4
        }
      ]
    };
  };
  
  // Configuração para gráfico de volume de transações por dia
  const getTransactionVolumeChartData = () => {
    if (!dashboardData || !dashboardData.transactionVolumeByDay) return null;
    
    const { transactionVolumeByDay } = dashboardData;
    
    return {
      labels: transactionVolumeByDay.map(item => item.date),
      datasets: [
        {
          label: 'Volume de Transações',
          data: transactionVolumeByDay.map(item => item.volume),
          borderColor: theme.palette.success.main,
          backgroundColor: theme.palette.success.light,
          tension: 0.4
        }
      ]
    };
  };
  
  // Configuração para gráfico de contas por status
  const getAccountsByStatusChartData = () => {
    if (!dashboardData || !dashboardData.accountsByStatus) return null;
    
    const { accountsByStatus } = dashboardData;
    
    return {
      labels: Object.keys(accountsByStatus),
      datasets: [
        {
          label: 'Contas por Status',
          data: Object.values(accountsByStatus),
          backgroundColor: [
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.error.main
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  // Configuração para gráfico de usuários por mês
  const getUsersByMonthChartData = () => {
    if (!dashboardData || !dashboardData.userRegistrationsByMonth) return null;
    
    const { userRegistrationsByMonth } = dashboardData;
    
    return {
      labels: userRegistrationsByMonth.map(item => item.month),
      datasets: [
        {
          label: 'Novos Usuários',
          data: userRegistrationsByMonth.map(item => item.count),
          backgroundColor: theme.palette.info.main
        }
      ]
    };
  };
  
  // Opções comuns para gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false
      }
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Dashboard Administrativo
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            sx={{ mr: 1 }}
            onClick={() => setTimeRange('day')}
            color={timeRange === 'day' ? 'primary' : 'inherit'}
          >
            Dia
          </Button>
          <Button 
            variant="outlined" 
            sx={{ mr: 1 }}
            onClick={() => setTimeRange('week')}
            color={timeRange === 'week' ? 'primary' : 'inherit'}
          >
            Semana
          </Button>
          <Button 
            variant="outlined" 
            sx={{ mr: 1 }}
            onClick={() => setTimeRange('month')}
            color={timeRange === 'month' ? 'primary' : 'inherit'}
          >
            Mês
          </Button>
          <Button 
            variant="outlined" 
            sx={{ mr: 1 }}
            onClick={() => setTimeRange('year')}
            color={timeRange === 'year' ? 'primary' : 'inherit'}
          >
            Ano
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
            disabled={loading}
          >
            Atualizar
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={handleClearError}
        >
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : dashboardData ? (
        <Grid container spacing={3}>
          {/* Cards de Resumo */}
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccountBalanceIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                  <Typography variant="h6">Total de Contas</Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {formatNumber(dashboardData.totalAccounts)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getTrendIcon(dashboardData.accountsGrowth)}
                  <Typography 
                    variant="body2" 
                    sx={{ color: getTrendColor(dashboardData.accountsGrowth) }}
                  >
                    {formatPercentage(dashboardData.accountsGrowth)} em relação ao período anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <GroupIcon sx={{ color: theme.palette.secondary.main, mr: 1 }} />
                  <Typography variant="h6">Total de Usuários</Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {formatNumber(dashboardData.totalUsers)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getTrendIcon(dashboardData.usersGrowth)}
                  <Typography 
                    variant="body2" 
                    sx={{ color: getTrendColor(dashboardData.usersGrowth) }}
                  >
                    {formatPercentage(dashboardData.usersGrowth)} em relação ao período anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <SwapHorizIcon sx={{ color: theme.palette.info.main, mr: 1 }} />
                  <Typography variant="h6">Total de Transações</Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {formatNumber(dashboardData.totalTransactions)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getTrendIcon(dashboardData.transactionsGrowth)}
                  <Typography 
                    variant="body2" 
                    sx={{ color: getTrendColor(dashboardData.transactionsGrowth) }}
                  >
                    {formatPercentage(dashboardData.transactionsGrowth)} em relação ao período anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachMoneyIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                  <Typography variant="h6">Volume Total</Typography>
                </Box>
                <Typography variant="h4" gutterBottom>
                  {formatCurrency(dashboardData.totalVolume)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getTrendIcon(dashboardData.volumeGrowth)}
                  <Typography 
                    variant="body2" 
                    sx={{ color: getTrendColor(dashboardData.volumeGrowth) }}
                  >
                    {formatPercentage(dashboardData.volumeGrowth)} em relação ao período anterior
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Gráficos */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Transações por Dia
              </Typography>
              {dashboardData.transactionsByDay && (
                <Box sx={{ height: 330 }}>
                  <Line 
                    data={getTransactionsByDayChartData()} 
                    options={chartOptions} 
                  />
                </Box>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Volume de Transações por Dia
              </Typography>
              {dashboardData.transactionVolumeByDay && (
                <Box sx={{ height: 330 }}>
                  <Line 
                    data={getTransactionVolumeChartData()} 
                    options={chartOptions} 
                  />
                </Box>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Transações por Tipo
              </Typography>
              {dashboardData.transactionsByType && (
                <Box sx={{ height: 330 }}>
                  <Doughnut 
                    data={getTransactionsByTypeChartData()} 
                    options={chartOptions} 
                  />
                </Box>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Contas por Status
              </Typography>
              {dashboardData.accountsByStatus && (
                <Box sx={{ height: 330 }}>
                  <Pie 
                    data={getAccountsByStatusChartData()} 
                    options={chartOptions} 
                  />
                </Box>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Novos Usuários por Mês
              </Typography>
              {dashboardData.userRegistrationsByMonth && (
                <Box sx={{ height: 330 }}>
                  <Bar 
                    data={getUsersByMonthChartData()} 
                    options={chartOptions} 
                  />
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Estatísticas Adicionais */}
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader title="Estatísticas de Transações" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">Transações Pendentes</Typography>
                    <Typography variant="h6">{formatNumber(dashboardData.pendingTransactions)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">Transações Falhas</Typography>
                    <Typography variant="h6">{formatNumber(dashboardData.failedTransactions)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">Média por Transação</Typography>
                    <Typography variant="h6">{formatCurrency(dashboardData.averageTransactionAmount)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">Maior Transação</Typography>
                    <Typography variant="h6">{formatCurrency(dashboardData.largestTransactionAmount)}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader title="Estatísticas de Contas" />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">Saldo Médio</Typography>
                    <Typography variant="h6">{formatCurrency(dashboardData.averageAccountBalance)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">Contas Inativas</Typography>
                    <Typography variant="h6">{formatNumber(dashboardData.inactiveAccounts)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">Contas Criadas (Período)</Typography>
                    <Typography variant="h6">{formatNumber(dashboardData.newAccounts)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle1">Contas Bloqueadas</Typography>
                    <Typography variant="h6">{formatNumber(dashboardData.blockedAccounts)}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Typography align="center" color="text.secondary" sx={{ py: 5 }}>
          Nenhum dado disponível
        </Typography>
      )}
    </Box>
  );
};

export default AdminDashboardStats;
