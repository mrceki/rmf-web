import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlaylistAddOutlined from '@mui/icons-material/PlaylistAddOutlined';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  TableContainer,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { TaskState } from 'api-client';
import React from 'react';
import {
  FilterFields,
  MuiMouseEvent,
  SortFields,
  TaskDataGridTable,
  CreateTaskForm,
  Tasks,
  Window,
  CreateTaskFormProps,
} from 'react-components';
import { useNavigate } from 'react-router-dom';
import { Subscription } from 'rxjs';
import { AppEvents } from '../app-events';
import { MicroAppProps } from '../micro-app';
import { RmfAppContext } from '../rmf-app';
import { TaskSchedule } from './task-schedule';
import { TaskSummary } from './task-summary';
import { downloadCsvFull, downloadCsvMinimal } from './utils';
import useGetUsername from '../../hooks/useFetchUser';
import { useCreateTaskFormData } from '../../hooks/useCreateTaskForm';
import { TaskFavoritePydantic as TaskFavorite, TaskRequest } from 'api-client';
import { toApiSchedule, parseTasksFile } from '../tasks/utils';
import { AppControllerContext } from '../app-contexts';
import { useTranslation } from 'react-i18next';

const RefreshTaskQueueTableInterval = 5000;

enum TaskTablePanel {
  QueueTable = 0,
  Schedule = 1,
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  selectedTabIndex: number;
}

function tabId(index: number): string {
  return `simple-tab-${index}`;
}

function tabPanelId(index: number): string {
  return `simple-tabpanel-${index}`;
}

