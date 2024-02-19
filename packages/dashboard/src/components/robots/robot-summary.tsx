import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  LinearProgressProps,
  TextField,
  Theme,
  Typography,
  IconButton,
} from '@mui/material';
import { makeStyles, createStyles } from '@mui/styles';
import React from 'react';
import { RmfAppContext } from '../rmf-app';
import { RobotTableData } from 'react-components';
import { RobotState, Status2, TaskState } from 'api-client';
import { EMPTY, combineLatest, mergeMap, of } from 'rxjs';
import { TaskInspector } from '../tasks/task-inspector';
import {
  Battery0Bar,
  Battery1Bar,
  Battery2Bar,
  Battery3Bar,
  Battery4Bar,
  Battery5Bar,
  Battery6Bar,
  BatteryFull,
  BatteryChargingFull,
  BatteryUnknown,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    textField: {
      background: theme.palette.background.default,
      borderRadius: '20px',
    },
    robotText: {
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    },
    summaryDiv: {
      backgroundColor: theme.palette.mode === 'dark' ? '#597276' : '#ecece7',
    },
    inspectButton: {
      borderRadius: '20px',
      backgroundColor: theme.palette.mode === 'dark' ? '#739BD0' : '#CE172D',
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

interface RobotSummaryProps {
  onClose: () => void;
  robot: RobotTableData;
}

const showBatteryIcon = (robot: RobotState, robotBattery: number) => {
  if (robot.status === Status2.Charging) {
    return <BatteryChargingFull />;
  }

  const batteryIcons: Record<number, JSX.Element> = {
    0: <Battery0Bar />,
    16: <Battery1Bar />,
    32: <Battery2Bar />,
    48: <Battery3Bar />,
    64: <Battery4Bar />,
    80: <Battery5Bar />,
    96: <Battery6Bar />,
    100: <BatteryFull />,
  };

  for (const level in batteryIcons) {
    if (robotBattery >= parseInt(level)) {
      continue;
    } else {
      return batteryIcons[level];
    }
  }
  return <BatteryUnknown />;
};
//define string array to store all destinations
export const allDestinations: string[] = [];
export const RobotSummary = React.memo(({ onClose, robot }: RobotSummaryProps) => {
  const classes = useStyles();
  const rmf = React.useContext(RmfAppContext);
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(true);
  const [robotState, setRobotState] = React.useState<RobotState | null>(null);
  const [taskState, setTaskState] = React.useState<TaskState | null>(null);
  const [openTaskDetailsLogs, setOpenTaskDetailsLogs] = React.useState(false);
  const [navigationStart, setNavigationStart] = React.useState<string | null>(null);
  const [navigationDestination, setNavigationDestination] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!rmf) {
      return;
    }
    const sub = rmf
      .getFleetStateObs(robot.fleet)
      .pipe(
        mergeMap((fleetState) => {
          const robotState = fleetState?.robots?.[robot.name];
          const taskObs = robotState?.task_id ? rmf.getTaskStateObs(robotState.task_id) : of(null);
          return robotState ? combineLatest([of(robotState), taskObs]) : EMPTY;
        }),
      )
      .subscribe(([robotState, taskState]) => {
        setRobotState(robotState);
        setTaskState(taskState);
      });
    return () => sub.unsubscribe();
  }, [rmf, robot.fleet, robot.name]);

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
    if (!taskState || !taskState.phases || !taskState.active) {
      setNavigationStart(null);
      setNavigationDestination(null);
      return;
    }

    const message = Object.values(taskState.phases)[taskState.active - 1]?.detail;

    if (message) {
      const regex = /\[place:(.*?)\]/g;

      let match;
      const waypoints = [];

      // Iterate over all matches found by the regular expression
      while ((match = regex.exec(message.toString()))) {
        waypoints.push(match[1]);
      }

      setNavigationStart(waypoints[-1]);
      setNavigationDestination(waypoints[0]);
    } else {
      setNavigationStart('-');
      setNavigationDestination('-');
      console.error("Failed to retrieve robot's current navigation start and destination.");
    }
  }, [taskState]);

  React.useEffect(() => {
    if (!taskState || !taskState.phases || !taskState.active) {
      return;
    }

    const robotLastLocation = Object.values(taskState.phases)[taskState.active - 1]?.events?.[0]
      .name;

    if (robotLastLocation) {
      const regex = /\[place:(.*?)\]/g;

      let match;
      const waypoints = [];

      // Iterate over all matches found by the regular expression
      while ((match = regex.exec(robotLastLocation.toString()))) {
        waypoints.push(match[1]);
      }

      if (!allDestinations.includes(waypoints[0])) {
        allDestinations.push(waypoints[0]);
      }
    }
  }, [taskState]);

  const returnDialogContent = () => {
    const contents = [
      {
        title: t('assignedTasks'),
        value: taskState ? taskState.booking.id : 'No task',
      },
      {
        title: t('estFinishTime'),
        value: taskState?.unix_millis_finish_time
          ? `${new Date(taskState?.unix_millis_finish_time).toLocaleString()}`
          : '-',
      },
      {
        title: t('status'),
        value: robotState?.status ? robotState?.status : '-',
      },
    ];

    if (taskState) {
      contents.push({
        title: t('robotDestinations'),
        value: navigationDestination ? navigationDestination : '-',
      });
    }
    if (!taskState?.active) {
      contents.push({
        title: t('robotLastLocation'),
        value: allDestinations[allDestinations.length - 1]
          ? allDestinations[allDestinations.length - 1]
          : '-',
      });
    }

    return (
      <>
        {contents.map((message, index) => (
          <div key={index}>
            <Typography variant="body2" fontWeight="bold" ml={1}>
              {message.title}
            </Typography>
            <TextField
              id="standard-size-small"
              size="medium"
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
      <div className="robotDiv">
        <span className="robotBat">
          <Typography variant="subtitle1">{`${
            robotState?.battery ? (robotState.battery * 100).toFixed(0) : 0
          }%`}</Typography>
          {robotState && (
            <>{showBatteryIcon(robot, robotState.battery ? robotState?.battery * 100 : 0)}</>
          )}
        </span>
        <span className="dialogTitle">
          <DialogTitle align="center" className={classes.robotText}>
            {t('robotSummary')} {robotState?.name}
          </DialogTitle>
        </span>
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
      <Divider />
      {taskProgress && (
        <>
          <Typography variant="body2" fontWeight="bold" ml={3} mt={1}>
            Task progress
          </Typography>
          <Box component="div" sx={{ width: '95%', ml: 3 }}>
            <LinearProgressWithLabel value={taskProgress * 100} />
          </Box>
        </>
      )}
      <DialogContent>{returnDialogContent()}</DialogContent>
      {robotState?.status === 'idle' ||
      robotState?.status === 'error' ||
      robotState?.status === 'shutdown' ? (
        <></>
      ) : (
        <DialogActions sx={{ justifyContent: 'center' }}>
          <Button
            size="medium"
            className={classes.inspectButton}
            onClick={() => setOpenTaskDetailsLogs(true)}
            autoFocus
            disabled={taskState === null}
          >
            <span className={classes.inspectText}>Inspect Task</span>
          </Button>
        </DialogActions>
      )}
      {openTaskDetailsLogs && taskState && (
        <TaskInspector task={taskState} onClose={() => setOpenTaskDetailsLogs(false)} />
      )}
    </Dialog>
  );
});
