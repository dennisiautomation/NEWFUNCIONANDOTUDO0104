import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Cancel as ErrorIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const TOKEN = localStorage.getItem('token') || 'admin_test';

const UserLimits = () => {
  // Estado para dados e paginação
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Estado para pesquisa e filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Estado para diálogo de edição de limites
  const [editDialog, setEditDialog] = useState({
    open: false,
    userId: null,
    userName: '',
    accounts: []
  });
  
  // Estado para formulário de edição
  const [editForm, setEditForm] = useState({});
  const [formErrors, setFormErrors] = useState({});
  
  // Estado para snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Carregar dados iniciais
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, statusFilter]);
  
  // Buscar usuários
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Preparar query params
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter
      };
      
      const response = await axios.get(`${API_URL}/admin/users`, {
        params,
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      });
      
      if (response.data.status === 'success') {
        setUsers(response.data.data || []);
        setTotalUsers(response.data.total || 0);
      } else {
        throw new Error(response.data.message || 'Erro ao carregar usuários');
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      setError(err.message || 'Falha ao carregar dados de usuários');
    } finally {
      setLoading(false);
    }
  };
  
  // Buscar contas de um usuário
  const fetchUserAccounts = async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/admin/users/${userId}/accounts`, {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      });
      
      if (response.data.status === 'success') {
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || 'Erro ao carregar contas');
      }
    } catch (err) {
      console.error('Erro ao buscar contas do usuário:', err);
      setSnackbar({
        open: true,
        message: 'Falha ao carregar contas do usuário',
        severity: 'error'
      });
      return [];
    }
  };
  
  // Aplicar pesquisa
  const handleSearch = () => {
    setPage(0);
    fetchUsers();
  };
  
  // Limpar pesquisa
  const handleClearSearch = () => {
    setSearchTerm('');
    setStatusFilter('');
    setPage(0);
    fetchUsers();
  };
  
  // Mudança de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Mudança de linhas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Abrir diálogo de edição de limites
  const handleOpenEditDialog = async (user) => {
    setLoading(true);
    
    try {
      // Buscar contas do usuário
      const accounts = await fetchUserAccounts(user.id);
      
      // Inicializar formulário de edição
      const formData = {};
      accounts.forEach(account => {
        formData[`${account.id}_dailyLimit`] = account.dailyTransferLimit;
        formData[`${account.id}_monthlyLimit`] = account.monthlyTransferLimit;
      });
      
      setEditForm(formData);
      setFormErrors({});
      
      setEditDialog({
        open: true,
        userId: user.id,
        userName: user.name,
        accounts
      });
    } catch (err) {
      console.error('Erro ao preparar diálogo de edição:', err);
      setSnackbar({
        open: true,
        message: 'Falha ao carregar dados do usuário',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fechar diálogo de edição
  const handleCloseEditDialog = () => {
    setEditDialog({
      ...editDialog,
      open: false
    });
  };
  
  // Atualizar formulário de edição
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Validar que o valor é um número positivo
    if (value !== '' && (!isFinite(value) || value < 0)) {
      return;
    }
    
    setEditForm({
      ...editForm,
      [name]: value
    });
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // Validar formulário
  const validateForm = () => {
    const errors = {};
    
    // Verificar campos obrigatórios e valores válidos
    Object.entries(editForm).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        errors[key] = 'Campo obrigatório';
      } else if (parseFloat(value) < 0) {
        errors[key] = 'Valor deve ser positivo';
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Salvar limites de transação
  const handleSaveLimits = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Preparar dados para atualização
      const updates = [];
      
      editDialog.accounts.forEach(account => {
        updates.push({
          accountId: account.id,
          dailyTransferLimit: parseFloat(editForm[`${account.id}_dailyLimit`]),
          monthlyTransferLimit: parseFloat(editForm[`${account.id}_monthlyLimit`])
        });
      });
      
      // Enviar requisição de atualização
      const response = await axios.put(`${API_URL}/admin/users/${editDialog.userId}/limits`, {
        accounts: updates
      }, {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      });
      
      if (response.data.status === 'success') {
        setSnackbar({
          open: true,
          message: 'Limites atualizados com sucesso',
          severity: 'success'
        });
        
        handleCloseEditDialog();
        fetchUsers(); // Atualizar lista de usuários
      } else {
        throw new Error(response.data.message || 'Erro ao atualizar limites');
      }
    } catch (err) {
      console.error('Erro ao salvar limites:', err);
      setSnackbar({
        open: true,
        message: err.message || 'Falha ao atualizar limites',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fechar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  // Formatar valor monetário
  const formatCurrency = (value, currency) => {
    return parseFloat(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency
    });
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Gerenciamento de Limites de Usuários
      </Typography>
      
      {/* Filtros e Pesquisa */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Buscar por nome, email ou documento"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSearch}>
                      <SearchIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="active">Ativo</MenuItem>
                <MenuItem value="inactive">Inativo</MenuItem>
                <MenuItem value="blocked">Bloqueado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={handleClearSearch}
                sx={{ mr: 2 }}
              >
                Limpar Filtros
              </Button>
              
              <Button
                variant="contained"
                onClick={handleSearch}
                startIcon={<SearchIcon />}
              >
                Buscar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabela de Usuários */}
      <Paper sx={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Usuários ({totalUsers})
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchUsers}
            disabled={loading}
          >
            Atualizar
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading && users.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress size={60} />
          </Box>
        ) : users.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            Nenhum usuário encontrado com os filtros atuais.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Documento</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Contas</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Limite Diário</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Limite Mensal</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.documentType && user.documentNumber
                        ? `${user.documentType.toUpperCase()}: ${user.documentNumber}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.status === 'active' 
                          ? 'Ativo' 
                          : user.status === 'inactive'
                            ? 'Inativo'
                            : 'Bloqueado'
                        }
                        color={user.status === 'active' 
                          ? 'success' 
                          : user.status === 'inactive'
                            ? 'default'
                            : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.accounts && user.accounts.length > 0
                        ? user.accounts.map(acc => acc.currency).join(', ')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {user.accounts && user.accounts.length > 0
                        ? formatCurrency(user.accounts[0].dailyTransferLimit, user.accounts[0].currency)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {user.accounts && user.accounts.length > 0
                        ? formatCurrency(user.accounts[0].monthlyTransferLimit, user.accounts[0].currency)
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEditDialog(user)}
                        disabled={user.status !== 'active'}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalUsers}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`}
        />
      </Paper>
      
      {/* Diálogo de Edição de Limites */}
      <Dialog
        open={editDialog.open}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Editar Limites de Transação - {editDialog.userName}
        </DialogTitle>
        
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {editDialog.accounts.map((account) => (
                <Grid item xs={12} key={account.id}>
                  <Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Conta {account.currency} - {account.accountNumber}
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label={`Limite Diário (${account.currency})`}
                          type="number"
                          name={`${account.id}_dailyLimit`}
                          value={editForm[`${account.id}_dailyLimit`] || ''}
                          onChange={handleFormChange}
                          error={!!formErrors[`${account.id}_dailyLimit`]}
                          helperText={formErrors[`${account.id}_dailyLimit`]}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                {account.currency === 'USD' ? '$' : account.currency === 'EUR' ? '€' : '₮'}
                              </InputAdornment>
                            )
                          }}
                          sx={{ mb: 2 }}
                        />
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                            Utilizado Hoje:
                          </Typography>
                          <Typography variant="body1">
                            {formatCurrency(account.dailyTransferTotal || 0, account.currency)}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label={`Limite Mensal (${account.currency})`}
                          type="number"
                          name={`${account.id}_monthlyLimit`}
                          value={editForm[`${account.id}_monthlyLimit`] || ''}
                          onChange={handleFormChange}
                          error={!!formErrors[`${account.id}_monthlyLimit`]}
                          helperText={formErrors[`${account.id}_monthlyLimit`]}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                {account.currency === 'USD' ? '$' : account.currency === 'EUR' ? '€' : '₮'}
                              </InputAdornment>
                            )
                          }}
                          sx={{ mb: 2 }}
                        />
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" color="textSecondary" sx={{ mr: 1 }}>
                            Utilizado no Mês:
                          </Typography>
                          <Typography variant="body1">
                            {formatCurrency(account.monthlyTransferTotal || 0, account.currency)}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
              
              {editDialog.accounts.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Este usuário não possui contas registradas.
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="inherit">
            Cancelar
          </Button>
          
          <Button
            onClick={handleSaveLimits}
            variant="contained"
            color="primary"
            disabled={loading || editDialog.accounts.length === 0}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Salvar Limites'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserLimits;
