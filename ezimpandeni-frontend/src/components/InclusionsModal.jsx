import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
  Stack,
  IconButton,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SpaRoundedIcon from '@mui/icons-material/SpaRounded';

const PROVIDED_ITEMS = [
  'Outdoor Garden Access',
  '1 Multipurpose Changing Room',
  'Clean Toilets & Restrooms',
  'Running Tap Water',
  'Built-in Braai Stands',
];

const GUEST_REQUIREMENTS = [
  'Sound Systems / Speakers',
  'Tables, Chairs & Tents',
  'Event Decor & Lighting',
  'Food & Catering Equipment',
  'Photographers (Photoshoots)',
];

export default function InclusionsModal({ open, onClose, onBookNow }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#0b1e15',
          color: '#ffffff',
          borderRadius: 4,
          border: '1px solid rgba(255, 215, 0, 0.35)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7)',
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
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <SpaRoundedIcon sx={{ color: '#FFD700', fontSize: 24 }} />
          <Typography
            variant="h6"
            sx={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 800,
              color: '#FFD700',
              fontSize: { xs: '1.15rem', sm: '1.3rem' },
            }}
          >
            Ezimpandeni Resort Standard Inclusions
          </Typography>
        </Stack>

        <IconButton onClick={onClose} sx={{ color: '#cbd5e1', '&:hover': { color: '#FFD700' } }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2.25, sm: 3 } }}>
        <Typography variant="body2" sx={{ color: '#cbd5e1', mb: 2.5 }}>
          Know what comes ready at the resort and what to bring along for a smooth, stress-free visit.
        </Typography>

        <Grid container spacing={2.5}>
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: '100%',
                p: 2.5,
                borderRadius: 3,
                bgcolor: 'rgba(22, 66, 45, 0.55)',
                border: '1px solid rgba(74, 222, 128, 0.45)',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <CheckCircleRoundedIcon sx={{ color: '#4ade80', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem' }}>
                  What We Provide
                </Typography>
              </Stack>

              <Stack spacing={1.1}>
                {PROVIDED_ITEMS.map((text) => (
                  <Stack key={text} direction="row" alignItems="center" spacing={1.25}>
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        bgcolor: '#4ade80',
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                      {text}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: '100%',
                p: 2.5,
                borderRadius: 3,
                bgcolor: 'rgba(84, 48, 16, 0.42)',
                border: '1px solid rgba(251, 146, 60, 0.45)',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <CancelRoundedIcon sx={{ color: '#fb923c', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem' }}>
                  Guest Requirements
                </Typography>
              </Stack>

              <Stack spacing={1.1}>
                {GUEST_REQUIREMENTS.map((text) => (
                  <Stack key={text} direction="row" alignItems="center" spacing={1.25}>
                    <Box
                      sx={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        bgcolor: '#fb923c',
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: '#f1f5f9', fontWeight: 500 }}>
                      {text}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          bgcolor: '#0f2c1f',
          borderTop: '1px solid rgba(255, 215, 0, 0.2)',
          justifyContent: 'space-between',
        }}
      >
        {onBookNow ? (
          <Button
            variant="outlined"
            onClick={onBookNow}
            sx={{
              borderColor: 'rgba(255, 215, 0, 0.65)',
              color: '#FFD700',
              fontWeight: 700,
              borderRadius: '999px',
              px: 2.5,
              '&:hover': { bgcolor: 'rgba(255, 215, 0, 0.12)', borderColor: '#FFD700' },
            }}
          >
            Explore Packages
          </Button>
        ) : (
          <Box />
        )}

        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            background: 'linear-gradient(135deg, #FFD700 0%, #E6A100 100%)',
            color: '#081610',
            fontWeight: 900,
            borderRadius: '999px',
            px: 3.5,
            '&:hover': { background: '#FFD700' },
          }}
        >
          GOT IT
        </Button>
      </DialogActions>
    </Dialog>
  );
}