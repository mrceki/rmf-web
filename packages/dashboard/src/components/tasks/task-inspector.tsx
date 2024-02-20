import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogProps,
  DialogTitle,
  Divider,
  Grid,
  Typography,
  styled,
} from '@mui/material';
import { CardContent, useTheme } from '@mui/material';
import { TaskEventLog, TaskState } from 'api-client';
import React from 'react';
import { AppControllerContext } from '../app-contexts';
import { AppEvents } from '../app-events';
import { RmfAppContext } from '../rmf-app';
import { TaskInfo } from 'react-components';
import { UserProfileContext } from 'rmf-auth';
import { Enforcer } from '../permissions';
import { TaskLogs } from './task-logs';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';

export interface TableDataGridState {
  task: TaskState | null;
  onClose: () => void;
}
const classes = {
  inspectForm: 'create-task-form',
};

const StyledDialog = styled((props: DialogProps) => <Dialog {...props} />)(({ theme }) => ({
  [`& .${classes.inspectForm}`]: {
    '& > *': {
      background: theme.palette.mode === 'dark' ? '#2B3C43' : '#ecece7',
    },
  },
}));

export function TaskInspector({ task, onClose }: TableDataGridState): JSX.Element {
  const theme = useTheme();
  const rmf = React.useContext(RmfAppContext);
  const appController = React.useContext(AppControllerContext);

  const [taskState, setTaskState] = React.useState<TaskState | null>(null);
  const [taskLogs, setTaskLogs] = React.useState<TaskEventLog | null>(null);
  const [isOpen, setIsOpen] = React.useState(true);
  const { t } = useTranslation();
  React.useEffect(() => {
    if (!rmf || !task) {
      setTaskState(null);
      setTaskLogs(null);
      return;
    }
    const sub = rmf.getTaskStateObs(task.booking.id).subscribe((subscribedTask) => {
      (async () => {
        try {
          const logs = (
            await rmf.tasksApi.getTaskLogTasksTaskIdLogGet(
              subscribedTask.booking.id,
              `0,${Number.MAX_SAFE_INTEGER}`,
            )
          ).data;
          setTaskLogs(logs);
        } catch {
          console.log(`Failed to fetch task logs for ${subscribedTask.booking.id}`);
          setTaskLogs(null);
        }
        setTaskState(subscribedTask);
      })();
    });
    return () => sub.unsubscribe();
  }, [rmf, task]);

  const profile = React.useContext(UserProfileContext);
  const cancelUserProfile = profile?.user.username || 'unknown user';

  const taskCancellable =
    taskState &&
    profile &&
    Enforcer.canCancelTask(profile) &&
    taskState.status &&
    !['canceled', 'killed', 'completed', 'failed'].includes(taskState.status);

  const handleCancelTaskClick = React.useCallback<React.MouseEventHandler>(async () => {
    if (!taskState) {
      return;
    }
    try {
      if (!rmf) {
        throw new Error('tasks api not available');
      }
      await rmf.tasksApi?.postCancelTaskTasksCancelTaskPost({
        type: 'cancel_task_request',
        task_id: taskState.booking.id,
      });
      appController.showAlert('success', 'Successfully cancelled task');
      AppEvents.taskSelect.next(null);
    } catch (e) {
      appController.showAlert('error', `Failed to cancel task: ${(e as Error).message}`);
    }
  }, [appController, taskState, rmf]);

  return (
    <>
      <Grid container wrap="nowrap" direction="column" height="100%">
        <StyledDialog
          PaperProps={{
            className: classes.inspectForm,
          }}
          open={isOpen}
          onClose={() => {
            setIsOpen(false);
            onClose();
          }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          fullWidth
          maxWidth="md"
        >
          <Grid container spacing={2}>
            <Grid
              item
              xs={12}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingRight: '20px',
              }}
            >
              <DialogTitle id="scroll-dialog-title">
                {t('task')} {task?.booking.id}
              </DialogTitle>
              <div>
                <IconButton
                  className="closeButton"
                  aria-label="close"
                  onClick={() => {
                    setIsOpen(false);
                    onClose();
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </div>
            </Grid>
          </Grid>
          <DialogContent style={{ height: 700 }} dividers={true}>
            <Box component="div" sx={{ position: 'relative' }}>
              <Grid container direction="row" wrap="nowrap" height="100%">
                <Grid item xs={6}>
                  {taskState ? (
                    <>
                      <CardContent sx={{ overflow: 'auto' }}>
                        <TaskInfo task={taskState} title={t('details')} />
                      </CardContent>
                      <Grid
                        item
                        paddingLeft={2}
                        paddingRight={2}
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        {taskState.status === 'completed' ? (
                          <Typography
                            variant="body2"
                            align="center"
                            fontWeight="bold"
                            fontSize="medium"
                            sx={{
                              color: theme.palette.mode === 'dark' ? '#ffffff' : '#CE172D',
                            }}
                          >
                            {t('taskHasBeenCompleted')}
                          </Typography>
                        ) : (
                          <Button
                            style={{
                              marginTop: theme.spacing(1),
                              marginBottom: theme.spacing(1),
                              backgroundColor:
                                theme.palette.mode === 'dark' ? '#739BD0' : '#CE172D',
                              borderRadius: '20px',
                              width: '200px',
                            }}
                            fullWidth
                            variant="contained"
                            color="secondary"
                            aria-label="Cancel Task"
                            disabled={!taskCancellable}
                            onClick={handleCancelTaskClick}
                          >
                            <Typography
                              sx={{
                                color: theme.palette.mode === 'dark' ? '#ffffff' : '#ffffff',
                              }}
                            >
                              {taskState.status === 'canceled' ? 'Task Canceled' : 'Cancel Task'}
                            </Typography>
                          </Button>
                        )}
                        {taskState.status === 'canceled' && (
                          <Typography
                            variant="body2"
                            align="center"
                            fontWeight="bold"
                            fontSize="medium"
                            sx={{
                              color: theme.palette.mode === 'dark' ? '#ffffff' : '#FF2400',
                            }}
                          >
                            Task has been canceled by {cancelUserProfile}
                          </Typography>
                        )}
                      </Grid>
                    </>
                  ) : (
                    <Grid container wrap="nowrap" alignItems="center" style={{ height: '100%' }}>
                      <CardContent>
                        <Typography variant="h6" align="center">
                          Click on a task to view more information
                        </Typography>
                      </CardContent>
                    </Grid>
                  )}
                </Grid>
                <Divider
                  orientation="vertical"
                  flexItem
                  style={{ marginLeft: theme.spacing(2), marginRight: theme.spacing(2) }}
                />
                <Grid item xs={6}>
                  <CardContent>
                    <TaskLogs taskLog={taskLogs} taskState={taskState} title="Logs" />
                  </CardContent>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
        </StyledDialog>
      </Grid>
    </>
  );
}
