import {
  Notifications,
  Report,
  ModeNightOutlined,
  ModeNight,
  PlaylistAddOutlined,
  MapOutlined,
  SmartToyOutlined,
  SensorDoorOutlined,
  TaskAlt,
  AccountCircle,
} from '@mui/icons-material';
import {
  Badge,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ApiServerModelsTortoiseModelsAlertsAlertLeaf as Alert,
  TaskFavoritePydantic as TaskFavorite,
  TaskRequest,
} from 'api-client';
import React, { useState } from 'react';
import { CreateTaskForm, CreateTaskFormProps, LogoButton, useAsync } from 'react-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProfileContext } from 'rmf-auth';
import { logoSize } from '../managers/resource-manager';
import { ThemeMode } from '../settings';
import {
  AdminRoute,
  DashboardRoute,
  DoorsRoute,
  LiftsRoute,
  RobotsRoute,
  TasksRoute,
  LogsRoute,
  LoginRoute,
} from '../util/url';
import {
  AppConfigContext,
  AppControllerContext,
  ResourcesContext,
  SettingsContext,
} from './app-contexts';
import { AppEvents } from './app-events';
import { RmfAppContext } from './rmf-app';
import { parseTasksFile } from './tasks/utils';
import { Subscription } from 'rxjs';
import { formatDistance } from 'date-fns';
import { useCreateTaskFormData } from '../hooks/useCreateTaskForm';
import { toApiSchedule } from './tasks/utils';
import useGetUsername from '../hooks/useFetchUser';
import CustomButton from './CustomButtonComponent';
import AppBarTab from './CustomAppBarTab';
import { useMediaQuery } from 'react-responsive';
import logo from '../assets/logoTablet.png';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './languageSwitch';

export type TabValue = 'infrastructure' | 'robots' | 'tasks' | 'doors' | 'admin' | 'lifts' | 'logs';

const locationToTabValue = (pathname: string): TabValue | undefined => {
  const routes: { prefix: string; tabValue: TabValue }[] = [
    { prefix: RobotsRoute, tabValue: 'robots' },
    { prefix: TasksRoute, tabValue: 'tasks' },
    { prefix: DoorsRoute, tabValue: 'doors' },
    { prefix: LiftsRoute, tabValue: 'lifts' },
    { prefix: LogsRoute, tabValue: 'logs' },
    { prefix: AdminRoute.replace(/\*/g, ''), tabValue: 'admin' },
    { prefix: DashboardRoute, tabValue: 'infrastructure' },
  ];

  // `DashboardRoute` being the root, it is a prefix to all routes, so we need to check exactly.
  const matchingRoute = routes.find((route) => pathname.startsWith(route.prefix));
  return matchingRoute?.tabValue;
};

function AppSettings() {
  const settings = React.useContext(SettingsContext);
  const appController = React.useContext(AppControllerContext);
  const { t } = useTranslation();
  return (
    <FormControl>
      <FormLabel id="theme-label">{t('theme')}</FormLabel>
      <RadioGroup row aria-labelledby="theme-label">
        <FormControlLabel
          value={ThemeMode.Default}
          control={<Radio />}
          label={t('lightMode')}
          checked={settings.themeMode === ThemeMode.RmfLight}
          onChange={() =>
            appController.updateSettings({ ...settings, themeMode: ThemeMode.RmfLight })
          }
        />
        <FormControlLabel
          value={ThemeMode.RmfDark}
          control={<Radio />}
          label={t('darkMode')}
          checked={settings.themeMode === ThemeMode.RmfDark}
          onChange={() =>
            appController.updateSettings({ ...settings, themeMode: ThemeMode.RmfDark })
          }
        />
      </RadioGroup>
    </FormControl>
  );
}

export interface AppBarProps {
  extraToolbarItems?: React.ReactNode;

