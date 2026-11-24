import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1B4D3E', // Tropical Forest Green
      light: '#388E3C',
      dark: '#0A291C',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#D4A373', // Warm Sand / Gold
      light: '#FAEDCD',
      dark: '#A37244',
    },
    background: {
      default: '#F4F7F4',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#1B4D3E',
    },
  },
});

export default theme;