function TabPanel(props: TabPanelProps) {
  const { children, selectedTabIndex, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={selectedTabIndex !== index}
      id={tabPanelId(index)}
      aria-labelledby={tabId(index)}
      {...other}
    >
      {selectedTabIndex === index && (
        <Box component="div" sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const TasksApp = React.memo(
  React.forwardRef(
    (
      { onClose, children, ...otherProps }: React.PropsWithChildren<MicroAppProps>,
      ref: React.Ref<HTMLDivElement>,
    ) => {
      const rmf = React.useContext(RmfAppContext);
      const [autoRefresh, setAutoRefresh] = React.useState(true);
      const [refreshTaskAppCount, setRefreshTaskAppCount] = React.useState(0);
      const [openCreateTaskForm, setOpenCreateTaskForm] = React.useState(false);
      const username = useGetUsername(rmf);
      const { waypointNames, pickupPoints, dropoffPoints, cleaningZoneNames } =
        useCreateTaskFormData(rmf);
      const [favoritesTasks, setFavoritesTasks] = React.useState<TaskFavorite[]>([]);
      const { showAlert } = React.useContext(AppControllerContext);
      const navigate = useNavigate();
      const uploadFileInputRef = React.useRef<HTMLInputElement>(null);
      const [openTaskSummary, setOpenTaskSummary] = React.useState(false);
      const [selectedTask, setSelectedTask] = React.useState<TaskState | null>(null);
      const [tasksState, setTasksState] = React.useState<Tasks>({
        isLoading: true,
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      });
      const [filterFields, setFilterFields] = React.useState<FilterFields>({ model: undefined });
      const [sortFields, setSortFields] = React.useState<SortFields>({ model: undefined });
      const { t } = useTranslation();
      React.useEffect(() => {
        const sub = AppEvents.refreshTaskApp.subscribe({
          next: () => {
            setRefreshTaskAppCount((oldValue) => ++oldValue);
          },
        });
        return () => sub.unsubscribe();
      }, []);

      React.useEffect(() => {
        if (!autoRefresh) {
          return;
        }

        const refreshTaskQueueTable = async () => {
          AppEvents.refreshTaskApp.next();
        };
        const refreshInterval = window.setInterval(
          refreshTaskQueueTable,
          RefreshTaskQueueTableInterval,
        );
        return () => {
          clearInterval(refreshInterval);
        };
      }, [autoRefresh]);

      // TODO: parameterize this variable
      const GET_LIMIT = 5;
      React.useEffect(() => {
        if (!rmf) {
          return;
        }

        let filterColumn: string | undefined = undefined;
        let filterValue: string | undefined = undefined;
        if (filterFields.model && filterFields.model.items.length >= 1) {
          filterColumn = filterFields.model.items[0].columnField;
          filterValue = filterFields.model.items[0].value;

          const filterOperator: string | undefined = filterFields.model.items[0].operatorValue;
          if (
            (filterColumn === 'unix_millis_start_time' ||
              filterColumn === 'unix_millis_finish_time') &&
            filterValue
          ) {
            const selectedTime = new Date(filterValue);
            if (filterOperator && filterOperator === 'onOrBefore') {
              filterValue = `0,${selectedTime.getTime()}`;
            } else if (filterOperator && filterOperator === 'onOrAfter') {
              // Enforce an upper limit which is 24 hours ahead of the current time
              const now = new Date();
              const upperLimit = now.getTime() + 86400000;
              filterValue = `${selectedTime.getTime()},${upperLimit}`;
            }
          }
        }

        let orderBy: string = '-unix_millis_start_time';
        if (sortFields.model && sortFields.model.length >= 1) {
          orderBy =
            sortFields.model[0].sort === 'desc'
              ? '-' + sortFields.model[0].field
              : sortFields.model[0].field;
        }

        const subs: Subscription[] = [];
        (async () => {
          const resp = await rmf.tasksApi.queryTaskStatesTasksGet(
            filterColumn && filterColumn === 'id_' ? filterValue : undefined,
            filterColumn && filterColumn === 'category' ? filterValue : undefined,
            filterColumn && filterColumn === 'assigned_to' ? filterValue : undefined,
            filterColumn && filterColumn === 'status' ? filterValue : undefined,
            filterColumn && filterColumn === 'unix_millis_start_time' ? filterValue : undefined,
            filterColumn && filterColumn === 'unix_millis_finish_time' ? filterValue : undefined,
            GET_LIMIT,
            (tasksState.page - 1) * GET_LIMIT, // Datagrid component need to start in page 1. Otherwise works wrong
            orderBy,
            undefined,
          );
          const results = resp.data as TaskState[];
          const newTasks = results.slice(0, GET_LIMIT);

          setTasksState((old) => ({
            ...old,
            isLoading: false,
            data: newTasks,
            total:
              results.length === GET_LIMIT
                ? tasksState.page * GET_LIMIT + 1
                : tasksState.page * GET_LIMIT - 9,
          }));

          subs.push(
            ...newTasks.map((task) =>
              rmf
                .getTaskStateObs(task.booking.id)
                .subscribe((task) =>
                  setTasksState((prev) => ({ ...prev, [task.booking.id]: task })),
                ),
            ),
          );
        })();
        return () => subs.forEach((s) => s.unsubscribe());
      }, [rmf, refreshTaskAppCount, tasksState.page, filterFields.model, sortFields.model]);

      const getAllTasks = async (timestamp: Date) => {
        if (!rmf) {
          return [];
        }

        const resp = await rmf.tasksApi.queryTaskStatesTasksGet(
          undefined,
          undefined,
          undefined,
          undefined,
          `0,${timestamp.getTime()}`,
          undefined,
          undefined,
          undefined,
          '-unix_millis_start_time',
          undefined,
        );
        const allTasks = resp.data as TaskState[];
        return allTasks;
      };

      const exportTasksToCsv = async (minimal: boolean) => {
        const now = new Date();
        const allTasks = await getAllTasks(now);
        if (!allTasks || !allTasks.length) {
          return;
        }
        if (minimal) {
          downloadCsvMinimal(now, allTasks);
        } else {
          downloadCsvFull(now, allTasks);
        }
      };

      const [anchorExportElement, setAnchorExportElement] = React.useState<null | HTMLElement>(
        null,
      );
      const openExportMenu = Boolean(anchorExportElement);
      const handleClickExportMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorExportElement(event.currentTarget);
      };
      const handleCloseExportMenu = () => {
        setAnchorExportElement(null);
      };

      const [selectedPanelIndex, setSelectedPanelIndex] = React.useState(TaskTablePanel.QueueTable);

      const handlePanelChange = (_: React.SyntheticEvent, newSelectedTabIndex: number) => {
        setSelectedPanelIndex(newSelectedTabIndex);
        setAutoRefresh(newSelectedTabIndex === TaskTablePanel.QueueTable);
      };
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

      const submitFavoriteTask = React.useCallback<
        Required<CreateTaskFormProps>['submitFavoriteTask']
      >(
        async (taskFavoriteRequest) => {
          if (!rmf) {
            throw new Error('tasks api not available');
          }
          await rmf.tasksApi.postFavoriteTaskFavoriteTasksPost(taskFavoriteRequest);
          AppEvents.refreshTaskApp.next();
        },
        [rmf],
      );

      const deleteFavoriteTask = React.useCallback<
        Required<CreateTaskFormProps>['deleteFavoriteTask']
      >(
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

      return (
        <Window
          ref={ref}
          title="Tasks"
          onClose={onClose}
          toolbar={
            <Toolbar variant="dense">
              <div>
                <Tooltip title="New Task" color="inherit" placement="top">
                  <IconButton
                    onClick={() => {
                      setOpenCreateTaskForm(true);
                    }}
                    aria-label="NewTask"
                  >
                    <PlaylistAddOutlined sx={{ color: '#ffffff' }} fontSize="large" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download" placement="top">
                  <IconButton
                    id="export-button"
                    aria-controls={openExportMenu ? 'export-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={openExportMenu ? 'true' : undefined}
                    onClick={handleClickExportMenu}
                    color="inherit"
                  >
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Menu
                  id="export-menu"
                  MenuListProps={{
                    'aria-labelledby': 'export-button',
                  }}
                  anchorEl={anchorExportElement}
                  open={openExportMenu}
                  onClose={handleCloseExportMenu}
                >
                  <MenuItem
                    onClick={() => {
                      handleCloseExportMenu();
                      exportTasksToCsv(true);
                    }}
                    disableRipple
                  >
                    Export Minimal
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleCloseExportMenu();
                      exportTasksToCsv(false);
                    }}
                    disableRipple
                  >
                    Export Full
                  </MenuItem>
                </Menu>
              </div>
              <Tooltip title="Refresh" color="inherit" placement="top">
                <IconButton
                  onClick={() => {
                    AppEvents.refreshTaskApp.next();
                  }}
                  aria-label="Refresh"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Toolbar>
          }
          {...otherProps}
        >
          <Tabs value={selectedPanelIndex} onChange={handlePanelChange} aria-label="Task App Tabs">
            <Tab
              label={t('queue')}
              id={tabId(TaskTablePanel.QueueTable)}
              aria-controls={tabPanelId(TaskTablePanel.QueueTable)}
            />
            <Tab
              label={t('schedule')}
              id={tabId(TaskTablePanel.Schedule)}
              aria-controls={tabPanelId(TaskTablePanel.Schedule)}
            />
          </Tabs>
          <TabPanel selectedTabIndex={selectedPanelIndex} index={TaskTablePanel.QueueTable}>
            <TableContainer>
              <TaskDataGridTable
                tasks={tasksState}
                onTaskClick={(_: MuiMouseEvent, task: TaskState) => {
                  setSelectedTask(task);
                  setOpenTaskSummary(true);
                }}
                setFilterFields={setFilterFields}
                setSortFields={setSortFields}
                onPageChange={(newPage: number) =>
                  setTasksState((old: Tasks) => ({ ...old, page: newPage + 1 }))
                }
                onPageSizeChange={(newPageSize: number) =>
                  setTasksState((old: Tasks) => ({ ...old, pageSize: newPageSize }))
                }
              />
            </TableContainer>
          </TabPanel>
          <TabPanel selectedTabIndex={selectedPanelIndex} index={TaskTablePanel.Schedule}>
            <TaskSchedule />
          </TabPanel>
          <input type="file" style={{ display: 'none' }} ref={uploadFileInputRef} />
          {openTaskSummary && (
            <TaskSummary task={selectedTask} onClose={() => setOpenTaskSummary(false)} />
          )}
          {children}
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
        </Window>
      );
    },
  ),
);