  // TODO: change the alarm status to required when we have an alarm
  // service working properly in the backend
  alarmState?: boolean | null;
}
const ALERT_FETCH_INTERVAL_MS = 1000;

export const AppBar = React.memo(({ extraToolbarItems }: AppBarProps): React.ReactElement => {
  const rmf = React.useContext(RmfAppContext);
  const resourceManager = React.useContext(ResourcesContext);
  const { showAlert } = React.useContext(AppControllerContext);
  const navigate = useNavigate();
  const location = useLocation();
  const tabValue = React.useMemo(() => locationToTabValue(location.pathname), [location]);
  const logoResourcesContext = React.useContext(ResourcesContext)?.logos;
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const { authenticator } = React.useContext(AppConfigContext);
  const profile = React.useContext(UserProfileContext);
  const safeAsync = useAsync();
  const [brandingIconPath, setBrandingIconPath] = React.useState<string>('');
  const [settingsAnchor, setSettingsAnchor] = React.useState<HTMLElement | null>(null);
  const [openCreateTaskForm, setOpenCreateTaskForm] = React.useState(false);
  const [favoritesTasks, setFavoritesTasks] = React.useState<TaskFavorite[]>([]);
  const [refreshTaskAppCount, setRefreshTaskAppCount] = React.useState(0);
  const [alertListAnchor, setAlertListAnchor] = React.useState<HTMLElement | null>(null);
  const [unacknowledgedAlertsNum, setUnacknowledgedAlertsNum] = React.useState(0);
  const [unacknowledgedAlertList, setUnacknowledgedAlertList] = React.useState<Alert[]>([]);
  const isTablet = useMediaQuery({ query: '(max-width: 1224px) and (min-height: 500px)' });

  const [activeButton, setActiveButton] = useState('/');

  const curTheme = React.useContext(SettingsContext).themeMode;
  const { t } = useTranslation();
  const AppBarTabs = [
    {
      id: '/',
      setActiveButton: { setActiveButton },
      activeButton: { activeButton },
      color: curTheme === 2 ? '#597276' : '#ecece7',
      onClick: () => navigate(DashboardRoute),
      radius: '20px',
      // height: '50px',
      // width: '200px',
      border: 'none',
      title: t('map'),
      property: ['1rem', '0rem', '#000000de'],
      icon: <MapOutlined sx={{ color: curTheme === 2 ? '#ffffff' : '#000000' }} fontSize="large" />,
    },
    {
      id: '/robots',
      setActiveButton: { setActiveButton },
      activeButton: { activeButton },
      color: curTheme === 2 ? '#597276' : '#ecece7',
      onClick: () => navigate(RobotsRoute),
      radius: '20px',
      // height: '50px',
      // width: '200px',
      border: 'none',
      title: t('robotsandTasks'),
      property: ['0.5rem', '0rem', '#000000de'],
      icon: (
        <SmartToyOutlined sx={{ color: curTheme === 2 ? '#ffffff' : '#000000' }} fontSize="large" />
      ),
    },
    {
      id: '/doors',
      setActiveButton: { setActiveButton },
      activeButton: { activeButton },
      color: curTheme === 2 ? '#597276' : '#ecece7',
      onClick: () => navigate(DoorsRoute),
      radius: '20px',
      // height: '50px',
      // width: '200px',
      border: 'none',
      title: t('doorsandLifts'),
      property: ['0.5rem', '0rem', '#000000de'],
      icon: (
        <SensorDoorOutlined
          sx={{ color: curTheme === 2 ? '#ffffff' : '#000000' }}
          fontSize="large"
        />
      ),
    },
    {
      id: '/logs',
      setActiveButton: { setActiveButton },
      activeButton: { activeButton },
      color: curTheme === 2 ? '#597276' : '#ecece7',
      onClick: () => navigate(LogsRoute),
      radius: '20px',
      // height: '50px',
      // width: '200px',
      border: 'none',
      title: t('history'),
      property: ['0.5rem', '0rem', '#000000de'],
      icon: <TaskAlt sx={{ color: curTheme === 2 ? '#ffffff' : '#000000' }} fontSize="large" />,
    },
  ];

  React.useEffect(() => {
    switch (tabValue) {
      case 'infrastructure':
        setActiveButton('/');
        break;
      case 'robots':
        setActiveButton('/robots');
        break;
      case 'tasks':
        setActiveButton('/tasks');
        break;
      case 'doors':
        setActiveButton('/doors');
        break;
      case 'logs':
        setActiveButton('/logs');
        break;
    }
  }, [tabValue]);

  const { waypointNames, pickupPoints, dropoffPoints, cleaningZoneNames } =
    useCreateTaskFormData(rmf);
  const username = useGetUsername(rmf);

  async function handleLogout(): Promise<void> {
    try {
      // await authenticator.logout();
      window.location.reload();
      navigate(LoginRoute);
    } catch (e) {
      console.error(`error logging out: ${(e as Error).message}`);
    }
  }

  React.useEffect(() => {
    const sub = AppEvents.refreshTaskApp.subscribe({
      next: () => setRefreshTaskAppCount((oldValue) => ++oldValue),
    });
    return () => sub.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (!logoResourcesContext) return;
    (async () => {
      setBrandingIconPath(await safeAsync(logoResourcesContext.getHeaderLogoPath(curTheme)));
    })();
  }, [logoResourcesContext, safeAsync, curTheme]);

  React.useEffect(() => {
    if (!rmf) {
      return;
    }

    const fetchAlerts = async () => {
      const { data: alerts } = await rmf.alertsApi.getAlertsAlertsGet();
      setUnacknowledgedAlertsNum(
        alerts.filter((alert) => !(alert.acknowledged_by && alert.unix_millis_acknowledged_time))
          .length,
      );
    };

    fetchAlerts();

    const intervalId = setInterval(fetchAlerts, ALERT_FETCH_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [rmf]);

  const submitTasks = React.useCallback<Required<CreateTaskFormProps>['submitTasks']>(
    async (taskRequests, schedule) => {
      if (!rmf) {
        throw new Error('tasks api not available');
      }
      if (!schedule) {
        await Promise.all(
          taskRequests.map((request) =>
            rmf.tasksApi.postDispatchTaskTasksDispatchTaskPost({
              type: 'dispatch_task_request',
              request,
            }),
          ),
        );
      } else {
        const scheduleRequests = taskRequests.map((req) => toApiSchedule(req, schedule));
        await Promise.all(
          scheduleRequests.map((req) => rmf.tasksApi.postScheduledTaskScheduledTasksPost(req)),
        );
      }
      AppEvents.refreshTaskApp.next();
    },
    [rmf],
  );

  const uploadFileInputRef = React.useRef<HTMLInputElement>(null);
  const tasksFromFile = (): Promise<TaskRequest[]> => {
    return new Promise((res) => {
      const fileInputEl = uploadFileInputRef.current;
      if (!fileInputEl) {
        return [];
      }
      let taskFiles: TaskRequest[];
      const listener = async () => {
        try {
          if (!fileInputEl.files || fileInputEl.files.length === 0) {
            return res([]);
          }
          try {
            taskFiles = parseTasksFile(await fileInputEl.files[0].text());
          } catch (err) {
            showAlert('error', (err as Error).message, 5000);
            return res([]);
          }
          // only submit tasks when all tasks are error free
          return res(taskFiles);
        } finally {
          fileInputEl.removeEventListener('input', listener);
          fileInputEl.value = '';
        }
      };
      fileInputEl.addEventListener('input', listener);
      fileInputEl.click();
    });
  };

  //#region 'Favorite Task'
  React.useEffect(() => {
    if (!rmf) {
      return;
    }
    (async () => {
      const resp = await rmf.tasksApi.getFavoritesTasksFavoriteTasksGet();

      const results = resp.data as TaskFavorite[];
      setFavoritesTasks(results);
    })();

    return () => {
      setFavoritesTasks([]);
    };
  }, [rmf, refreshTaskAppCount]);

  const submitFavoriteTask = React.useCallback<Required<CreateTaskFormProps>['submitFavoriteTask']>(
    async (taskFavoriteRequest) => {
      if (!rmf) {
        throw new Error('tasks api not available');
      }
      await rmf.tasksApi.postFavoriteTaskFavoriteTasksPost(taskFavoriteRequest);
      AppEvents.refreshTaskApp.next();
    },
    [rmf],
  );

  const deleteFavoriteTask = React.useCallback<Required<CreateTaskFormProps>['deleteFavoriteTask']>(
    async (favoriteTask) => {
      if (!rmf) {
        throw new Error('tasks api not available');
      }
      if (!favoriteTask.id) {
        throw new Error('Id is needed');
      }

      await rmf.tasksApi.deleteFavoriteTaskFavoriteTasksFavoriteTaskIdDelete(favoriteTask.id);
      AppEvents.refreshTaskApp.next();
    },
    [rmf],
  );
  //#endregion 'Favorite Task'

  const handleOpenAlertList = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (!rmf) {
      return;
    }
    (async () => {
      const { data: alerts } = await rmf.alertsApi.getAlertsAlertsGet();
      const unackList = alerts.filter(
        (alert) => !alert.acknowledged_by && !alert.unix_millis_acknowledged_time,
      );
      setUnacknowledgedAlertList(unackList.reverse());
    })();
    setAlertListAnchor(event.currentTarget);
  };
  const openAlertDialog = (alert: Alert) => {
    AppEvents.alertListOpenedAlert.next(alert);
  };

  const timeDistance = (time: number) => {
    return formatDistance(new Date(), new Date(time));
  };

  return (
    <div className="sideBar">
      <div className="navProps">
        {isTablet ? (
          <img
            src={logo}
            alt="logo"
            style={{ marginTop: '8px' }}
            onClick={() => navigate(DashboardRoute)}
          />
        ) : (
          <LogoButton
            src={brandingIconPath}
            alt="logo"
            sx={{ width: logoSize, marginTop: '8px' }}
            onClick={() => navigate(DashboardRoute)}
          />
        )}
        <CustomButton
          color={curTheme === 2 ? '#2B3C43' : '#CE172D'}
          onClick={() => setOpenCreateTaskForm(true)}
          radius="30px"
          border="none"
          title={t('newTask')}
          property={['1rem', '1rem', '#ffffff']}
        >
          {curTheme === 2 ? (
            <PlaylistAddOutlined sx={{ color: '#ffffff' }} fontSize="large" />
          ) : (
            <PlaylistAddOutlined sx={{ color: '#ffffff' }} fontSize="large" />
          )}
        </CustomButton>
        {AppBarTabs.map((tab) => (
          <AppBarTab
            key={tab.id}
            id={tab.id}
            setActiveButton={setActiveButton}
            activeButton={activeButton}
            color={tab.color}
            onClick={tab.onClick}
            radius={tab.radius}
            // height={tab.height}
            // width={tab.width}
            border={tab.border}
            title={tab.title}
            property={tab.property}
          >
            {tab.icon}
          </AppBarTab>
        ))}
        <LanguageSwitcher />
      </div>
      <div className="bottomDiv">
        <IconButton
          id="alert-list-button"
          aria-label="alert-list-button"
          color="inherit"
          onClick={handleOpenAlertList}
        >
          <Badge badgeContent={unacknowledgedAlertsNum}>
            <Notifications />
          </Badge>
        </IconButton>
        <Menu
          anchorEl={alertListAnchor}
          open={!!alertListAnchor}
          onClose={() => setAlertListAnchor(null)}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            style: {
              maxHeight: '20rem',
              maxWidth: '30rem',
            },
          }}
        >
          {unacknowledgedAlertList.length === 0 ? (
            <MenuItem dense disabled>
              <Typography variant="body2" noWrap>
                {t('noUnackALert')}
              </Typography>
            </MenuItem>
          ) : (
            unacknowledgedAlertList.map((alert) => (
              <Tooltip
                key={alert.id}
                title={
                  <React.Fragment>
                    <Typography>{t('alert')}</Typography>
                    <Typography>
                      {t('id')} {alert.original_id}
                    </Typography>
                    <Typography>
                      {t('alertType')} {alert.category.toUpperCase()}
                    </Typography>
                    <Typography>
                      {t('alertCreated')}{' '}
                      {new Date(alert.unix_millis_created_time).toLocaleString()}
                    </Typography>
                  </React.Fragment>
                }
                placement="right"
              >
                <MenuItem
                  dense
                  onClick={() => {
                    openAlertDialog(alert);
                    setAlertListAnchor(null);
                  }}
                  divider
                >
                  <Report />
                  <Typography variant="body2" mx={1} noWrap>
                    Task {alert.original_id} had an alert{' '}
                    {timeDistance(alert.unix_millis_created_time)} ago
                  </Typography>
                </MenuItem>
              </Tooltip>
            ))
          )}
        </Menu>
        <IconButton
          id="show-settings-btn"
          aria-label="settings"
          color="inherit"
          onClick={(ev) => setSettingsAnchor(ev.currentTarget)}
        >
          {curTheme === 2 ? <ModeNight /> : <ModeNightOutlined />}
        </IconButton>
        {/* {profile && (
          <>
            <Tooltip title="Profile">
              <IconButton
                id="user-btn"
                aria-label={'user-btn'}
                color="inherit"
                onClick={(event) => setAnchorEl(event.currentTarget)}
              >
                <AccountCircle />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={!!anchorEl}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem id="logout-btn" onClick={handleLogout}>
                Logout
              </MenuItem>
            </Menu>
          </>
        )} */}
      </div>
      {/* <Typography variant="caption">Altınay Robot Teknolojileri</Typography> */}
      {extraToolbarItems}

      <Menu
        anchorEl={settingsAnchor}
        open={!!settingsAnchor}
        onClose={() => setSettingsAnchor(null)}
      >
        <CardContent>
          <AppSettings />
        </CardContent>
      </Menu>
      {openCreateTaskForm && (
        <CreateTaskForm
          user={username ? username : 'unknown user'}
          patrolWaypoints={waypointNames}
          cleaningZones={cleaningZoneNames}
          pickupPoints={pickupPoints}
          dropoffPoints={dropoffPoints}
          favoritesTasks={favoritesTasks}
          open={openCreateTaskForm}
          onClose={() => setOpenCreateTaskForm(false)}
          submitTasks={submitTasks}
          submitFavoriteTask={submitFavoriteTask}
          deleteFavoriteTask={deleteFavoriteTask}
          tasksFromFile={tasksFromFile}
          onSuccess={() => {
            setOpenCreateTaskForm(false);
            showAlert('success', t('succesfullyCreated'));
          }}
          onFail={(e) => {
            showAlert('error', `${t('failedTaskCreation')} ${e.message}`);
          }}
          onSuccessFavoriteTask={(message) => {
            showAlert('success', message);
          }}
          onFailFavoriteTask={(e) => {
            showAlert('error', `${t('failedtoDeleteFavTask')} ${e.message}`);
          }}
          onSuccessScheduling={() => {
            setOpenCreateTaskForm(false);
            showAlert('success', t('succesfulCreateSchedule'));
          }}
          onFailScheduling={(e) => {
            showAlert('error', `${t('failedToSubmitSchedule')} ${e.message}`);
          }}
        />
      )}
    </div>
  );
});

export default AppBar;
