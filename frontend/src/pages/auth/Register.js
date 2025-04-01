import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Typography, 
  TextField, 
  Button, 
  Box, 
  Grid, 
  Link, 
  InputAdornment, 
  IconButton, 
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  FormControlLabel,
  Checkbox,
  Container
} from '@mui/material';
import { Visibility, VisibilityOff, LockOutlined, EmailOutlined, PersonOutline, PhoneOutlined } from '@mui/icons-material';
import { register, clearError } from '../../store/slices/authSlice';
import { isValidEmail, isValidPassword, isValidPhone } from '../../utils/validation';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  
  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Informações Pessoais', 'Segurança da Conta', 'Termos e Condições'];
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    documentType: 'cpf',
    documentNumber: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    marketingConsent: false
  });
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form validation state
  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    documentType: '',
    documentNumber: '',
    password: '',
    confirmPassword: '',
    agreeTerms: ''
  });
  
  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/client/dashboard');
    }
  }, [isAuthenticated, navigate]);
  
  // Clear errors when unmounting
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error]);
  
  // Handle form input change
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'agreeTerms' || name === 'marketingConsent' ? checked : value
    });
    
    // Clear the specific error when user starts typing again
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // Validate step 1: Informações Pessoais
  const validateStep1 = () => {
    let valid = true;
    const newErrors = {
      ...formErrors,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      documentType: '',
      documentNumber: ''
    };
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nome é obrigatório';
      valid = false;
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Sobrenome é obrigatório';
      valid = false;
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
      valid = false;
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Por favor, insira um endereço de email válido';
      valid = false;
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Número de telefone é obrigatório';
      valid = false;
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'Por favor, insira um número de telefone válido';
      valid = false;
    }
    
    if (!formData.documentNumber.trim()) {
      newErrors.documentNumber = 'Número do documento é obrigatório';
      valid = false;
    }
    
    setFormErrors(newErrors);
    return valid;
  };
  
  // Validate step 2: Segurança da Conta
  const validateStep2 = () => {
    let valid = true;
    const newErrors = {
      ...formErrors,
      password: '',
      confirmPassword: ''
    };
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
      valid = false;
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = 'A senha deve ter pelo menos 8 caracteres e incluir pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial';
      valid = false;
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Por favor, confirme sua senha';
      valid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
      valid = false;
    }
    
    setFormErrors(newErrors);
    return valid;
  };
  
  // Validate step 3: Termos e Condições
  const validateStep3 = () => {
    let valid = true;
    const newErrors = {
      ...formErrors,
      agreeTerms: ''
    };
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Você deve concordar com os termos e condições';
      valid = false;
    }
    
    setFormErrors(newErrors);
    return valid;
  };
  
  // Handle next step
  const handleNext = () => {
    let isValid = false;
    
    switch (activeStep) {
      case 0:
        isValid = validateStep1();
        break;
      case 1:
        isValid = validateStep2();
        break;
      case 2:
        isValid = validateStep3();
        break;
      default:
        isValid = false;
    }
    
    if (isValid) {
      if (activeStep === steps.length - 1) {
        // Submit the form
        handleSubmit();
      } else {
        setActiveStep((prevStep) => prevStep + 1);
      }
    }
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Form submission
  const handleSubmit = () => {
    setSubmitting(true);
    
    // Prepare data for submission
    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      documentType: formData.documentType,
      documentNumber: formData.documentNumber,
      password: formData.password,
      role: 'client'
    };
    
    console.log("Enviando dados de registro:", userData);
    
    // Dispatch registration action
    dispatch(register(userData))
      .unwrap()
      .then((response) => {
        // Registration successful
        console.log('Registro bem-sucedido:', response);
        alert('Conta criada com sucesso! Você será redirecionado para a página de login.');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      })
      .catch((err) => {
        console.error('Erro no registro:', err);
        alert(`Erro ao criar conta: ${err.message || 'Erro desconhecido'}`);
      })
      .finally(() => {
        setSubmitting(false);
      });
  };
  
  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Informações Pessoais
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Por favor, forneça seus dados pessoais para criar sua conta.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="firstName"
                  label="Nome"
                  name="firstName"
                  autoFocus
                  value={formData.firstName}
                  onChange={handleChange}
                  error={!!formErrors.firstName}
                  helperText={formErrors.firstName}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="lastName"
                  label="Sobrenome"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  error={!!formErrors.lastName}
                  helperText={formErrors.lastName}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="phone"
              label="Telefone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneOutlined />
                  </InputAdornment>
                ),
              }}
            />
            
            {/* Novos campos para documento */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  margin="normal"
                  required
                  fullWidth
                  id="documentType"
                  label="Tipo de Documento"
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleChange}
                  error={!!formErrors.documentType}
                  helperText={formErrors.documentType}
                  disabled={loading}
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="passport">Passaporte</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="documentNumber"
                  label={formData.documentType === 'passport' ? 'Número do Passaporte' : 
                         formData.documentType === 'cnpj' ? 'CNPJ' : 'CPF'}
                  name="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleChange}
                  error={!!formErrors.documentNumber}
                  helperText={formErrors.documentNumber}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Segurança da Conta
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Crie uma senha forte para proteger sua conta bancária.
            </Typography>
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={formData.password}
              onChange={handleChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirmar Senha"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ mt: 2, backgroundColor: 'background.paper', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Sua senha deve incluir:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Pelo menos 8 caracteres<br />
                • Pelo menos uma letra maiúscula (A-Z)<br />
                • Pelo menos uma letra minúscula (a-z)<br />
                • Pelo menos um número (0-9)<br />
                • Pelo menos um caractere especial (!@#$%^&*)
              </Typography>
            </Box>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Termos e Condições
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Leia e aceite os termos e condições para concluir seu cadastro.
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflow: 'auto', mb: 2 }}>
              <Typography variant="body2">
                <strong>Termos e Condições do NewCash Bank</strong><br /><br />
                
                Esses termos e condições estabelecem as regras e regulamentos para o uso dos serviços do NewCash Bank.<br /><br />
                
                Ao acessar este site, assumimos que você aceita esses termos e condições em sua totalidade. Não continue a usar o site do NewCash Bank se você não aceita todos os termos e condições estabelecidos nesta página.<br /><br />
                
                A seguinte terminologia se aplica a esses Termos e Condições, Declaração de Privacidade e Aviso de Isenção de Responsabilidade, e a todos os Acordos: "Cliente", "Você" e "Seu" se referem a você, a pessoa que acessa este site e aceita os termos e condições da Empresa. "A Empresa", "Nós", "Nosso" e "Nossa" se referem ao NewCash Bank. "Parte", "Partes" ou "Nós" se referem tanto ao Cliente quanto à Empresa, ou à Empresa ou ao Cliente.<br /><br />
                
                Todos os termos se referem à oferta, aceitação e consideração de pagamento necessária para realizar o processo de nossa assistência ao Cliente da maneira mais apropriada, seja por meio de reuniões formais de duração fixa, ou por qualquer outro meio, para o propósito expresso de atender às necessidades do Cliente em relação à prestação dos serviços/produtos da Empresa, de acordo com e sujeito à, lei prevalecente dos Estados Unidos. Qualquer uso da terminologia acima ou de outras palavras no singular, plural, maiúscula e/ou minúscula, ou ele/ela, são considerados intercambiáveis e, portanto, se referem ao mesmo.
              </Typography>
            </Paper>
            
            <FormControlLabel
              control={
                <Checkbox
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Eu concordo com os termos e condições*"
            />
            {formErrors.agreeTerms && (
              <Typography variant="caption" color="error">
                {formErrors.agreeTerms}
              </Typography>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            <FormControlLabel
              control={
                <Checkbox
                  name="marketingConsent"
                  checked={formData.marketingConsent}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Eu desejo receber informações sobre ofertas, serviços e dicas financeiras do NewCash Bank (opcional)"
            />
          </Box>
        );
      
      default:
        return 'Etapa desconhecida';
    }
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 8 }}>
        <Box textAlign="center" mb={3}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <img src="/assets/images/logo.png" alt="NewCash Bank Logo" style={{ height: '60px' }} />
          </Box>
          <Typography variant="body1" color="text.secondary">
            Crie sua conta
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {getStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={loading}
          >
            {activeStep === steps.length - 1 ? (
              loading ? <CircularProgress size={24} /> : 'Finalizar'
            ) : (
              'Continuar'
            )}
          </Button>
        </Box>
        
        <Grid container justifyContent="center" sx={{ mt: 3 }}>
          <Grid item>
            <Link component={RouterLink} to="/login" variant="body2">
              Já possui uma conta? Faça Login
            </Link>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Register;
