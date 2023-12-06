import {
  AccountCircle,
  AddOutlined,
  Help,
  Notifications,
  Report,
  Warning as Issue,
  ModeNightOutlined,
  ModeNight,
  AlignHorizontalCenter,
  PlaylistAddOutlined,
  MapOutlined,
  SmartToyOutlined,
  SensorDoorOutlined,
} from '@mui/icons-material';
import {
  Badge,
  Button,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ApiServerModelsTortoiseModelsAlertsAlertLeaf as Alert,
  TaskFavoritePydantic as TaskFavorite,
  TaskRequest,
} from 'api-client';
import React from 'react';
import {
  AppBarTab,
  CreateTaskForm,
  CreateTaskFormProps,
  HeaderBar,
  LogoButton,
  NavigationBar,
  rmfDark,
  rmfLight,
  useAsync,
} from 'react-components';
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

export type TabValue = 'infrastructure' | 'robots' | 'tasks' | 'doors' | 'admin' | 'lifts';

const locationToTabValue = (pathname: string): TabValue | undefined => {
  const routes: { prefix: string; tabValue: TabValue }[] = [
    { prefix: RobotsRoute, tabValue: 'robots' },
    { prefix: TasksRoute, tabValue: 'tasks' },
    { prefix: DoorsRoute, tabValue: 'doors' },
    { prefix: LiftsRoute, tabValue: 'lifts' },
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
  return (
    <FormControl>
      <FormLabel id="theme-label">Theme</FormLabel>
      <RadioGroup row aria-labelledby="theme-label">
        <FormControlLabel
          value={ThemeMode.Default}
          control={<Radio />}
          label="Light Mode"
          checked={settings.themeMode === ThemeMode.RmfLight}
          onChange={() =>
            appController.updateSettings({ ...settings, themeMode: ThemeMode.RmfLight })
          }
        />
        <FormControlLabel
          value={ThemeMode.RmfDark}
          control={<Radio />}
          label="Dark Mode"
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

  const curTheme = React.useContext(SettingsContext).themeMode;
  const { waypointNames, pickupPoints, dropoffPoints, cleaningZoneNames } =
    useCreateTaskFormData(rmf);
  const username = useGetUsername(rmf);

  async function handleLogout(): Promise<void> {
    try {
      await authenticator.logout();
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

    const subs: Subscription[] = [];
    subs.push(
      AppEvents.refreshAlert.subscribe({
        next: () => {
          (async () => {
            const resp = await rmf.alertsApi.getAlertsAlertsGet();
            const alerts = resp.data as Alert[];
            setUnacknowledgedAlertsNum(
              alerts.filter(
                (alert) => !(alert.acknowledged_by && alert.unix_millis_acknowledged_time),
              ).length,
            );
          })();
        },
      }),
    );

    // Get the initial number of unacknowledged alerts
    (async () => {
      const resp = await rmf.alertsApi.getAlertsAlertsGet();
      const alerts = resp.data as Alert[];
      setUnacknowledgedAlertsNum(
        alerts.filter((alert) => !(alert.acknowledged_by && alert.unix_millis_acknowledged_time))
          .length,
      );
    })();
    return () => subs.forEach((s) => s.unsubscribe());
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
      <LogoButton src={brandingIconPath} alt="logo" sx={{ width: logoSize, marginTop: '8px' }} />
      <div className="navProps">
        <div className="buttonTab">
          <MapOutlined fontSize="large" />
          <AppBarTab
            label="Map Management"
            value="infrastructure"
            aria-label="Map"
            onTabClick={() => navigate(DashboardRoute)}
          />
        </div>
        <div className="buttonTab">
          <SmartToyOutlined fontSize="large" />
          <AppBarTab
            label="Robots and Tasks"
            value="robots"
            aria-label="Robots"
            onTabClick={() => navigate(RobotsRoute)}
          />
        </div>
        <div className="buttonTab">
          <SensorDoorOutlined fontSize="large" />
          <AppBarTab
            label="Doors and Lifts"
            value="doors"
            aria-label="Doors"
            onTabClick={() => navigate(DoorsRoute)}
          />
        </div>
        <div className="buttonNewTask">
          <PlaylistAddOutlined fontSize="large" />
          <AppBarTab
            label="New Task"
            value="newTask"
            aria-label="NewTask"
            onTabClick={() => setOpenCreateTaskForm(true)}
          />
        </div>
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
                No unacknowledged alerts
              </Typography>
            </MenuItem>
          ) : (
            unacknowledgedAlertList.map((alert) => (
              <Tooltip
                key={alert.id}
                title={
                  <React.Fragment>
                    <Typography>Alert</Typography>
                    <Typography>ID: {alert.original_id}</Typography>
                    <Typography>Type: {alert.category.toUpperCase()}</Typography>
                    <Typography>
                      Created: {new Date(alert.unix_millis_created_time).toLocaleString()}
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
      </div>
      {/* <Typography variant="caption">Altınay Robot Teknolojileri</Typography> */}
      {extraToolbarItems}
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
            showAlert('success', 'Successfully created task');
          }}
          onFail={(e) => {
            showAlert('error', `Failed to create task: ${e.message}`);
          }}
          onSuccessFavoriteTask={(message) => {
            showAlert('success', message);
          }}
          onFailFavoriteTask={(e) => {
            showAlert('error', `Failed to create or delete favorite task: ${e.message}`);
          }}
          onSuccessScheduling={() => {
            setOpenCreateTaskForm(false);
            showAlert('success', 'Successfully created schedule');
          }}
          onFailScheduling={(e) => {
            showAlert('error', `Failed to submit schedule: ${e.message}`);
          }}
        />
      )}
    </div>
  );
});

export default AppBar;
