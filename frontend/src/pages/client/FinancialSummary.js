import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Button,
  useTheme
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  SwapHoriz as SwapHorizIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  ReceiptLong as ReceiptLongIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { fetchFinancialSummary } from '../../store/slices/statementSlice';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

const FinancialSummary = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Obter dados do Redux store
  const { financialSummary, loading, error } = useSelector((state) => state.statements);
  
  // Buscar dados do resumo financeiro
  useEffect(() => {
    dispatch(fetchFinancialSummary());
  }, [dispatch]);
  
  // Voltar para a página anterior
  const handleBack = () => {
    navigate(-1);
  };
  
  // Navegar para o extrato de uma conta
  const handleViewStatement = (accountId) => {
    navigate(`/client/statements/accounts/${accountId}`);
  };
  
  // Baixar extrato em PDF
  const handleDownloadPdf = (accountId) => {
    window.open(`/client/statements/accounts/${accountId}/pdf`, '_blank');
  };
  
  // Atualizar dados
  const handleRefresh = () => {
    dispatch(fetchFinancialSummary());
  };
  
  // Formatar moeda
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };
  
  // Formatar data
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Extrair dados do resumo financeiro
  const accounts = financialSummary?.accounts || [];
  const totalBalance = financialSummary?.totalBalance || 0;
  const recentTransactions = financialSummary?.recentTransactions || [];
  const monthlyInflow = financialSummary?.monthlyInflow || 0;
  const monthlyOutflow = financialSummary?.monthlyOutflow || 0;
  const transactionsByType = financialSummary?.transactionsByType || {};
  const transactionsByMonth = financialSummary?.transactionsByMonth || {};
  
  // Dados para o gráfico de pizza
  const pieChartData = {
    labels: Object.keys(transactionsByType).map(type => 
      type.charAt(0).toUpperCase() + type.slice(1)
    ),
    datasets: [
      {
        data: Object.values(transactionsByType),
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.error.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.info.main,
        ],
        borderColor: [
          theme.palette.primary.dark,
          theme.palette.error.dark,
          theme.palette.success.dark,
          theme.palette.warning.dark,
          theme.palette.info.dark,
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Dados para o gráfico de barras
  const barChartData = {
    labels: Object.keys(transactionsByMonth),
    datasets: [
      {
        label: 'Entradas',
        data: Object.values(transactionsByMonth).map(month => month.inflow),
        backgroundColor: theme.palette.success.main,
      },
      {
        label: 'Saídas',
        data: Object.values(transactionsByMonth).map(month => month.outflow),
        backgroundColor: theme.palette.error.main,
      },
    ],
  };
  
  // Opções para o gráfico de barras
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Fluxo Financeiro Mensal',
      },
    },
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            Resumo Financeiro
          </Typography>
        </Box>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Atualizar
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Resumo de Saldos */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, bgcolor: theme.palette.primary.main, color: 'white' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="h5" gutterBottom>
                    Saldo Total
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(totalBalance)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Atualizado em: {formatDate(new Date())}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 }}>
                        <ArrowUpwardIcon color="inherit" />
                        <Typography variant="body2">Entradas do Mês</Typography>
                        <Typography variant="h6">{formatCurrency(monthlyInflow)}</Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 1 }}>
                        <ArrowDownwardIcon color="inherit" />
                        <Typography variant="body2">Saídas do Mês</Typography>
                        <Typography variant="h6">{formatCurrency(monthlyOutflow)}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Contas */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Suas Contas
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {accounts.length > 0 ? (
                <List>
                  {accounts.map((account) => (
                    <ListItem
                      key={account.id}
                      secondaryAction={
                        <Box>
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewStatement(account.id)}
                            sx={{ mr: 1 }}
                          >
                            <ReceiptLongIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDownloadPdf(account.id)}
                          >
                            <PdfIcon />
                          </IconButton>
                        </Box>
                      }
                      divider
                    >
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          <AccountBalanceIcon />
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={account.name || `Conta ${account.number}`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {formatCurrency(account.balance, account.currency)}
                            </Typography>
                            {` — ${account.type} - ${account.number}`}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                  Nenhuma conta encontrada
                </Typography>
              )}
            </Paper>
          </Grid>
          
          {/* Distribuição de Transações */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Distribuição de Transações
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ height: 250, display: 'flex', justifyContent: 'center' }}>
                {Object.keys(transactionsByType).length > 0 ? (
                  <Pie data={pieChartData} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography color="text.secondary">
                      Sem dados disponíveis
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Fluxo Financeiro */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Fluxo Financeiro
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ height: 300 }}>
                {Object.keys(transactionsByMonth).length > 0 ? (
                  <Bar data={barChartData} options={barChartOptions} />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography color="text.secondary">
                      Sem dados disponíveis
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Transações Recentes */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Transações Recentes
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {recentTransactions.length > 0 ? (
                <List>
                  {recentTransactions.map((transaction) => (
                    <ListItem
                      key={transaction.id}
                      secondaryAction={
                        <Chip
                          label={transaction.status}
                          color={
                            transaction.status === 'completed' ? 'success' :
                            transaction.status === 'pending' ? 'warning' : 'error'
                          }
                          size="small"
                        />
                      }
                      divider
                    >
                      <ListItemIcon>
                        {transaction.type === 'deposit' ? (
                          <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                            <TrendingUpIcon />
                          </Avatar>
                        ) : transaction.type === 'withdrawal' ? (
                          <Avatar sx={{ bgcolor: theme.palette.error.main }}>
                            <TrendingDownIcon />
                          </Avatar>
                        ) : (
                          <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                            <SwapHorizIcon />
                          </Avatar>
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={transaction.description}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              {transaction.isDebit ? '-' : '+'} {formatCurrency(transaction.amount, transaction.currency)}
                            </Typography>
                            {` — ${formatDate(transaction.date)}`}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography align="center" color="text.secondary" sx={{ py: 3 }}>
                  Nenhuma transação recente
                </Typography>
              )}
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  endIcon={<VisibilityIcon />}
                  onClick={() => navigate('/client/transactions')}
                >
                  Ver Todas as Transações
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default FinancialSummary;
