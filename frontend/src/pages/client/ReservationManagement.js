import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import {
  fetchReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  confirmReservation,
  cancelReservation
} from '../../store/slices/reservationSlice';

const ReservationManagement = () => {
  const dispatch = useDispatch();
  const { reservations, loading, error } = useSelector((state) => state.reservations);
  const { accounts } = useSelector((state) => state.accounts);
  
  // Estados locais
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // create, edit
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    startDate: null,
    endDate: null
  });
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    accountId: '',
    amount: '',
    currency: 'USD',
    description: '',
    scheduledDate: null
  });
  
  // Estado para erros do formulário
  const [formErrors, setFormErrors] = useState({});
  
  // Buscar reservas ao montar o componente
  useEffect(() => {
    dispatch(fetchReservations({ page, rowsPerPage, ...filters }));
  }, [dispatch, page, rowsPerPage, filters]);
  
  // Validar formulário
  const validateForm = () => {
    const errors = {};
    
    if (!formData.accountId) {
      errors.accountId = 'Conta é obrigatória';
    }
    
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Valor inválido';
    }
    
    if (!formData.scheduledDate) {
      errors.scheduledDate = 'Data é obrigatória';
    } else if (new Date(formData.scheduledDate) < new Date()) {
      errors.scheduledDate = 'Data deve ser futura';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Manipular mudanças no formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Abrir diálogo para criar/editar reserva
  const handleOpenDialog = (mode, reservation = null) => {
    setDialogMode(mode);
    if (mode === 'edit' && reservation) {
      setSelectedReservation(reservation);
      setFormData({
        accountId: reservation.accountId,
        amount: reservation.amount,
        currency: reservation.currency,
        description: reservation.description,
        scheduledDate: new Date(reservation.scheduledDate)
      });
    } else {
      setSelectedReservation(null);
      setFormData({
        accountId: '',
        amount: '',
        currency: 'USD',
        description: '',
        scheduledDate: null
      });
    }
    setOpenDialog(true);
  };
  
  // Fechar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormErrors({});
  };
  
  // Salvar reserva
  const handleSave = async () => {
    if (validateForm()) {
      try {
        if (dialogMode === 'create') {
          await dispatch(createReservation(formData)).unwrap();
        } else {
          await dispatch(updateReservation({ id: selectedReservation.id, ...formData })).unwrap();
        }
        handleCloseDialog();
        dispatch(fetchReservations({ page, rowsPerPage, ...filters }));
      } catch (error) {
        // Erro é tratado pelo Redux
      }
    }
  };
  
  // Confirmar reserva
  const handleConfirm = async (reservation) => {
    try {
      await dispatch(confirmReservation(reservation.id)).unwrap();
      dispatch(fetchReservations({ page, rowsPerPage, ...filters }));
    } catch (error) {
      // Erro é tratado pelo Redux
    }
  };
  
  // Cancelar reserva
  const handleCancel = async (reservation) => {
    if (window.confirm('Tem certeza que deseja cancelar esta reserva?')) {
      try {
        await dispatch(cancelReservation(reservation.id)).unwrap();
        dispatch(fetchReservations({ page, rowsPerPage, ...filters }));
      } catch (error) {
        // Erro é tratado pelo Redux
      }
    }
  };
  
  // Excluir reserva
  const handleDelete = async (reservation) => {
    if (window.confirm('Tem certeza que deseja excluir esta reserva?')) {
      try {
        await dispatch(deleteReservation(reservation.id)).unwrap();
        dispatch(fetchReservations({ page, rowsPerPage, ...filters }));
      } catch (error) {
        // Erro é tratado pelo Redux
      }
    }
  };
  
  // Manipular mudança de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Manipular mudança de linhas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Manipular mudança de filtros
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0);
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gerenciamento de Reservas
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Barra de Ferramentas */}
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              placeholder="Buscar por ID ou descrição"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="pending">Pendentes</MenuItem>
                <MenuItem value="confirmed">Confirmadas</MenuItem>
                <MenuItem value="cancelled">Canceladas</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DatePicker
                    label="Data Inicial"
                    value={filters.startDate}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </Grid>
                <Grid item xs={6}>
                  <DatePicker
                    label="Data Final"
                    value={filters.endDate}
                    onChange={(date) => handleFilterChange('endDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog('create')}
              >
                Nova Reserva
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
              >
                Exportar
              </Button>
              
              <IconButton
                color="primary"
                onClick={() => dispatch(fetchReservations({ page, rowsPerPage, ...filters }))}
              >
                <RefreshIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Lista de Reservas */}
      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Data Agendada</TableCell>
                <TableCell>Conta</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : reservations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">Nenhuma reserva encontrada</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tente ajustar os filtros ou criar uma nova reserva
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                reservations?.map((reservation) => (
                  <TableRow key={reservation.id} hover>
                    <TableCell>{reservation.id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ScheduleIcon fontSize="small" color="action" />
                        {formatDate(reservation.scheduledDate)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {reservation.accountNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {reservation.accountType}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(reservation.amount, reservation.currency)}
                    </TableCell>
                    <TableCell>{reservation.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          reservation.status === 'pending'
                            ? 'Pendente'
                            : reservation.status === 'confirmed'
                            ? 'Confirmada'
                            : 'Cancelada'
                        }
                        color={
                          reservation.status === 'pending'
                            ? 'warning'
                            : reservation.status === 'confirmed'
                            ? 'success'
                            : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        {reservation.status === 'pending' && (
                          <>
                            <Tooltip title="Confirmar">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleConfirm(reservation)}
                              >
                                <CheckCircleIcon />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Cancelar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCancel(reservation)}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenDialog('edit', reservation)}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(reservation)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={reservations?.totalCount || 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Itens por página"
        />
      </Paper>
      
      {/* Diálogo de Criar/Editar Reserva */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' ? 'Criar Nova Reserva' : 'Editar Reserva'}
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!formErrors.accountId}>
                <InputLabel>Conta</InputLabel>
                <Select
                  name="accountId"
                  value={formData.accountId}
                  onChange={handleChange}
                  label="Conta"
                >
                  {accounts?.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.accountNumber} - {account.accountType}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.accountId && (
                  <Typography variant="caption" color="error">
                    {formErrors.accountId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                error={!!formErrors.amount}
                helperText={formErrors.amount}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {formData.currency}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Moeda</InputLabel>
                <Select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  label="Moeda"
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                <DatePicker
                  label="Data Agendada"
                  value={formData.scheduledDate}
                  onChange={(date) => handleChange({ target: { name: 'scheduledDate', value: date } })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!formErrors.scheduledDate}
                      helperText={formErrors.scheduledDate}
                    />
                  )}
                  minDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <LoadingButton
            variant="contained"
            onClick={handleSave}
            loading={loading}
          >
            {dialogMode === 'create' ? 'Criar' : 'Salvar'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReservationManagement;
