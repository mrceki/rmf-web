import { createTheme } from '@mui/material/styles';
import commonTheme from './common-theme';

export const base = createTheme({
  //Light Grey, Cultured, Silver Sand
  palette: {
    ...commonTheme,
    mode: 'light',
    primary: {
      main: '#8EACCD', // mini maps background
      light: '#ECEFF1',
      dark: '#B0BEC5',
    },
    background: {
      //Cultured, White
      default: '#D7E5CA', // main background
      paper: '#FFFFFF',
    },
    secondary: {
      main: '#FFFFFF',
    },
  },
});

export const rmfLight = createTheme({
  ...base,
  components: {
    MuiTableCell: {
      styleOverrides: {
        stickyHeader: {
          backgroundColor: base.palette.primary.main,
        },
      },
    },
  },
});
