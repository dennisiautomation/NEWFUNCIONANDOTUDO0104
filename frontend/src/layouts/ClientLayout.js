import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Divider, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Avatar, 
  Menu, 
  MenuItem, 
  Badge, 
  Tooltip, 
  useMediaQuery,
  Button
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SendIcon from '@mui/icons-material/Send';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import HelpIcon from '@mui/icons-material/Help';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import TranslateIcon from '@mui/icons-material/Translate';

import { logout } from '../store/slices/authSlice';
import { toggleSidebar, setSidebarOpen } from '../store/slices/uiSlice';
import { useLanguage } from '../contexts/LanguageContext';
import { translate } from '../utils/translations';

// Drawer width
const drawerWidth = 280;

// Styled components
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const AppBarStyled = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const ClientLayout = ({ children }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { language, toggleLanguage } = useLanguage();
  
  // Console logs para diagnóstico
  console.log('ClientLayout renderizando. Path:', location.pathname);
  
  // Get user data and sidebar state from Redux
  const { user } = useSelector((state) => state.auth);
  const { sidebar } = useSelector((state) => state.ui);
  const { notifications } = useSelector((state) => state.ui);
  
  // Log de diagnóstico do estado do usuário
  console.log('ClientLayout - User:', user ? { id: user.id, email: user.email } : 'não disponível');
  
  // Verificação de segurança - se não existir usuário, redireciona para login
  useEffect(() => {
    // Dupla verificação de autenticação
    const token = localStorage.getItem('token');
    const userExists = !!user;
    
    console.log('ClientLayout - Verificação de autenticação:', { tokenExists: !!token, userExists });
    
    if (!token || !userExists) {
      console.log('ClientLayout - Redirecionando para /login por falta de autenticação');
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Local state for profile menu
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState(null);
  
  // Calculate if drawer should be open based on sidebar state and screen size
  const isDrawerOpen = isMobile ? false : sidebar.open;
  
  // Handle drawer toggling
  const handleDrawerToggle = () => {
    dispatch(toggleSidebar());
  };
  
  // Handle user menu opening
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  
  // Handle user menu closing
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  
  // Handle notifications menu
  const handleOpenNotificationsMenu = (event) => {
    setAnchorElNotifications(event.currentTarget);
  };
  
  // Handle notifications menu closing
  const handleCloseNotificationsMenu = () => {
    setAnchorElNotifications(null);
  };
  
  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  // Navigation items
  const navItems = [
    { text: translate('Dashboard', language), icon: <DashboardIcon />, path: '/dashboard' },
    { text: translate('My Account', language), icon: <AccountBoxIcon />, path: '/account' },
    { text: translate('Transfer Funds', language), icon: <SendIcon />, path: '/transfers' },
    { text: translate('Transaction History', language), icon: <ListAltIcon />, path: '/transactions' },
    { text: translate('Profile', language), icon: <PersonIcon />, path: '/profile' },
  ];
  
  // Format user's name for display
  const formatUserName = () => {
    if (!user) return 'User';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'User';
  };
  
  // Get user's initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return user.email?.charAt(0).toUpperCase() || 'U';
  };
  
  // Render drawer content
  const drawerContent = (
    <>
      <DrawerHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pl: 2 }}>
          <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
            <img 
              src="/assets/images/logo.png" 
              alt="NewCash Bank Logo" 
              style={{ 
                height: '120px', 
                maxWidth: '100%',
                filter: 'brightness(1.1) contrast(1.2)'
              }} 
            />
          </Box>
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>
      </DrawerHeader>
      <Divider />
      
      {/* User info section */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Avatar 
          sx={{ 
            width: 64, 
            height: 64, 
            bgcolor: 'black', 
            mx: 'auto',
            mb: 1
          }}
        >
          {getUserInitials()}
        </Avatar>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {formatUserName()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Client
        </Typography>
      </Box>
      
      <Divider />
      
      {/* Navigation links */}
      <List>
        {navItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.12)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    backgroundColor: 'black',
                    borderRadius: '0 4px 4px 0',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'black' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider />
      
      {/* Bottom links */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {}}>
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText primary="Help & Support" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );
  
  // Renderizar o layout com tratamento de erros
  try {
    console.log('ClientLayout - Renderizando interface do cliente');
    
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        
        {/* App Bar */}
        <AppBar
          position="fixed"
          color="default"
          elevation={0}
          sx={{
            width: { sm: `calc(100% - ${isDrawerOpen ? drawerWidth : 0}px)` },
            ml: { sm: `${isDrawerOpen ? drawerWidth : 0}px` },
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: 'white'
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{ mr: 2, ...(isDrawerOpen && { display: 'none' }) }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
              <Typography variant="h6" noWrap component="div">
                {navItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
              </Typography>
            </Box>
            
            <Box sx={{ flexGrow: 1 }} />
            
            {/* Notifications */}
            <Box sx={{ display: 'flex' }}>
              <Tooltip title="Notifications">
                <IconButton
                  size="large"
                  aria-label="show notifications"
                  color="inherit"
                  onClick={handleOpenNotificationsMenu}
                >
                  <Badge badgeContent={notifications.unread} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              {/* Language Toggle Button */}
              <Tooltip title={translate('Change Language', language)}>
                <IconButton 
                  size="large" 
                  color="inherit" 
                  onClick={toggleLanguage}
                  sx={{ ml: 1 }}
                >
                  <TranslateIcon />
                </IconButton>
              </Tooltip>
              
              {/* User menu */}
              <Tooltip title="Account settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, ml: 1 }}>
                  <Avatar sx={{ bgcolor: 'black' }}>
                    {getUserInitials()}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Notifications Menu */}
            <Menu
              sx={{ mt: '45px' }}
              id="notifications-menu"
              anchorEl={anchorElNotifications}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElNotifications)}
              onClose={handleCloseNotificationsMenu}
            >
              {notifications.items.length > 0 ? (
                notifications.items.map((notification) => (
                  <MenuItem key={notification.id} onClick={handleCloseNotificationsMenu}>
                    <Typography textAlign="center">{notification.message}</Typography>
                  </MenuItem>
                ))
              ) : (
                <MenuItem onClick={handleCloseNotificationsMenu}>
                  <Typography textAlign="center">No new notifications</Typography>
                </MenuItem>
              )}
            </Menu>
            
            {/* User Menu */}
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={() => { navigate('/client/profile'); handleCloseUserMenu(); }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Profile</Typography>
              </MenuItem>
              <MenuItem onClick={() => { handleCloseUserMenu(); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Settings</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleLogout(); handleCloseUserMenu(); }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <Typography textAlign="center">Logout</Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        
        {/* Drawer - Menu lateral */}
        <Drawer
          variant={isMobile ? 'temporary' : 'persistent'}
          open={isDrawerOpen}
          onClose={handleDrawerToggle}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { 
              width: drawerWidth, 
              boxSizing: 'border-box',
              backgroundColor: '#f8f9fa',
              borderRight: '1px solid #e0e0e0'
            },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* Main content */}
        <Main open={isDrawerOpen}>
          <DrawerHeader />
          <Box sx={{ 
            padding: theme.spacing(3),
            backgroundColor: '#f5f5f5',
            minHeight: 'calc(100vh - 64px)'
          }}>
            {children}
          </Box>
        </Main>
      </Box>
    );
  } catch (error) {
    console.error('Erro ao renderizar ClientLayout:', error);
    
    // Layout de fallback em caso de erro
    return (
      <Box sx={{ 
        padding: theme.spacing(3),
        backgroundColor: '#f5f5f5',
        minHeight: '100vh'
      }}>
        <Typography variant="h5" color="error" gutterBottom>
          Erro ao carregar o layout
        </Typography>
        <Typography variant="body1" paragraph>
          Ocorreu um problema ao carregar a interface do cliente. Por favor, tente novamente.
        </Typography>
        <Box sx={{ mt: 3 }}>
          {children}
        </Box>
        <Box sx={{ mt: 4 }}>
          <Button variant="outlined" color="primary" onClick={() => window.location.reload()}>
            Recarregar Página
          </Button>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={handleLogout} 
            sx={{ ml: 2 }}
          >
            Sair
          </Button>
        </Box>
      </Box>
    );
  }
};

export default ClientLayout;
