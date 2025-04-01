import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  useTheme,
  Alert,
  Tooltip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  CompareArrows as CompareArrowsIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  ErrorOutline as ErrorOutlineIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';

import { useLanguage } from '../../contexts/LanguageContext';
import { translate } from '../../utils/translations';

// Importações de Redux
import { fetchTransactions } from '../../store/slices/transactionSlice';
import { fetchAccounts } from '../../store/slices/accountSlice';
import { testApiConnections } from '../../store/slices/settingsSlice';
import axios from 'axios';

// Componente de gráfico de linha
const LineChartComponent = ({ data, title }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ height: 300, p: 2 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <RechartsTooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="total"
            name="Total"
            stroke={theme.palette.primary.main}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="internacional"
            name="Internacional"
            stroke={theme.palette.secondary.main}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Componente de gráfico de barras
const BarChartComponent = ({ data, title }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ height: 300, p: 2 }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <RechartsTooltip />
          <Legend />
          <Bar dataKey="completed" name="Concluídas" fill={theme.palette.success.main} />
          <Bar dataKey="pending" name="Pendentes" fill={theme.palette.warning.main} />
          <Bar dataKey="failed" name="Falhas" fill={theme.palette.error.main} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

// Componente de caixa de resumo
const SummaryBox = ({ title, value, icon, color, secondaryText, actionText, onClick }) => {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { bgcolor: 'action.hover' } : {}
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: color, mr: 2 }}>
          {icon}
        </Avatar>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{secondaryText}</Typography>
      {actionText && (
        <Button 
          variant="text" 
          endIcon={<ArrowForwardIcon />} 
          sx={{ mt: 'auto', alignSelf: 'flex-start' }}
          onClick={(e) => {
            e.stopPropagation();
            onClick && onClick();
          }}
        >
          {actionText}
        </Button>
      )}
    </Paper>
  );
};

// Componente de status da API
const ApiStatus = ({ name, status, lastCheck, responseTime }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      case 'degraded':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  return (
    <ListItem>
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: `${getStatusColor()}.main` }}>
          <SecurityIcon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={name}
        secondary={
          <>
            <Typography component="span" variant="body2" color="text.secondary">
              Última verificação: {lastCheck}
            </Typography>
            <br />
            <Typography component="span" variant="body2" color="text.secondary">
              Tempo de resposta: {responseTime}ms
            </Typography>
          </>
        }
      />
      <Chip
        label={status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Degradado'}
        color={getStatusColor()}
        size="small"
      />
    </ListItem>
  );
};

