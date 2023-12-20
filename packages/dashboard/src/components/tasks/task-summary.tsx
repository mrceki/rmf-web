import React from 'react';
import {
  Box,
  Button,
  LinearProgress,
  LinearProgressProps,
  Theme,
  Typography,
  Divider,
  TextField,
  IconButton,
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import CloseIcon from '@mui/icons-material/Close';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { makeStyles, createStyles } from '@mui/styles';
import { Status, TaskState } from 'api-client';
import { base } from 'react-components';
import { TaskInspector } from './task-inspector';
import { RmfAppContext } from '../rmf-app';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    textField: {
      background: theme.palette.background.default,
      borderRadius: '20px',
    },
    taskText: {
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    },
    summaryDiv: {
      backgroundColor: theme.palette.mode === 'dark' ? '#597276' : '#ecece7',
    },
    inspectButton: {
      borderRadius: '20px',
      backgroundColor: theme.palette.mode === 'dark' ? '#739BD0' : '#739BD0',
    },
    inspectText: {
      color: '#ffffff',
    },
  }),
);

const LinearProgressWithLabel = (props: LinearProgressProps & { value: number }) => {
  return (
    <Box component="div" sx={{ display: 'flex', alignItems: 'center' }}>
      <Box component="div" sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box component="div" sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{`${Math.round(
          props.value,
        )}%`}</Typography>
      </Box>
    </Box>
  );
};

export interface TaskSummaryProps {
  onClose: () => void;
  task: TaskState | null;
}

export const TaskSummary = React.memo((props: TaskSummaryProps) => {
  const classes = useStyles();
  const rmf = React.useContext(RmfAppContext);

  const { onClose, task } = props;

  const [openTaskDetailsLogs, setOpenTaskDetailsLogs] = React.useState(false);
  const [taskState, setTaskState] = React.useState<TaskState | null>(null);
  const [isOpen, setIsOpen] = React.useState(true);

  const taskProgress = React.useMemo(() => {
    if (
      !taskState ||
      !taskState.estimate_millis ||
      !taskState.unix_millis_start_time ||
      !taskState.unix_millis_finish_time
    ) {
      console.log(`Can't calculate task progress`);
      return undefined;
    }

    return Math.min(
      1.0 -
        taskState.estimate_millis /
          (taskState.unix_millis_finish_time - taskState.unix_millis_start_time),
      1,
    );
  }, [taskState]);

  React.useEffect(() => {
    if (!rmf || !task) {
      return;
    }
    const sub = rmf
      .getTaskStateObs(task.booking.id)
      .subscribe((subscribedTask) => setTaskState(subscribedTask));
    return () => sub.unsubscribe();
  }, [rmf, task]);

  const getTaskPhaseDetails = (task: TaskState) => {
    if (!task.phases || !task.active) {
      return 'Failed to retrieve current task phase';
    }

    const message = Object.values(task.phases)[task.active - 1]?.detail;

    if (message) {
      return message;
    }

    const categoryString = Object.values(task.phases)[task.active - 1]?.category
      ? ` category ${Object.values(task.phases)[task.active - 1].category}`
      : '';

    return `Failed to retrieve current task phase details of id ${task.booking.id}${categoryString}`;
  };

  const returnDialogContent = () => {
    const contents = [
      {
        title: 'ID',
        value: taskState ? taskState.booking.id : 'Invalid task state.',
      },
      {
        title: 'Current phase',
        value: taskState ? getTaskPhaseDetails(taskState) : 'Invalid task state.',
      },
    ];

    return (
      <>
        {contents.map((message, index) => (
          <div key={index}>
            <Typography variant="body2" fontWeight="bold" ml={1}>
              {message.title}
            </Typography>
            <TextField
              id="standard-size-small"
              size="small"
              variant="outlined"
              InputProps={{ readOnly: true, className: classes.textField }}
              fullWidth={true}
              multiline
              maxRows={4}
              margin="dense"
              value={message.value}
            />
          </div>
        ))}
      </>
    );
  };

  return (
    <Dialog
      PaperProps={{
        className: classes.summaryDiv,
        style: {
          boxShadow: 'none',
          borderRadius: '20px',
          padding: '30px',
        },
      }}
      open={isOpen}
      onClose={() => {
        setIsOpen(false);
        onClose();
      }}
      fullWidth
      maxWidth="sm"
    >
      <span className="spanDiv">
        <DialogTitle align="center" className={classes.taskText}>
          Task Summary
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
      </span>
      {taskState?.status === 'underway' || taskState?.status === 'completed' ? (
        <DialogTitle align="center" className={classes.taskText}>
          <span>Task Status : {taskState?.status}</span>
        </DialogTitle>
      ) : (
        <></>
      )}
      {taskProgress && (
        <Box component="div" sx={{ width: '90%', ml: 3 }}>
          <LinearProgressWithLabel value={taskProgress * 100} />
        </Box>
      )}
      <DialogContent>{returnDialogContent()}</DialogContent>
      <DialogActions sx={{ justifyContent: 'center' }}>
        <Button
          size="medium"
          className={classes.inspectButton}
          variant="contained"
          onClick={() => setOpenTaskDetailsLogs(true)}
          autoFocus
        >
          <span className={classes.inspectText}>Inspect Task</span>
        </Button>
      </DialogActions>
      {openTaskDetailsLogs && (
        <TaskInspector task={taskState} onClose={() => setOpenTaskDetailsLogs(false)} />
      )}
    </Dialog>
  );
});
