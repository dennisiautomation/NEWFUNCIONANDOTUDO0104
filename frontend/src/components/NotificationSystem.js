import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Snackbar,
  Alert,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  MonetizationOn as MonetizationOnIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { markNotificationAsRead } from '../store/slices/notificationSlice';

const NotificationSystem = () => {
  const dispatch = useDispatch();
  const { notifications, unreadCount } = useSelector((state) => state.notifications);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentAlert, setCurrentAlert] = useState(null);
  
  // Abrir menu de notificações
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Fechar menu de notificações
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  // Marcar notificação como lida
  const handleNotificationClick = (notification) => {
    dispatch(markNotificationAsRead(notification.id));
    handleCloseMenu();
    
    // Se for uma notificação que requer ação, mostrar alerta
    if (notification.requiresAction) {
      setCurrentAlert({
        severity: notification.type,
        message: notification.message
      });
    }
  };
  
  // Obter ícone baseado no tipo de notificação
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'transaction':
        return <MonetizationOnIcon color="primary" />;
      case 'security':
        return <SecurityIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'success':
        return <CheckIcon color="success" />;
      default:
        return <InfoIcon color="info" />;
    }
  };
  
  // Formatar data da notificação
  const formatNotificationDate = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    }
    
    return notificationDate.toLocaleDateString('pt-BR');
  };
  
  return (
    <>
      <IconButton color="inherit" onClick={handleOpenMenu}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 400
          }
        }}
      >
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <Typography variant="h6">
            Notificações
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount} não lidas
          </Typography>
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Nenhuma notificação
            </Typography>
          </MenuItem>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover'
                  }}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.message}
                    secondary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatNotificationDate(notification.date)}
                        </Typography>
                        {notification.requiresAction && (
                          <Typography variant="caption" color="primary">
                            Requer ação
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Menu>
      
      <Snackbar
        open={Boolean(currentAlert)}
        autoHideDuration={6000}
        onClose={() => setCurrentAlert(null)}
      >
        {currentAlert && (
          <Alert
            onClose={() => setCurrentAlert(null)}
            severity={currentAlert.severity}
            sx={{ width: '100%' }}
          >
            {currentAlert.message}
          </Alert>
        )}
      </Snackbar>
    </>
  );
};

export default NotificationSystem;
