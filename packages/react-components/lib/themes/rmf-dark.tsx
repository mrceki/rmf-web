import { createTheme } from '@mui/material/styles';
import commonTheme from './common-theme';

const base = createTheme({
  palette: {
    mode: 'dark',
    ...commonTheme,
    primary: {
      //Charcoal, Rich Black Fogra 29, Cadet
      main: '#37474F',
      dark: '#edeae8',
      light: '#62727B',
    },
    background: {
      //Rich Black Fogra 29, Cadet
      default: '#323232',
      paper: '#7f6c68',
    },
    secondary: {
      main: '#3874c7',
    },
  },
});

export const rmfDark = createTheme(
  {
    components: {
      MuiTableCell: {
        styleOverrides: {
          stickyHeader: {
            backgroundColor: base.palette.primary.main,
          },
        },
      },
    },
  },
  base,
);

/**
 * Leaflet theme for RmfDark, use with material's `GlobalStyles` or other css injectors.
 *
 * Example:
 *   <GlobalStyles styles={rmfDarkLeaflet} />
 */
export const rmfDarkLeaflet = {
  '.leaflet-control-zoom a': {
    color: base.palette.text.primary,
    backgroundColor: base.palette.background.paper,
  },
  '.leaflet-control-layers': {
    color: base.palette.text.primary,
    backgroundColor: base.palette.background.paper,
  },
  '.leaflet-control-layers .MuiSlider-root': {
    color: base.palette.text.primary,
  },
  '.leaflet-control-layers .MuiInputBase-input': {
    color: base.palette.text.primary,
  },
  '.leaflet-pane img': {
    filter:
      'invert(90%) sepia(20%) saturate(120%) hue-rotate(180deg) brightness(95%) contrast(80%)',
  },
};
