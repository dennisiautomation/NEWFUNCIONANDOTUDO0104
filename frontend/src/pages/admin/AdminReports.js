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
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import { 
  BarChart, 
  DescriptionOutlined, 
  AccountBalanceOutlined, 
  PeopleOutlined, 
  ReceiptOutlined 
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_REPORTS_API_URL } from '../../config';

const AdminReports = () => {
  const dispatch = useDispatch();
  const { token } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${ADMIN_REPORTS_API_URL}/admin-reports/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'success') {
        setDashboardStats(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      toast.error('Não foi possível carregar as estatísticas do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (reportType) => {
    try {
      const response = await axios.get(`${ADMIN_REPORTS_API_URL}/admin-reports/${reportType}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Criar URL para o blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Relatório baixado com sucesso');
    } catch (error) {
      console.error(`Erro ao baixar relatório ${reportType}:`, error);
      toast.error('Não foi possível baixar o relatório');
    }
  };

  const openReport = (reportType) => {
    window.open(`/admin/${reportType}-report`, '_blank');
  };

  const reportCards = [
    {
      title: 'Relatório de Transações',
      description: 'Visualize todas as transações do sistema com filtros avançados',
      icon: <ReceiptOutlined fontSize="large" color="primary" />,
      actions: [
        { label: 'Visualizar', onClick: () => openReport('transactions-report') },
        { label: 'Baixar PDF', onClick: () => downloadReport('transactions') }
      ]
    },
    {
      title: 'Relatório de Contas',
      description: 'Analise todas as contas bancárias cadastradas no sistema',
      icon: <AccountBalanceOutlined fontSize="large" color="primary" />,
      actions: [
        { label: 'Visualizar', onClick: () => openReport('accounts') }
      ]
    },
    {
      title: 'Relatório de Usuários',
      description: 'Visualize informações sobre os usuários do sistema',
      icon: <PeopleOutlined fontSize="large" color="primary" />,
      actions: [
        { label: 'Visualizar', onClick: () => openReport('users') }
      ]
    },
    {
      title: 'Extratos Bancários',
      description: 'Acesse os extratos bancários de qualquer conta do sistema',
      icon: <DescriptionOutlined fontSize="large" color="primary" />,
      actions: [
        { label: 'Visualizar', onClick: () => openReport('account-statements') }
      ]
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Relatórios Administrativos
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dashboard
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : dashboardStats ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total de Usuários
                    </Typography>
                    <Typography variant="h4">
                      {dashboardStats.totalUsers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total de Contas
                    </Typography>
                    <Typography variant="h4">
                      {dashboardStats.totalAccounts}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Transações (30 dias)
                    </Typography>
                    <Typography variant="h4">
                      {dashboardStats.transactionsLast30Days}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Volume Transacionado (R$)
                    </Typography>
                    <Typography variant="h4">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(dashboardStats.transactionVolume)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Typography>Não foi possível carregar as estatísticas</Typography>
          )}
        </Paper>
      </Box>
      
      <Typography variant="h6" gutterBottom>
        Relatórios Disponíveis
      </Typography>
      
      <Grid container spacing={3}>
        {reportCards.map((card, index) => (
          <Grid item xs={12} md={6} lg={3} key={index}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {card.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom align="center">
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                {card.actions.map((action, idx) => (
                  <Button 
                    key={idx} 
                    variant={idx === 0 ? "contained" : "outlined"} 
                    color="primary" 
                    onClick={action.onClick}
                    size="small"
                  >
                    {action.label}
                  </Button>
                ))}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default AdminReports;
