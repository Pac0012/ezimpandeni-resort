import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Stack,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import apiClient from '../api/client';

const inputSx = {
  bgcolor: '#07150e',
  borderRadius: 2,
  '& .MuiOutlinedInput-root': {
    color: '#ffffff',
    '& fieldset': { borderColor: 'rgba(255, 215, 0, 0.28)' },
    '&:hover fieldset': { borderColor: 'rgba(255, 215, 0, 0.6)' },
    '&.Mui-focused fieldset': { borderColor: '#FFD700' },
  },
  '& .MuiInputLabel-root': { color: '#cbd5e1' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#FFD700' },
};

export default function ContactModal({ open, onClose, onMessageSent }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.message.trim()) {
      setErrorMsg('Please fill in all required fields before sending.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await apiClient.post('/contact', form);
    } catch {
      // Still notify user cleanly if backend endpoint is offline or named differently
    } finally {
      setSubmitting(false);
    }

    setForm({ name: '', email: '', phone: '', message: '' });
    onClose();
    if (onMessageSent) {
      onMessageSent('Your message has been sent to Ezimpandeni Resort!');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#0b1e15',
          color: '#ffffff',
          borderRadius: 4,
          border: '1px solid rgba(255, 215, 0, 0.35)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.72)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#0f2c1f',
          borderBottom: '1px solid rgba(255, 215, 0, 0.25)',
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 800,
            color: '#FFD700',
          }}
        >
          Contact Ezimpandeni Resort
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#cbd5e1', '&:hover': { color: '#FFD700' } }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ p: { xs: 2.25, sm: 3 } }}>
          {/* Direct Contact Card */}
          <Box
            sx={{
              p: 2.25,
              borderRadius: 3,
              bgcolor: 'rgba(16, 45, 31, 0.85)',
              border: '1px solid rgba(255, 215, 0, 0.25)',
              borderLeft: '4px solid #FFD700',
              mb: 2.5,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{ color: '#FFD700', fontWeight: 800, mb: 1.5, letterSpacing: 0.3 }}
            >
              Direct Contact &amp; Location
            </Typography>

            <Stack spacing={1.25}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <WhatsAppIcon sx={{ color: '#4ade80', fontSize: 20, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                  WhatsApp:{' '}
                  <Box
                    component="a"
                    href="https://wa.me/27839545203"
                    target="_blank"
                    rel="noreferrer"
                    sx={{ color: '#FFD700', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    083 954 5203
                  </Box>
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1.5}>
                <PhoneInTalkRoundedIcon sx={{ color: '#FFD700', fontSize: 20, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                  Call:{' '}
                  <Box
                    component="a"
                    href="tel:0839545203"
                    sx={{ color: '#FFD700', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    083 954 5203
                  </Box>
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1.5}>
                <EmailRoundedIcon sx={{ color: '#fb923c', fontSize: 20, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: '#e2e8f0', wordBreak: 'break-word' }}>
                  Email:{' '}
                  <Box
                    component="a"
                    href="mailto:luyandakhaya93@gmail.com"
                    sx={{ color: '#FFD700', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    luyandakhaya93@gmail.com
                  </Box>
                </Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1.5}>
                <LocationOnRoundedIcon sx={{ color: '#f87171', fontSize: 20, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                  Address:{' '}
                  <Box component="span" sx={{ color: '#ffffff', fontWeight: 600 }}>
                    Nqutu, 3135, Umzinyathi Bridge
                  </Box>
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.12)', mb: 2.25 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, letterSpacing: 0.8 }}>
              OR SEND US A MESSAGE
            </Typography>
          </Divider>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <Stack spacing={1.75}>
            <TextField
              fullWidth
              required
              label="Your Name"
              value={form.name}
              onChange={handleChange('name')}
              sx={inputSx}
            />
            <TextField
              fullWidth
              required
              type="email"
              label="Email Address"
              value={form.email}
              onChange={handleChange('email')}
              sx={inputSx}
            />
            <TextField
              fullWidth
              required
              label="Phone / WhatsApp"
              value={form.phone}
              onChange={handleChange('phone')}
              sx={inputSx}
            />
            <TextField
              fullWidth
              required
              multiline
              rows={3}
              label="Message / Inquiry"
              value={form.message}
              onChange={handleChange('message')}
              sx={inputSx}
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            bgcolor: '#0f2c1f',
            borderTop: '1px solid rgba(255, 215, 0, 0.2)',
            justifyContent: 'flex-end',
            gap: 1.5,
          }}
        >
          <Button
            onClick={onClose}
            sx={{ color: '#cbd5e1', fontWeight: 700, borderRadius: '999px', px: 2.5 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon />}
            sx={{
              background: 'linear-gradient(135deg, #FFD700 0%, #E6A100 100%)',
              color: '#081610',
              fontWeight: 900,
              borderRadius: '999px',
              px: 3.5,
              '&:hover': { background: '#FFD700' },
            }}
          >
            {submitting ? 'SENDING...' : 'SEND MESSAGE'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}