const AdminDashboard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  const { transactions, transactionStats, loading: transactionsLoading } = useSelector((state) => state.transactions);
  const { accounts, totalAccounts, loading: accountsLoading } = useSelector((state) => state.accounts);
  const { apiStatus, loading: apiLoading } = useSelector((state) => state.settings);
  
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    loadDashboardData();
  }, [dispatch]);
  
  const loadDashboardData = async () => {
    setRefreshing(true);
    try {
      // Obter token de autenticação do localStorage
      const token = localStorage.getItem('token') || 'user_admin_temp';
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Buscar dados reais de transações da API FT
      try {
        // 1. Buscar transações reais
        const [usdTransactionsRes, eurTransactionsRes] = await Promise.all([
          axios.get('/api/ft-accounts/usd/transactions', config),
          axios.get('/api/ft-accounts/eur/transactions', config)
        ]);
        
        // 2. Processar transações para atualizar os dados do dashboard
        const usdTransactions = usdTransactionsRes.data?.data?.transactions || [];
        const eurTransactions = eurTransactionsRes.data?.data?.transactions || [];
        
        // 3. Atualizar o estado do Redux com os dados reais
        dispatch({
          type: 'transactions/setTransactions',
          payload: [...usdTransactions, ...eurTransactions]
        });
        
        // 4. Atualizar estatísticas com base nos dados reais
        const today = new Date().toISOString().split('T')[0];
        const todayTransactions = [...usdTransactions, ...eurTransactions].filter(
          t => t.date.startsWith(today)
        ).length;
        
        dispatch({
          type: 'transactions/setTransactionStats',
          payload: {
            today: todayTransactions,
            activeUsers: 12, // Será substituído por API real
            total: usdTransactions.length + eurTransactions.length
          }
        });
        
        console.log('Dados reais carregados:', {
          usd: usdTransactions,
          eur: eurTransactions
        });
      } catch (apiError) {
        console.error('Erro ao carregar dados reais da API FT:', apiError);
        // Continuar com outras chamadas mesmo se houver falha aqui
      }
      
      // Buscar outras informações gerais do dashboard
      await Promise.all([
        dispatch(fetchAccounts({ limit: 5, sort: '-createdAt' })),
        dispatch(testApiConnections())
      ]);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Dados de exemplo para os gráficos
  const transactionTrends = [
    { name: 'Jan', total: 4000, internacional: 2400 },
    { name: 'Fev', total: 3000, internacional: 1398 },
    { name: 'Mar', total: 2000, internacional: 9800 },
    { name: 'Abr', total: 2780, internacional: 3908 },
    { name: 'Mai', total: 1890, internacional: 4800 },
    { name: 'Jun', total: 2390, internacional: 3800 },
    { name: 'Jul', total: 3490, internacional: 4300 }
  ];
  
  const transactionStatus = [
    { name: 'Jan', completed: 400, pending: 240, failed: 20 },
    { name: 'Fev', completed: 300, pending: 139, failed: 15 },
    { name: 'Mar', completed: 200, pending: 980, failed: 30 },
    { name: 'Abr', completed: 278, pending: 390, failed: 25 },
    { name: 'Mai', completed: 189, pending: 480, failed: 18 },
    { name: 'Jun', completed: 239, pending: 380, failed: 22 },
    { name: 'Jul', completed: 349, pending: 430, failed: 28 }
  ];
  
  // Status das APIs
  const apis = [
    {
      name: 'API de Reserva',
      status: 'online',
      lastCheck: '2 min atrás',
      responseTime: 150
    },
    {
      name: 'API de Confirmação',
      status: 'online',
      lastCheck: '3 min atrás',
      responseTime: 180
    },
    {
      name: 'API de Recebimento',
      status: 'degraded',
      lastCheck: '1 min atrás',
      responseTime: 450
    },
    {
      name: 'API de Envio',
      status: 'online',
      lastCheck: '4 min atrás',
      responseTime: 200
    }
  ];
  
  // Alertas de segurança
  const securityAlerts = [
    {
      id: 1,
      severity: 'error',
      message: 'Múltiplas tentativas de login falhas detectadas',
      time: '15 min atrás',
      icon: <ErrorOutlineIcon />,
      color: theme.palette.error.main
    },
    {
      id: 2,
      severity: 'warning',
      message: 'Transação de alto valor requer aprovação',
      time: '1 hora atrás',
      icon: <WarningIcon />,
      color: theme.palette.warning.main
    },
    {
      id: 3,
      severity: 'info',
      message: 'Nova conta criada aguardando verificação',
      time: '2 horas atrás',
      icon: <SecurityIcon />,
      color: theme.palette.info.main
    }
  ];
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Logo e Título do Dashboard */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          bgcolor: '#000000', 
          borderRadius: 2,
          color: 'white',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          alignItems: 'center', 
          width: '100%' 
        }}>
          <Box sx={{ 
            mr: { xs: 0, md: 4 }, 
            mb: { xs: 2, md: 0 },
            textAlign: 'center'
          }}>
            <img 
              src="/assets/images/logo.png" 
              alt="NewCash Bank Logo" 
              style={{ 
                height: '150px', 
                maxWidth: '100%',
                filter: 'brightness(1.2) contrast(1.3) invert(1)'
              }} 
            />
          </Box>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              {translate('Administrative Dashboard', language)}
            </Typography>
            <Typography variant="body1">
              Gerencie contas, transações e monitore o status do sistema
            </Typography>
          </Box>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          variant="outlined"
          onClick={loadDashboardData}
          disabled={refreshing}
          sx={{ 
            color: 'white', 
            borderColor: 'white',
            '&:hover': {
              borderColor: 'grey.300',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          {refreshing ? translate('Updating...', language) : translate('Refresh Data', language)}
        </Button>
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <SummaryBox
            title={translate('Total Accounts', language)}
            value={totalAccounts || 0}
            icon={<AccountBalanceIcon />}
            color={theme.palette.primary.main}
            secondaryText={translate('Active accounts in the system', language)}
            actionText={translate('View Details', language)}
            onClick={() => navigate('/admin/accounts')}
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <SummaryBox
            title={translate('Today\'s Transactions', language)}
            value={transactionStats?.today || 0}
            icon={<CompareArrowsIcon />}
            color={theme.palette.success.main}
            secondaryText={translate('Transactions made today', language)}
            actionText={translate('View Details', language)}
            onClick={() => navigate('/admin/client-transactions')}
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <SummaryBox
            title={translate('Active Users', language)}
            value={transactionStats?.activeUsers || 0}
            icon={<PeopleIcon />}
            color={theme.palette.info.main}
            secondaryText={translate('Active users in the system', language)}
            actionText={translate('View Details', language)}
            onClick={() => navigate('/admin/users')}
          />
        </Grid>
        
        <Grid item xs={12} md={3}>
          <SummaryBox
            title={translate('Security Alerts', language)}
            value={securityAlerts.length}
            icon={<SecurityIcon />}
            color={theme.palette.warning.main}
            secondaryText={translate('Pending security alerts', language)}
            actionText={translate('View Alerts', language)}
            onClick={() => navigate('/admin/reports/statements')}
          />
        </Grid>
        
        {/* Nova seção de Relatórios Administrativos */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
            {translate('Administrative Reports', language)}
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                      <AssessmentIcon />
                    </Avatar>
                    <Typography variant="h6">{translate('General Reports', language)}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Acesse todos os relatórios administrativos, incluindo dashboard com estatísticas gerais do sistema, relatórios de transações e contas.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={() => navigate('/admin/reports')}
                    startIcon={<AssessmentIcon />}
                  >
                    {translate('View Reports', language)}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.success.main, mr: 2 }}>
                      <CompareArrowsIcon />
                    </Avatar>
                    <Typography variant="h6">{translate('Transaction Report', language)}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Visualize relatório detalhado de todas as transações com filtros avançados por tipo, status, data e valor. Exporte para PDF.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="success" 
                    fullWidth
                    onClick={() => navigate('/admin/reports/transactions')}
                    startIcon={<CompareArrowsIcon />}
                  >
                    {translate('View Transactions', language)}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: theme.palette.info.main, mr: 2 }}>
                      <DescriptionIcon />
                    </Avatar>
                    <Typography variant="h6">{translate('Bank Statements', language)}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Acesse e gerencie extratos bancários de qualquer conta no sistema. Visualize resumos financeiros e baixe extratos em PDF.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="info" 
                    fullWidth
                    onClick={() => navigate('/admin/account-statements')}
                    startIcon={<DescriptionIcon />}
                  >
                    {translate('View Statements', language)}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ p: 1 }}>
              {translate('Transaction Trends', language)}
            </Typography>
            <LineChartComponent data={transactionTrends} title={translate('Transactions by Month', language)} />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">{translate('Recent Transactions', language)}</Typography>
              <Button 
                variant="text" 
                size="small" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/admin/client-transactions')}
              >
                {translate('View All', language)}
              </Button>
            </Box>
            {transactionsLoading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : transactions && transactions.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>{translate('Type', language)}</TableCell>
                      <TableCell>{translate('Description', language)}</TableCell>
                      <TableCell align="right">{translate('Value', language)}</TableCell>
                      <TableCell>{translate('Date', language)}</TableCell>
                      <TableCell>{translate('Status', language)}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.slice(0, 5).map((transaction) => {
                      const isDeposit = transaction.type === 'DEPOSIT';
                      return (
                        <TableRow key={transaction.id} hover>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {transaction.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={isDeposit ? translate('Deposit', language) : translate('Withdrawal', language)}
                              color={isDeposit ? 'success' : 'error'}
                              icon={isDeposit ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>{transaction.description}</TableCell>
                          <TableCell align="right" sx={{ 
                            color: isDeposit ? 'success.main' : 'error.main',
                            fontWeight: 'bold',
                            fontSize: '0.75rem'
                          }}>
                            {isDeposit ? '+' : ''}
                            {new Intl.NumberFormat('pt-BR', { 
                              style: 'currency', 
                              currency: transaction.currency || 'USD'
                            }).format(transaction.amount / 100)}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={transaction.status === 'completed' ? translate('Completed', language) : transaction.status}
                              color={transaction.status === 'completed' ? 'success' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">{translate('No recent transactions found.', language)}</Alert>
            )}
            <Box mt={2} display="flex" justifyContent="space-between">
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<RefreshIcon />}
                onClick={loadDashboardData}
                disabled={refreshing}
              >
                {translate('Refresh', language)}
              </Button>
              <Button 
                variant="contained" 
                size="small" 
                startIcon={<AssessmentIcon />}
                onClick={() => {
                  alert("Gerando relatório de transações em formato PDF. Esta funcionalidade estará completamente integrada na próxima atualização.");
                }}
              >
                {translate('Export PDF', language)}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
