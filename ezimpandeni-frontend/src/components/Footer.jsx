import React from 'react';
import { Box, Container, Grid, Typography, Link, Divider, Stack } from '@mui/material';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import FacebookRoundedIcon from '@mui/icons-material/FacebookRounded';
import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';

const assetModules = import.meta.glob('../assets/*', { eager: true });
const logoEntry = Object.entries(assetModules).find(([path]) =>
  path.toLowerCase().includes('logo')
);
const logoImg = logoEntry?.[1]?.default || '';

export default function Footer({ onOpenContact, onNavigate }) {
  const handleNav = (e, page) => {
    e.preventDefault();
    if (onNavigate) onNavigate(page);
  };

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        bgcolor: 'rgba(6, 18, 13, 0.94)',
        backdropFilter: 'blur(18px)',
        borderTop: '1px solid rgba(255, 215, 0, 0.22)',
        color: '#e0e8e3',
        pt: 6,
        pb: 3,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="flex-start">
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1.75} alignItems="center" mb={1.5}>
              {logoImg && (
                <Box
                  component="img"
                  src={logoImg}
                  alt="Ezimpandeni Resort Logo"
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #FFD700',
                    boxShadow: '0 0 14px rgba(255, 215, 0, 0.35)',
                  }}
                />
              )}
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight={900}
                  letterSpacing={1.2}
                  sx={{ color: '#FFD700', lineHeight: 1.2 }}
                >
                  EZIMPANDENI RESORT
                </Typography>
                <Typography variant="caption" sx={{ color: '#9eb3a7' }}>
                  Outdoor Garden & Event Venue
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" sx={{ color: '#b7c9be', lineHeight: 1.7, maxWidth: 320, mb: 2 }}>
              Peaceful nature gardens, family day picnics, photoshoots, weddings, and large outdoor events at Umzinyathi Bridge.
            </Typography>

            <Stack direction="row" spacing={1.25} alignItems="flex-start">
              <AccessTimeRoundedIcon sx={{ color: '#FFD700', fontSize: 19, mt: 0.2 }} />
              <Box>
                <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 700 }}>
                  Working Hours
                </Typography>
                <Typography variant="body2" sx={{ color: '#d4e2da' }}>
                  Monday – Sunday: 08:00 – 18:00
                </Typography>
                <Typography variant="caption" sx={{ color: '#81c784', fontWeight: 700 }}>
                  Open on Public Holidays
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography
              variant="subtitle2"
              fontWeight={800}
              letterSpacing={1.5}
              sx={{ color: '#FFD700', mb: 2, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 0.75 }}
            >
              <ExploreRoundedIcon fontSize="small" /> Quick Links
            </Typography>
            <Stack spacing={1}>
              <Link
                href="#home"
                underline="none"
                onClick={(e) => handleNav(e, 'home')}
                sx={{ color: '#d4e2da', fontSize: '0.92rem', '&:hover': { color: '#FFD700' } }}
              >
                Home
              </Link>
              <Link
                href="#packages"
                underline="none"
                onClick={(e) => handleNav(e, 'packages')}
                sx={{ color: '#d4e2da', fontSize: '0.92rem', '&:hover': { color: '#FFD700' } }}
              >
                Packages & Pricing
              </Link>
              <Link
                href="#gallery"
                underline="none"
                onClick={(e) => handleNav(e, 'gallery')}
                sx={{ color: '#d4e2da', fontSize: '0.92rem', '&:hover': { color: '#FFD700' } }}
              >
                Gallery
              </Link>
              <Link
                href="#contact"
                underline="none"
                onClick={(e) => {
                  e.preventDefault();
                  if (onOpenContact) onOpenContact();
                }}
                sx={{ color: '#d4e2da', fontSize: '0.92rem', '&:hover': { color: '#FFD700' } }}
              >
                Contact & Enquiries
              </Link>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography
              variant="subtitle2"
              fontWeight={800}
              letterSpacing={1.5}
              sx={{ color: '#FFD700', mb: 2, textTransform: 'uppercase' }}
            >
              Contact & Location
            </Typography>
            <Stack spacing={1.4}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <PhoneRoundedIcon sx={{ color: '#FFD700', fontSize: 19 }} />
                <Typography variant="body2" sx={{ color: '#e2eee7' }}>
                  083 954 5203
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.25} alignItems="center">
                <WhatsAppIcon sx={{ color: '#25D366', fontSize: 19 }} />
                <Link
                  href="https://wa.me/27839545203"
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="hover"
                  sx={{ color: '#e2eee7', fontSize: '0.875rem', '&:hover': { color: '#25D366' } }}
                >
                  WhatsApp Direct (+27 83 954 5203)
                </Link>
              </Stack>

              <Stack direction="row" spacing={1.25} alignItems="center">
                <EmailRoundedIcon sx={{ color: '#FFD700', fontSize: 19 }} />
                <Link
                  href="mailto:luyandakhaya93@gmail.com"
                  underline="hover"
                  sx={{ color: '#e2eee7', fontSize: '0.875rem', '&:hover': { color: '#FFD700' } }}
                >
                  luyandakhaya93@gmail.com
                </Link>
              </Stack>

              <Stack direction="row" spacing={1.25} alignItems="flex-start">
                <LocationOnRoundedIcon sx={{ color: '#FFD700', fontSize: 19, mt: 0.15 }} />
                <Typography variant="body2" sx={{ color: '#b7c9be' }}>
                  Umzinyathi Bridge, Nqutu, 3135, KZN
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.25} alignItems="center">
                <FacebookRoundedIcon sx={{ color: '#4ea8ff', fontSize: 19 }} />
                <Typography variant="body2" sx={{ color: '#e2eee7' }}>
                  Ezimpandeni Resort
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', my: 3.5 }} />

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1}
        >
          <Typography variant="caption" sx={{ color: '#94aba0' }}>
            © {new Date().getFullYear()} Ezimpandeni Resort. All rights reserved.
          </Typography>
          <Typography variant="caption" sx={{ color: '#94aba0' }}>
            Open Mon–Sun (08:00–18:00) & Public Holidays • Nqutu, KZN
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}