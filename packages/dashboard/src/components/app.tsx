import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import React from 'react';
import 'react-grid-layout/css/styles.css';
import { Route, Routes, Navigate } from 'react-router-dom';
import { LoginPage, PrivateRoute } from 'rmf-auth';
import appConfig from '../app-config';
import ResourceManager from '../managers/resource-manager';
import { useNavigate } from 'react-router-dom';
import {
  AdminRoute,
  DoorsRoute,
  DashboardRoute,
  LoginRoute,
  RobotsRoute,
  TasksRoute,
  LiftsRoute,
  LogsRoute,
} from '../util/url';
import { AdminRouter } from './admin';
import { AppBase } from './app-base';
import { ResourcesContext } from './app-contexts';
import './app.css';
import { dashboardWorkspace } from './dashboard';
import { RmfApp } from './rmf-app';
import { robotsWorkspace } from './robots/robots-workspace';
import { tasksWorkspace } from './tasks/tasks-workspace';
import { ManagedWorkspace, Workspace } from './workspace';
import { doorsWorkspace } from './doors/doors-workspace';
import { liftsWorkspace } from './lifts/lifts-workspace';
import { logsWorkspace } from './logs/logs-workspace';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from '../locales/en.json';
import trTranslation from '../locales/tr.json';

const LoadingScreen: React.FC = () => (
  <div className="loading-screen">
    <div className="loader">
      <p>Loading... Redirecting to the Altınay Fleet Management </p>
    </div>
  </div>
);

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    tr: { translation: trTranslation },
  },
  lng: 'tr',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default function App(): JSX.Element | null {
  const authenticator = appConfig.authenticator;
  const [authInitialized, setAuthInitialized] = React.useState(!!appConfig.authenticator.user);
  const [user, setUser] = React.useState<string | null>(authenticator.user || null);
  const resourceManager = React.useRef<ResourceManager | undefined>(undefined);
  const [appReady, setAppReady] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [userLoggedin, setuserLoggedin] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    let cancel = false;
    const onUserChanged = (newUser: string | null) => setUser(newUser);
    (async () => {
      await authenticator.init();
      if (cancel) {
        return;
      }
      setUser(authenticator.user || null);
      setAuthInitialized(true);
    })();

    return () => {
      cancel = true;
      authenticator.off('userChanged', onUserChanged);
    };
  }, [authenticator]);

  React.useEffect(() => {
    (async () => {
      const appResources = await appConfig.appResourcesFactory();
      if (!appResources) {
        setAppReady(true);
      } else {
        resourceManager.current = appResources;
        setAppReady(true);
      }
    })();
  }, []);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  const userLogin = () => {
    setuserLoggedin(true);
    navigate(DashboardRoute);
  };

  const loginRedirect = React.useMemo(() => <Navigate to={LoginRoute} />, []);

  return authInitialized && appReady ? (
    <ResourcesContext.Provider value={resourceManager.current}>
      {user ? (
        <RmfApp>
          <AppBase>
            <Routes>
              <Route
                path={DashboardRoute}
                element={
                  <PrivateRoute unauthorizedComponent={loginRedirect} user={user}>
                    <Workspace key="dashboard" state={dashboardWorkspace} />
                  </PrivateRoute>
                }
              />
              <Route
                path={RobotsRoute}
                element={
                  <PrivateRoute unauthorizedComponent={loginRedirect} user={user}>
                    <Workspace key="robots" state={robotsWorkspace} />
                  </PrivateRoute>
                }
              />
              <Route
                path={TasksRoute}
                element={
                  <PrivateRoute unauthorizedComponent={loginRedirect} user={user}>
                    <Workspace key="tasks" state={tasksWorkspace} />
                  </PrivateRoute>
                }
              />
              <Route
                path={DoorsRoute}
                element={
                  <PrivateRoute unauthorizedComponent={loginRedirect} user={user}>
                    <Workspace key="doors" state={doorsWorkspace} />
                  </PrivateRoute>
                }
              />
              <Route
                path={LiftsRoute}
                element={
                  <PrivateRoute unauthorizedComponent={loginRedirect} user={user}>
                    <Workspace key="lifts" state={liftsWorkspace} />
                  </PrivateRoute>
                }
              />
              <Route
                path={LogsRoute}
                element={
                  <PrivateRoute unauthorizedComponent={loginRedirect} user={user}>
                    <Workspace key="logs" state={logsWorkspace} />
                  </PrivateRoute>
                }
              />
              <Route
                path={AdminRoute}
                element={
                  <PrivateRoute unauthorizedComponent={loginRedirect} user={user}>
                    <AdminRouter />
                  </PrivateRoute>
                }
              />
            </Routes>
          </AppBase>
        </RmfApp>
      ) : (
        <Routes>
          <Route
            path={LoginRoute}
            element={
              <LoginPage
                title={'Altınay Fleet Management'}
                logo="assets/altınay.png"
                onLoginClick={() => userLogin()}
              />
            }
          />
          <Route path="*" element={<Navigate to={LoginRoute} />} />
        </Routes>
      )}
    </ResourcesContext.Provider>
  ) : null;
}
