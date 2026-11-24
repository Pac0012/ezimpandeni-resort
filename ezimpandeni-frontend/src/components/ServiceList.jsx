import React, { useState, useEffect } from 'react';
import { Container, Grid, Card, CardContent, CardActions, Typography, Button, Box, Chip, CircularProgress, Alert } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import apiClient from '../api/client';
import BookingModal from './BookingModal';

export default function ServiceList() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await apiClient.get('/services');
      setServices(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not connect to Ezimpandeni backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBooking = (service) => {
    setSelectedService(service);
    setModalOpen(true);
  };

  const formatPriceDisplay = (service) => {
    if (service.category === 'Day Visit') return 'From R100.00 / Adult';
    if (service.category === 'Events') return 'From R12,000.00';
    return `R${service.base_price.toLocaleString()}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h3" component="h1" fontWeight={700} color="#1b4332" gutterBottom>
          Welcome to Ezimpandeni Resort
        </Typography>
        <Typography variant="h6" color="text.secondary" maxWidth="700px" mx="auto">
          Experience outdoor luxury, peaceful gardens, and stunning views. Select a package below to make your reservation.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

      <Grid container spacing={4}>
        {services.map((service) => (
          <Grid item key={service.id} xs={12} sm={6} md={6}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: 3 }}>
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Chip label={service.category} color="primary" sx={{ backgroundColor: '#1b4332' }} />
                  <Typography variant="h6" fontWeight={700} color="#2d6a4f">
                    {formatPriceDisplay(service)}
                  </Typography>
                </Box>

                <Typography variant="h5" component="h2" fontWeight={700} gutterBottom color="#1b4332">
                  {service.title}
                </Typography>

                <Typography variant="body2" color="text.secondary" paragraph sx={{ minHeight: '60px' }}>
                  {service.description}
                </Typography>

                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    <WbSunnyIcon fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle', color: '#d4a373' }} />
                    Includes garden access, tap water, toilets, braai stands & 1 changing room.
                  </Typography>
                </Box>
              </CardContent>

              <CardActions sx={{ p: 3, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={() => handleOpenBooking(service)}
                  sx={{ backgroundColor: '#d4a373', '&:hover': { backgroundColor: '#bc8a5f' }, fontWeight: 700 }}
                >
                  Book Package
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <BookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        service={selectedService}
      />
    </Container>
  );
}