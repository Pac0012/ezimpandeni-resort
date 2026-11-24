import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Button,
  Collapse,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import apiClient from '../api/client';
import StaffRegister from '../components/StaffRegister';

export default function StaffPortal() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  const normalizeBookings = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.bookings)) return payload.bookings;
    if (Array.isArray(payload?.reservations)) return payload.reservations;
    return [];
  };

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/bookings');
      setBookings(normalizeBookings(response?.data));
    } catch (err) {
      console.error('Error fetching staff bookings:', err);
      const detail = err?.response?.data?.detail;
      setError(detail || 'Unable to load bookings from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} color="#1b4332">
            Staff Portal - Customer Bookings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All client reservations are recorded live here and e-mailed to luyandakhaya93@gmail.com
          </Typography>
        </Box>

        <Box display="flex" gap={1.5}>
          <Button
            startIcon={<PersonAddIcon />}
            variant="contained"
            onClick={() => setShowRegister((prev) => !prev)}
            sx={{ bgcolor: '#1b4332', '&:hover': { bgcolor: '#2d6a4f' } }}
          >
            {showRegister ? 'Hide Staff Register' : 'Register Staff'}
          </Button>
          <Button
            startIcon={<RefreshIcon />}
            variant="outlined"
            onClick={fetchBookings}
          >
            Refresh List
          </Button>
        </Box>
      </Box>

      <Collapse in={showRegister}>
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <StaffRegister />
        </Paper>
      </Collapse>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" my={5}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#1b4332' }}>
              <TableRow>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>ID</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Guest Name</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Email & Phone</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Date of Visit</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Guests</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Total Price</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No bookings recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.booking_id} hover>
                    <TableCell>
                      <b>#EZP-{booking.booking_id}</b>
                    </TableCell>
                    <TableCell>{booking.full_name}</TableCell>
                    <TableCell>
                      {booking.email}
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {booking.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>{booking.booking_date}</TableCell>
                    <TableCell>{booking.guest_count}</TableCell>
                    <TableCell>
                      <b>R{booking.total_price?.toLocaleString()}</b>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={booking.status || 'Confirmed'}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}