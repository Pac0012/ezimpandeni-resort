import React from 'react';
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

export default function Navbar({ onOpenInclusions, onOpenContact, onOpenAdmin, onScrollToPackages }) {
  return (
    <AppBar position="sticky" sx={{ backgroundColor: '#1b4332', elevation: 4 }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Box display="flex" alignItems="center" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={onScrollToPackages}>
            <WbSunnyIcon sx={{ mr: 1, color: '#d4a373' }} />
            <Typography variant="h6" fontWeight={700} letterSpacing=".1rem" color="#ffffff">
              EZIMPANDENI RESORT
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button color="inherit" onClick={onScrollToPackages}>Packages</Button>
            <Button color="inherit" onClick={onOpenInclusions}>Inclusions</Button>
            <Button color="inherit" onClick={onOpenContact}>Contact Us</Button>
            <Button 
              variant="outlined" 
              size="small"
              onClick={onOpenAdmin}
              sx={{ color: '#d4a373', borderColor: '#d4a373', ml: 1, '&:hover': { borderColor: '#ffffff', color: '#ffffff' } }}
            >
              Staff Portal
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}