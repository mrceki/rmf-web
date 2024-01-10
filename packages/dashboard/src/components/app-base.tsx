import { Alert, AlertProps, CssBaseline, GlobalStyles, Snackbar } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { rmfDark, rmfDarkLeaflet, rmfLight } from 'react-components';
import { loadSettings, saveSettings, Settings, ThemeMode } from '../settings';
import { AppController, AppControllerContext, SettingsContext } from './app-contexts';
import AppBar from './appbar';
import { AlertStore } from './alert-store';

const DefaultAlertDuration = 2000;
/**
 * Contains various components that are essential to the app and provides contexts to control them.
 * Components include:
 *
 * - Settings
 * - Alerts
 *
 * Also provides `AppControllerContext` to allow children components to control them.
 */
export function AppBase({ children }: React.PropsWithChildren<{}>): JSX.Element | null {
  const [settings, setSettings] = React.useState(() => loadSettings());
  const [showAlert, setShowAlert] = React.useState(false);
  const [alertSeverity, setAlertSeverity] = React.useState<AlertProps['severity']>('error');
  const [alertMessage, setAlertMessage] = React.useState('');
  const [alertDuration, setAlertDuration] = React.useState(DefaultAlertDuration);
  const [extraAppbarIcons, setExtraAppbarIcons] = React.useState<React.ReactNode>(null);

  const theme = React.useMemo(() => {
    switch (settings.themeMode) {
      case ThemeMode.RmfDark:
        return rmfDark;
      default:
        return rmfLight;
    }
  }, [settings.themeMode]);

  const updateSettings = React.useCallback((newSettings: Settings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  const appController = React.useMemo<AppController>(
    () => ({
      updateSettings,
      showAlert: (severity, message, autoHideDuration) => {
        setAlertSeverity(severity);
        setAlertMessage(message);
        setShowAlert(true);
        setAlertDuration(autoHideDuration || DefaultAlertDuration);
      },
      setExtraAppbarIcons,
    }),
    [updateSettings],
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {settings.themeMode === ThemeMode.RmfDark && <GlobalStyles styles={rmfDarkLeaflet} />}
      <SettingsContext.Provider value={settings}>
        <AppControllerContext.Provider value={appController}>
          <AlertStore />
          {/* {lowResolutionAlert && lowResolutionDisplayAlert()} */}
          <div className="divAppBase">
            <AppBar extraToolbarItems={extraAppbarIcons} />
            <div className="children">{children}</div>
            <Snackbar
              open={showAlert}
              message={alertMessage}
              onClose={() => setShowAlert(false)}
              autoHideDuration={alertDuration}
            >
              <Alert
                onClose={() => setShowAlert(false)}
                severity={alertSeverity}
                sx={{ width: '100%' }}
              >
                {alertMessage}
              </Alert>
            </Snackbar>
          </div>
        </AppControllerContext.Provider>
      </SettingsContext.Provider>
    </ThemeProvider>
  );
}
