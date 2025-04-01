import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button
} from '@mui/material';

const ProfileForm = () => {
  const [profile, setProfile] = useState({
    title: 'Mr.',
    firstName: 'Dennis',
    lastName: 'Canteli',
    companyName: '',
    email: 'dennis@email.com',
    dateOfBirth: '',
    countryOfResidence: 'Brazil',
    countryOfBusiness: 'Brazil',
    phone: '',
    mobile: '',
    street: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Brazil'
  });

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Implementar atualização do perfil
    console.log('Perfil atualizado:', profile);
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Informações do Perfil
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Título</InputLabel>
              <Select
                name="title"
                value={profile.title}
                onChange={handleChange}
              >
                <MenuItem value="Mr.">Mr.</MenuItem>
                <MenuItem value="Mrs.">Mrs.</MenuItem>
                <MenuItem value="Ms.">Ms.</MenuItem>
                <MenuItem value="Dr.">Dr.</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Nome"
              name="firstName"
              value={profile.firstName}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Sobrenome"
              name="lastName"
              value={profile.lastName}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nome da Empresa"
              name="companyName"
              value={profile.companyName}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={profile.email}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Data de Nascimento"
              name="dateOfBirth"
              type="date"
              value={profile.dateOfBirth}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>País de Residência</InputLabel>
              <Select
                name="countryOfResidence"
                value={profile.countryOfResidence}
                onChange={handleChange}
              >
                <MenuItem value="Brazil">Brasil</MenuItem>
                <MenuItem value="USA">Estados Unidos</MenuItem>
                <MenuItem value="UK">Reino Unido</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Telefone"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Celular"
              name="mobile"
              value={profile.mobile}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Endereço"
              name="street"
              value={profile.street}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Complemento"
              name="addressLine2"
              value={profile.addressLine2}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Cidade"
              name="city"
              value={profile.city}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Estado"
              name="state"
              value={profile.state}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="CEP"
              name="postalCode"
              value={profile.postalCode}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>País</InputLabel>
              <Select
                name="country"
                value={profile.country}
                onChange={handleChange}
              >
                <MenuItem value="Brazil">Brasil</MenuItem>
                <MenuItem value="USA">Estados Unidos</MenuItem>
                <MenuItem value="UK">Reino Unido</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
            >
              Atualizar Perfil
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default ProfileForm;
