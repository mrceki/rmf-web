import UpdateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import Close from '@mui/icons-material/Close';
import PlaceOutlined from '@mui/icons-material/PlaceOutlined';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import ElectricCarIcon from '@mui/icons-material/ElectricCar';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import {
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Radio,
  RadioGroup,
  styled,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { DatePicker, TimePicker, DateTimePicker } from '@mui/x-date-pickers';
import type { TaskFavoritePydantic as TaskFavorite, TaskRequest } from 'api-client';
import React from 'react';
import { Loading } from '..';
import { ConfirmationDialog, ConfirmationDialogProps } from '../confirmation-dialog';
import { PositiveIntField } from '../form-inputs';
import { useTranslation } from 'react-i18next';

// A bunch of manually defined descriptions to avoid using `any`.
interface Payload {
  sku: string;
  quantity: number;
}

interface TaskPlace {
  place: string;
  handler: string;
  payload: Payload;
}

interface DeliveryTaskDescription {
  pickup: TaskPlace;
  dropoff: TaskPlace;
}

interface PatrolTaskDescription {
  places: string[];
  rounds: number;
}

interface CleanTaskDescription {
  zone: string;
}

type TaskDescription = DeliveryTaskDescription | PatrolTaskDescription | CleanTaskDescription;

const isNonEmptyString = (value: string): boolean => value.length > 0;
const isPositiveNumber = (value: number): boolean => value > 0;

const isTaskPlaceValid = (place: TaskPlace): boolean => {
  return (
    isNonEmptyString(place.place) &&
    isNonEmptyString(place.handler) &&
    isNonEmptyString(place.payload.sku) &&
    isPositiveNumber(place.payload.quantity)
  );
};

const isDeliveryTaskDescriptionValid = (taskDescription: DeliveryTaskDescription): boolean => {
  return isTaskPlaceValid(taskDescription.pickup) && isTaskPlaceValid(taskDescription.dropoff);
};

const isPatrolTaskDescriptionValid = (taskDescription: PatrolTaskDescription): boolean => {
  if (taskDescription.places.length === 0) {
    return false;
  }
  for (const place of taskDescription.places) {
    if (place.length === 0) {
      return false;
    }
  }
  return taskDescription.rounds > 0;
};

const isCleanTaskDescriptionValid = (taskDescription: CleanTaskDescription): boolean => {
  return taskDescription.zone.length !== 0;
};

const classes = {
  title: 'dialogue-info-value',
  taskList: 'create-task-task-list',
  selectedTask: 'create-task-selected-task',
  actionBtn: 'dialogue-action-button',
  createTaskForm: 'create-task-form',
  textField: 'create-task-text-field',
  divider: 'create-task-divider',
  div: 'create-task-div',
  placeHolder: 'create-task-placeholder',
  outsideDiv: 'create-task-outside-div',
  titleDiv: 'create-task-title-div',
  titleEndDiv: 'create-task-title-end-div',
  contentDiv: 'create-task-content-div',
  dateDiv: 'create-task-data-div',
  dialogContent: 'create-task-dialog-content',
  priority: 'create-task-priority',
};
const StyledDialog = styled((props: DialogProps) => <Dialog {...props} />)(({ theme }) => ({
  [`& .${classes.taskList}`]: {
    flex: '1 1 auto',
    minHeight: 400,
    maxHeight: '50vh',
    overflow: 'auto',
  },
  [`& .${classes.selectedTask}`]: {
    background: theme.palette.action.focus,
  },
  [`& .${classes.title}`]: {
    flex: '1 1 auto',
  },
  [`& .${classes.actionBtn}`]: {
    minWidth: 80,
    borderRadius: '20px',
    backgroundColor: theme.palette.mode === 'dark' ? '#739BD0' : '#CE172D',
    '&:hover': {
      transform: 'scale(1.05)',
      backgroundColor: theme.palette.mode === 'dark' ? '#739BD0' : '#CE172D',
    },
  },
  [`& .${classes.createTaskForm}`]: {
    background: theme.palette.mode === 'dark' ? '#2B3C43' : '#ecece7',
    borderRadius: '20px',
  },
  [`& .${classes.textField}`]: {
    display: 'flex',
    alignItems: 'center',
    flexdirection: 'row',
    borderRadius: '20px',
  },
  [`& .${classes.divider}`]: {
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    background: theme.palette.mode === 'dark' ? '#2B3C43' : '#ecece7',
  },
  [`& .${classes.div}`]: {
    display: 'flex',
    alignItems: 'center',
  },
  [`& .${classes.placeHolder}`]: {
    borderRadius: '20px',
  },
  [`& .${classes.outsideDiv}`]: {
    display: 'flex',
    flexDirection: 'column',
  },
  [`& .${classes.titleDiv}`]: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
  },
  [`& .${classes.titleEndDiv}`]: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  [`& .${classes.contentDiv}`]: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing(12),
    justifyContent: 'space-between',
  },
  [`& .${classes.dateDiv}`]: {
    display: 'flex',
    flexDirection: 'column',
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
  },
  [`& .${classes.priority}`]: {
    display: 'flex',
    flexDirection: 'column',
  },
}));

export function getShortDescription(taskRequest: TaskRequest): string {
  switch (taskRequest.category) {
    case 'clean': {
      return `[Clean] zone [${taskRequest.description.zone}]`;
    }
    case 'delivery': {
      return `[Delivery] from [${taskRequest.description.pickup.place}] to [${taskRequest.description.dropoff.place}]`;
    }
    case 'patrol': {
      const formattedPlaces = taskRequest.description.places.map((place: string) => `[${place}]`);
      return `[Patrol] [${taskRequest.description.rounds}] round/s, along ${formattedPlaces.join(
        ', ',
      )}`;
    }
    default:
      return `[Unknown] type "${taskRequest.category}"`;
  }
}

interface FormToolbarProps {
  onSelectFileClick?: React.MouseEventHandler<HTMLButtonElement>;
}

function FormToolbar({ onSelectFileClick }: FormToolbarProps) {
  const { t } = useTranslation();

  return (
    <Button
      aria-label="Select File"
      className={classes.actionBtn}
      variant="contained"
      onClick={onSelectFileClick}
    >
      <Typography
        variant="body2"
        fontWeight="bold"
        sx={{
          color: '#ffffff',
        }}
      >
        {t('selectFile')}
      </Typography>
    </Button>
  );
}

interface DeliveryTaskFormProps {
  taskDesc: DeliveryTaskDescription;
  pickupPoints: Record<string, string>;
  dropoffPoints: Record<string, string>;
  onChange(taskDesc: TaskDescription): void;
  allowSubmit(allow: boolean): void;
}

function DeliveryTaskForm({
  taskDesc,
  pickupPoints = {},
  dropoffPoints = {},
  onChange,
  allowSubmit,
}: DeliveryTaskFormProps) {
  const theme = useTheme();
  const onInputChange = (desc: DeliveryTaskDescription) => {
    allowSubmit(isDeliveryTaskDescriptionValid(desc));
    onChange(desc);
  };

  return (
    <Grid container spacing={theme.spacing(2)} justifyContent="center" alignItems="center">
      <Grid item xs={6}>
        <Autocomplete
          id="pickup-location"
          freeSolo
          fullWidth
          options={Object.keys(pickupPoints)}
          value={taskDesc.pickup.place}
          onChange={(_ev, newValue) => {
            const place = newValue ?? '';
            const handler =
              newValue !== null && pickupPoints[newValue] ? pickupPoints[newValue] : '';
            onInputChange({
              ...taskDesc,
              pickup: {
                ...taskDesc.pickup,
                place: place,
                handler: handler,
              },
            });
          }}
          onBlur={(ev) =>
            pickupPoints[(ev.target as HTMLInputElement).value] &&
            onInputChange({
              ...taskDesc,
              pickup: {
                ...taskDesc.pickup,
                place: (ev.target as HTMLInputElement).value,
                handler: pickupPoints[(ev.target as HTMLInputElement).value],
              },
            })
          }
          renderInput={(params) => (
            <TextField {...params} label="Pickup Location" required={true} />
          )}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          id="pickup_sku"
          fullWidth
          label="Pickup SKU"
          value={taskDesc.pickup.payload.sku}
          required
          onChange={(ev) => {
            onInputChange({
              ...taskDesc,
              pickup: {
                ...taskDesc.pickup,
                payload: {
                  ...taskDesc.pickup.payload,
                  sku: ev.target.value,
                },
              },
            });
          }}
        />
      </Grid>
      <Grid item xs={2}>
        <PositiveIntField
          id="pickup_quantity"
          label="Quantity"
          value={taskDesc.pickup.payload.quantity}
          onChange={(_ev, val) => {
            onInputChange({
              ...taskDesc,
              pickup: {
                ...taskDesc.pickup,
                payload: {
                  ...taskDesc.pickup.payload,
                  quantity: val,
                },
              },
            });
          }}
        />
      </Grid>
      <Grid item xs={6}>
        <Autocomplete
          id="dropoff-location"
          freeSolo
          fullWidth
          options={Object.keys(dropoffPoints)}
          value={taskDesc.dropoff.place}
          onChange={(_ev, newValue) => {
            const place = newValue ?? '';
            const handler =
              newValue !== null && dropoffPoints[newValue] ? dropoffPoints[newValue] : '';
            onInputChange({
              ...taskDesc,
              dropoff: {
                ...taskDesc.dropoff,
                place: place,
                handler: handler,
              },
            });
          }}
          onBlur={(ev) =>
            dropoffPoints[(ev.target as HTMLInputElement).value] &&
            onInputChange({
              ...taskDesc,
              dropoff: {
                ...taskDesc.dropoff,
                place: (ev.target as HTMLInputElement).value,
                handler: dropoffPoints[(ev.target as HTMLInputElement).value],
              },
            })
          }
          renderInput={(params) => (
            <TextField {...params} label="Dropoff Location" required={true} />
          )}
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          id="dropoff_sku"
          fullWidth
          label="Dropoff SKU"
          value={taskDesc.dropoff.payload.sku}
          required
          onChange={(ev) => {
            onInputChange({
              ...taskDesc,
              dropoff: {
                ...taskDesc.dropoff,
                payload: {
                  ...taskDesc.dropoff.payload,
                  sku: ev.target.value,
                },
              },
            });
          }}
        />
      </Grid>
      <Grid item xs={2}>
        <PositiveIntField
          id="dropoff_quantity"
          label="Quantity"
          value={taskDesc.dropoff.payload.quantity}
          onChange={(_ev, val) => {
            onInputChange({
              ...taskDesc,
              dropoff: {
                ...taskDesc.dropoff,
                payload: {
                  ...taskDesc.dropoff.payload,
                  quantity: val,
                },
              },
            });
          }}
        />
      </Grid>
    </Grid>
  );
}

interface PlaceListProps {
  places: string[];
  onClick(places_index: number): void;
}

function PlaceList({ places, onClick }: PlaceListProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <List
      dense
      sx={{
        bgcolor: theme.palette.mode === 'dark' ? '#2B3C43' : '#ecece7',
        marginLeft: theme.spacing(3),
        marginRight: theme.spacing(3),
      }}
    >
      {places.length === 0 ? (
        <ListItem>
          <ListItemText primary={t('noDestination')} />
        </ListItem>
      ) : (
        places.map((value, index) => (
          <ListItem
            key={`${value}-${index}`}
            secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => onClick(index)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemIcon>
              <PlaceOutlined />
            </ListItemIcon>
            <ListItemText primary={`${t('placeName')}   ${value}`} />
          </ListItem>
        ))
      )}
    </List>
  );
}

interface PatrolTaskFormProps {
  taskDesc: PatrolTaskDescription;
  patrolWaypoints: string[];
  onChange(patrolTaskDescription: PatrolTaskDescription): void;
  allowSubmit(allow: boolean): void;
}

function PatrolTaskForm({ taskDesc, patrolWaypoints, onChange, allowSubmit }: PatrolTaskFormProps) {
  const theme = useTheme();
  const onInputChange = (desc: PatrolTaskDescription) => {
    allowSubmit(isPatrolTaskDescriptionValid(desc));
    onChange(desc);
  };
  const { t } = useTranslation();
  return (
    <Grid container spacing={theme.spacing(2)} justifyContent="center" alignItems="center">
      <Grid item xs={10}>
        <Typography variant="body2" fontWeight="bold">
          {t('destination')}
        </Typography>
        <Autocomplete
          id="place-input"
          freeSolo
          fullWidth
          options={patrolWaypoints}
          getOptionLabel={(option) => option}
          filterOptions={(options, state) => {
            const inputValue = state.inputValue.toLowerCase();
            return options.filter(
              (option) =>
                option.toLowerCase().includes(inputValue) &&
                option !== 'Choose Robot Destination...' &&
                taskDesc.places[taskDesc.places.length - 1] !== option, // Filter out the placeholder
            );
          }}
          onChange={(_ev, newValue) =>
            newValue !== null &&
            taskDesc.places[taskDesc.places.length - 1] !== newValue &&
            onInputChange({
              ...taskDesc,
              places: taskDesc.places.concat(newValue).filter((el: string) => el),
            })
          }
          filterSelectedOptions
          renderInput={(params) => (
            <TextField {...params} placeholder={t('chooseDestination')} required={true} />
          )}
        />
      </Grid>
      <Grid item xs={2}>
        <Typography variant="body2" fontWeight="bold">
          {t('rounds')}
        </Typography>
        <PositiveIntField
          InputProps={{ className: classes.textField }}
          id="loops"
          value={taskDesc.rounds}
          onChange={(_ev, val) => {
            onInputChange({
              ...taskDesc,
              rounds: val,
            });
          }}
        />
      </Grid>
      <Grid item xs={10}>
        <PlaceList
          places={taskDesc && taskDesc.places ? taskDesc.places : []}
          onClick={(places_index) =>
            taskDesc.places.splice(places_index, 1) &&
            onInputChange({
              ...taskDesc,
            })
          }
        />
      </Grid>
    </Grid>
  );
}

interface CleanTaskFormProps {
  taskDesc: CleanTaskDescription;
  cleaningZones: string[];
  onChange(cleanTaskDescription: CleanTaskDescription): void;
  allowSubmit(allow: boolean): void;
}

function CleanTaskForm({ taskDesc, cleaningZones, onChange, allowSubmit }: CleanTaskFormProps) {
  const onInputChange = (desc: CleanTaskDescription) => {
    allowSubmit(isCleanTaskDescriptionValid(desc));
    onChange(desc);
  };

  return (
    <Autocomplete
      id="cleaning-zone"
      freeSolo
      fullWidth
      options={cleaningZones}
      value={taskDesc.zone}
      onChange={(_ev, newValue) => {
        const zone = newValue ?? '';
        onInputChange({
          ...taskDesc,
          zone: zone,
        });
      }}
      onBlur={(ev) => onInputChange({ ...taskDesc, zone: (ev.target as HTMLInputElement).value })}
      renderInput={(params) => <TextField {...params} label="Cleaning Zone" required={true} />}
    />
  );
}

interface FavoriteTaskProps {
  listItemText: string;
  listItemClick: () => void;
  favoriteTask: TaskFavorite;
  setFavoriteTask: (favoriteTask: TaskFavorite) => void;
  setOpenDialog: (open: boolean) => void;
  setCallToDelete: (open: boolean) => void;
  setCallToUpdate: (open: boolean) => void;
}

function FavoriteTask({
  listItemText,
  listItemClick,
  favoriteTask,
  setFavoriteTask,
  setOpenDialog,
  setCallToDelete,
  setCallToUpdate,
}: FavoriteTaskProps) {
  const theme = useTheme();

  return (
    <>
      <ListItem
        sx={{ width: theme.spacing(30) }}
        onClick={() => {
          listItemClick();
          setCallToUpdate(true);
        }}
        role="listitem button"
        button
        divider={true}
      >
        <ListItemText primary={listItemText} />
        <ListItemSecondaryAction>
          <Tooltip title="Update">
            <IconButton
              edge="end"
              aria-label="update"
              onClick={() => {
                setCallToUpdate(true);
                listItemClick();
              }}
            >
              <UpdateIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => {
                setOpenDialog(true);
                setFavoriteTask(favoriteTask);
                setCallToDelete(true);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </ListItemSecondaryAction>
      </ListItem>
    </>
  );
}

function defaultCleanTask(): CleanTaskDescription {
  return {
    zone: '',
  };
}

function defaultPatrolTask(): PatrolTaskDescription {
  return {
    places: [],
    rounds: 1,
  };
}

function defaultDeliveryTask(): DeliveryTaskDescription {
  return {
    pickup: {
      place: '',
      handler: '',
      payload: {
        sku: '',
        quantity: 1,
      },
    },
    dropoff: {
      place: '',
      handler: '',
      payload: {
        sku: '',
        quantity: 1,
      },
    },
  };
}

function defaultTaskDescription(taskCategory: string): TaskDescription | undefined {
  switch (taskCategory) {
    case 'clean':
      return defaultCleanTask();
    case 'patrol':
      return defaultPatrolTask();
    case 'delivery':
      return defaultDeliveryTask();
    default:
      return undefined;
  }
}

function defaultTask(): TaskRequest {
  return {
    category: 'patrol',
    description: defaultPatrolTask(),
    unix_millis_earliest_start_time: 0,
    unix_millis_request_time: Date.now(),
    priority: { type: 'binary', value: 0 },
    requester: '',
  };
}

export type RecurringDays = [boolean, boolean, boolean, boolean, boolean, boolean, boolean];

export interface Schedule {
  startOn: Date;
  days: RecurringDays;
  until?: Date;
  at: Date;
}

enum ScheduleUntilValue {
  NEVER = 'never',
  ON = 'on',
}

interface DaySelectorSwitchProps {
  disabled?: boolean;
  onChange: (checked: RecurringDays) => void;
  value: RecurringDays;
}

const DaySelectorSwitch: React.FC<DaySelectorSwitchProps> = ({ disabled, onChange, value }) => {
  const theme = useTheme();
  const renderChip = (idx: number, text: string) => (
    <Chip
      key={idx}
      label={text}
      color="primary"
      sx={{ '&:hover': {}, margin: theme.spacing(0.25) }}
      variant={value[idx] && !disabled ? 'filled' : 'outlined'}
      disabled={disabled}
      onClick={() => {
        value[idx] = !value[idx];
        onChange([...value]);
      }}
    />
  );
  return (
    <div>
      <TextField
        label="Recurring Every"
        color="primary"
        InputProps={{
          disabled: true,
          startAdornment: [
            renderChip(0, 'Mon'),
            renderChip(1, 'Tue'),
            renderChip(2, 'Wed'),
            renderChip(3, 'Thu'),
            renderChip(4, 'Fri'),
            renderChip(5, 'Sat'),
            renderChip(6, 'Sun'),
          ],
        }}
      />
    </div>
  );
};

const defaultFavoriteTask = (): TaskFavorite => {
  return {
    id: '',
    name: '',
    category: 'patrol',
    description: defaultPatrolTask(),
    unix_millis_earliest_start_time: Date.now(),
    priority: { type: 'binary', value: 0 },
    user: '',
  };
};

export interface CreateTaskFormProps
  extends Omit<ConfirmationDialogProps, 'onConfirmClick' | 'toolbar'> {
  /**
   * Shows extra UI elements suitable for submittng batched tasks. Default to 'false'.
   */
  user: string;
  allowBatch?: boolean;
  cleaningZones?: string[];
  patrolWaypoints?: string[];
  pickupPoints?: Record<string, string>;
  dropoffPoints?: Record<string, string>;
  favoritesTasks?: TaskFavorite[];
  scheduleToEdit?: Schedule;
  requestTask?: TaskRequest;
  submitTasks?(tasks: TaskRequest[], schedule: Schedule | null): Promise<void>;
  tasksFromFile?(): Promise<TaskRequest[]> | TaskRequest[];
  onSuccess?(tasks: TaskRequest[]): void;
  onFail?(error: Error, tasks: TaskRequest[]): void;
  onSuccessFavoriteTask?(message: string, favoriteTask: TaskFavorite): void;
  onFailFavoriteTask?(error: Error, favoriteTask: TaskFavorite): void;
  submitFavoriteTask?(favoriteTask: TaskFavorite): Promise<void>;
  deleteFavoriteTask?(favoriteTask: TaskFavorite): Promise<void>;
  onSuccessScheduling?(): void;
  onFailScheduling?(error: Error): void;
}

export function CreateTaskForm({
  user,
  cleaningZones = [],
  patrolWaypoints = [],
  pickupPoints = {},
  dropoffPoints = {},
  favoritesTasks = [],
  scheduleToEdit,
  requestTask,
  submitTasks,
  tasksFromFile,
  onClose,
  onSuccess,
  onFail,
  onSuccessFavoriteTask,
  onFailFavoriteTask,
  submitFavoriteTask,
  deleteFavoriteTask,
  onSuccessScheduling,
  onFailScheduling,
  ...otherProps
}: CreateTaskFormProps): JSX.Element {
  const theme = useTheme();
  const { t } = useTranslation();

  const taskCategoryPickerRef = React.useRef<HTMLInputElement>(null);
  //const favouriteTaskPickerRef = React.useRef(null);

  const [openFavoriteDialog, setOpenFavoriteDialog] = React.useState(false);
  const [callToDeleteFavoriteTask, setCallToDeleteFavoriteTask] = React.useState(false);
  const [callToUpdateFavoriteTask, setCallToUpdateFavoriteTask] = React.useState(false);
  const [deletingFavoriteTask, setDeletingFavoriteTask] = React.useState(false);

  const [favoriteTaskBuffer, setFavoriteTaskBuffer] = React.useState<TaskFavorite>(
    defaultFavoriteTask(),
  );
  const [favoriteTaskTitleError, setFavoriteTaskTitleError] = React.useState(false);
  const [savingFavoriteTask, setSavingFavoriteTask] = React.useState(false);

  const [taskRequests, setTaskRequests] = React.useState<TaskRequest[]>(() => [
    requestTask ?? defaultTask(),
  ]);
  const [selectedTaskIdx, setSelectedTaskIdx] = React.useState(0);
  const taskTitles = React.useMemo(
    () => taskRequests && taskRequests.map((t, i) => `${i + 1}: ${getShortDescription(t)}`),
    [taskRequests],
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [formFullyFilled, setFormFullyFilled] = React.useState(requestTask !== undefined || false);
  const taskRequest = taskRequests[selectedTaskIdx];
  const [openSchedulingDialog, setOpenSchedulingDialog] = React.useState(false);
  const [favoriteTaskExist, setFavoriteTaskExist] = React.useState(false);
  const [schedule, setSchedule] = React.useState<Schedule>(
    scheduleToEdit ?? {
      startOn: new Date(),
      days: [true, true, true, true, true, true, true],
      until: undefined,
      at: new Date(),
    },
  );
  const [scheduleUntilValue, setScheduleUntilValue] = React.useState<string>(
    scheduleToEdit?.until ? ScheduleUntilValue.ON : ScheduleUntilValue.NEVER,
  );

  const handleScheduleUntilValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value === ScheduleUntilValue.ON) {
      /**
       * Since the time change is done in the onchange of the Datepicker,
       * we need a defined time if the user saves the value without calling the onChange event of the datepicker
       */
      const date = new Date();
      date.setHours(23);
      date.setMinutes(59);
      setSchedule((prev) => ({ ...prev, until: date }));
    } else {
      setSchedule((prev) => ({ ...prev, until: undefined }));
    }
    setScheduleUntilValue(event.target.value);
  };
  // schedule is not supported with batch upload
  const scheduleEnabled = taskRequests.length === 1;
  const [isOpen, setIsOpen] = React.useState(true);
  const updateTasks = () => {
    setTaskRequests((prev) => {
      prev.splice(selectedTaskIdx, 1, taskRequest);
      return [...prev];
    });
  };

  const handleTaskDescriptionChange = (newCategory: string, newDesc: TaskDescription) => {
    taskRequest.category = newCategory;
    taskRequest.description = newDesc;
    setFavoriteTaskBuffer({ ...favoriteTaskBuffer, description: newDesc, category: newCategory });
    updateTasks();
  };

  const allowSubmit = (allow: boolean) => {
    setFormFullyFilled(allow);
  };

  const renderTaskDescriptionForm = () => {
    switch (taskRequest.category) {
      case 'clean':
        return (
          <CleanTaskForm
            taskDesc={taskRequest.description as CleanTaskDescription}
            cleaningZones={cleaningZones}
            onChange={(desc) => handleTaskDescriptionChange('clean', desc)}
            allowSubmit={allowSubmit}
          />
        );
      case 'patrol':
        return (
          <PatrolTaskForm
            taskDesc={taskRequest.description as PatrolTaskDescription}
            patrolWaypoints={patrolWaypoints}
            onChange={(desc) => handleTaskDescriptionChange('patrol', desc)}
            allowSubmit={allowSubmit}
          />
        );
      case 'delivery':
        return (
          <DeliveryTaskForm
            taskDesc={taskRequest.description as DeliveryTaskDescription}
            pickupPoints={pickupPoints}
            dropoffPoints={dropoffPoints}
            onChange={(desc) => handleTaskDescriptionChange('delivery', desc)}
            allowSubmit={allowSubmit}
          />
        );
      default:
        return null;
    }
  };
  const handleTaskTypeChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const newCategory = ev.target.value;
    const newDesc = defaultTaskDescription(newCategory);
    if (newDesc === undefined) {
      return;
    }
    taskRequest.description = newDesc;
    taskRequest.category = newCategory;

    setFavoriteTaskBuffer({ ...favoriteTaskBuffer, category: newCategory, description: newDesc });

    updateTasks();
  };

  // no memo because deps would likely change
  const handleSubmit = async (scheduling: boolean) => {
    if (!submitTasks) {
      onSuccess && onSuccess(taskRequests);
      return;
    }

    const requester = scheduling ? `${user}__scheduled` : user;

    for (const t of taskRequests) {
      t.requester = requester;
      t.unix_millis_request_time = Date.now();
    }

    const submittingSchedule = scheduling && scheduleEnabled;
    try {
      setSubmitting(true);
      await submitTasks(taskRequests, submittingSchedule ? schedule : null);
      setSubmitting(false);

      if (submittingSchedule) {
        onSuccessScheduling && onSuccessScheduling();
      } else {
        onSuccess && onSuccess(taskRequests);
      }
    } catch (e) {
      setSubmitting(false);
      if (submittingSchedule) {
        onFailScheduling && onFailScheduling(e as Error);
      } else {
        onFail && onFail(e as Error, taskRequests);
      }
    }
  };

  const handleSubmitNow: React.MouseEventHandler = async (ev) => {
    ev.preventDefault();
    await handleSubmit(false);
  };

  const handleSubmitSchedule: React.FormEventHandler = async (ev) => {
    ev.preventDefault();
    await handleSubmit(true);
  };

  const handleSubmitFavoriteTask: React.MouseEventHandler = async (ev) => {
    ev.preventDefault();

    if (!favoriteTaskBuffer.name) {
      setFavoriteTaskTitleError(true);
      return;
    }

    setFavoriteTaskTitleError(false);

    if (!submitFavoriteTask) {
      return;
    }
    try {
      setSavingFavoriteTask(true);
      await submitFavoriteTask(favoriteTaskBuffer);
      setSavingFavoriteTask(false);
      onSuccessFavoriteTask &&
        onSuccessFavoriteTask(
          `${!favoriteTaskBuffer.id ? `Created` : `Edited`}  favorite task successfully`,
          favoriteTaskBuffer,
        );
      setOpenFavoriteDialog(false);
      setCallToUpdateFavoriteTask(false);
    } catch (e) {
      setSavingFavoriteTask(false);
      onFailFavoriteTask && onFailFavoriteTask(e as Error, favoriteTaskBuffer);
    }
  };

  const handleDeleteFavoriteTask: React.MouseEventHandler = async (ev) => {
    ev.preventDefault();

    if (!deleteFavoriteTask) {
      return;
    }
    try {
      setDeletingFavoriteTask(true);
      await deleteFavoriteTask(favoriteTaskBuffer);
      setDeletingFavoriteTask(false);
      onSuccessFavoriteTask &&
        onSuccessFavoriteTask('Deleted favorite task successfully', favoriteTaskBuffer);

      setTaskRequests([defaultTask()]);
      setOpenFavoriteDialog(false);
      setCallToDeleteFavoriteTask(false);
      setCallToUpdateFavoriteTask(false);
    } catch (e) {
      setDeletingFavoriteTask(false);
      onFailFavoriteTask && onFailFavoriteTask(e as Error, favoriteTaskBuffer);
    }
  };

  const handleSelectFileClick: React.MouseEventHandler<HTMLButtonElement> = () => {
    if (!tasksFromFile) {
      return;
    }
    (async () => {
      const newTasks = await tasksFromFile();
      if (newTasks.length === 0) {
        return;
      }
      setTaskRequests(newTasks);
      setSelectedTaskIdx(0);
    })();
  };

  // if the value of favoriteTaskBuffername is in the list of favorite tasks, then set the favoriteTaskExist to true
  React.useEffect(() => {
    setFavoriteTaskExist(
      favoritesTasks.some((favoriteTask) => favoriteTask.name === favoriteTaskBuffer.name),
    );
  }, [favoriteTaskBuffer.name, favoritesTasks]);
  return (
    <div>
      <StyledDialog
        PaperProps={{
          className: classes.createTaskForm,
        }}
        title={t('createTask')}
        maxWidth="lg"
        disableEnforceFocus
        {...otherProps}
        open={isOpen}
        onClose={(event, reason) => {
          onClose && onClose(event, reason);
          setIsOpen(false);
        }}
      >
        <form aria-label="create-task">
          <div className={classes.outsideDiv}>
            <div>
              <DialogTitle>
                <div className={classes.titleDiv}>
                  <span className={classes.title}>{t('createTask')}</span>
                  <div className={classes.titleEndDiv}>
                    <FormToolbar onSelectFileClick={handleSelectFileClick} />
                    <IconButton onClick={(ev) => onClose && onClose(ev, 'escapeKeyDown')}>
                      <Close />
                    </IconButton>
                  </div>
                </div>
              </DialogTitle>
            </div>
            <div>
              <DialogContent>
                <Grid container direction="row" wrap="nowrap">
                  <div className="">
                    <Typography variant="h6" component="div">
                      {t('favoriteTasks')}
                    </Typography>
                    <List>
                      {favoritesTasks.map((favoriteTask, index) => (
                        <FavoriteTask
                          listItemText={favoriteTask.name}
                          key={index}
                          setFavoriteTask={setFavoriteTaskBuffer}
                          favoriteTask={favoriteTask}
                          setCallToDelete={setCallToDeleteFavoriteTask}
                          setCallToUpdate={setCallToUpdateFavoriteTask}
                          setOpenDialog={setOpenFavoriteDialog}
                          listItemClick={() => {
                            setFavoriteTaskBuffer(favoriteTask);
                            setTaskRequests([
                              {
                                category: favoriteTask.category,
                                description: favoriteTask.description,
                                unix_millis_earliest_start_time: Date.now(),
                                priority: favoriteTask.priority,
                              },
                            ]);
                          }}
                        />
                      ))}
                    </List>
                  </div>
                  <Divider
                    orientation="vertical"
                    flexItem
                    style={{ marginLeft: theme.spacing(2), marginRight: theme.spacing(2) }}
                  />

                  <div>
                    <div className={classes.dialogContent}>
                      <div className="" id="menu-items" ref={taskCategoryPickerRef}>
                        <Typography variant="body2" fontWeight="bold">
                          {t('taskCategory')}
                        </Typography>
                        <TextField
                          select
                          id="task-type"
                          InputProps={{ className: classes.textField }}
                          variant="outlined"
                          fullWidth
                          margin="normal"
                          value={taskRequest.category}
                          onChange={handleTaskTypeChange}
                        >
                          <MenuItem
                            itemProp={classes.textField}
                            value="clean"
                            disabled={!cleaningZones || cleaningZones.length === 0}
                          >
                            <div className={classes.div}>
                              <ListItemIcon>
                                <CleaningServicesIcon />
                              </ListItemIcon>
                              <ListItemText primary="Clean" />
                            </div>
                          </MenuItem>
                          <MenuItem
                            value="patrol"
                            disabled={!patrolWaypoints || patrolWaypoints.length === 0}
                          >
                            <div className={classes.div}>
                              <ListItemIcon>
                                <ElectricCarIcon />
                              </ListItemIcon>
                              <ListItemText primary="Patrol" />
                            </div>
                          </MenuItem>
                          <MenuItem
                            value="delivery"
                            disabled={
                              Object.keys(pickupPoints).length === 0 ||
                              Object.keys(dropoffPoints).length === 0
                            }
                          >
                            <div className={classes.div}>
                              <ListItemIcon>
                                <LocalShippingIcon />
                              </ListItemIcon>
                              <ListItemText primary="Delivery" />
                            </div>
                          </MenuItem>
                        </TextField>
                      </div>
                      <div className={classes.contentDiv}>
                        <div className={classes.dateDiv} id="time-arrange-div">
                          <Typography variant="body2" fontWeight="bold">
                            {t('startTime')}
                          </Typography>
                          <DateTimePicker
                            inputFormat={'MM/dd/yyyy HH:mm'}
                            InputProps={{ className: classes.textField }}
                            value={
                              taskRequest.unix_millis_earliest_start_time
                                ? new Date(taskRequest.unix_millis_earliest_start_time)
                                : new Date()
                            }
                            onChange={(date) => {
                              if (!date) {
                                return;
                              }
                              taskRequest.unix_millis_earliest_start_time = date.valueOf();
                              setFavoriteTaskBuffer({
                                ...favoriteTaskBuffer,
                                unix_millis_earliest_start_time: date.valueOf(),
                              });
                              updateTasks();
                            }}
                            renderInput={(props) => <TextField {...props} />}
                          />
                        </div>
                        <div className={classes.priority} id="priority-div">
                          <Typography variant="body2" fontWeight="bold" ml={1}>
                            {t('priority')}
                          </Typography>
                          <PositiveIntField
                            InputProps={{ className: classes.textField }}
                            id="priority"
                            value={(taskRequest.priority as Record<string, number>)?.value || 0}
                            onChange={(_ev, val) => {
                              taskRequest.priority = { type: 'binary', value: val };
                              setFavoriteTaskBuffer({
                                ...favoriteTaskBuffer,
                                priority: { type: 'binary', value: val },
                              });
                              updateTasks();
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <Divider
                      orientation="horizontal"
                      flexItem
                      style={{ marginTop: theme.spacing(2), marginBottom: theme.spacing(2) }}
                    />
                    {renderTaskDescriptionForm()}
                    <Grid container justifyContent="center">
                      <Button
                        aria-label="Save as a favorite task"
                        variant="contained"
                        className={classes.actionBtn}
                        onClick={() => {
                          !callToUpdateFavoriteTask &&
                            setFavoriteTaskBuffer({ ...favoriteTaskBuffer, name: '', id: '' });
                          setOpenFavoriteDialog(true);
                        }}
                        style={{ marginTop: theme.spacing(2), marginBottom: theme.spacing(2) }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#ffffff',
                            fontWeight: 'bold',
                          }}
                        >
                          {callToUpdateFavoriteTask ? t('confirmEdits') : t('saveFavTask')}
                        </Typography>
                      </Button>
                    </Grid>
                  </div>
                  {taskTitles.length > 1 && (
                    <>
                      <Divider
                        orientation="vertical"
                        flexItem
                        style={{ marginLeft: theme.spacing(2), marginRight: theme.spacing(2) }}
                      />
                      <List dense className={classes.taskList} aria-label="Tasks List">
                        {taskTitles.map((title, idx) => (
                          <ListItem
                            key={idx}
                            button
                            onClick={() => setSelectedTaskIdx(idx)}
                            className={selectedTaskIdx === idx ? classes.selectedTask : undefined}
                            role="listitem button"
                          >
                            <ListItemText primary={title} />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </Grid>
              </DialogContent>
            </div>
            <div>
              <DialogActions>
                <Button
                  size="medium"
                  variant="contained"
                  disabled={submitting}
                  className={classes.actionBtn}
                  onClick={(ev) => onClose && onClose(ev, 'escapeKeyDown')}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#ffffff',
                      fontWeight: 'bold',
                    }}
                  >
                    {t('cancel')}
                  </Typography>
                </Button>
                <Button
                  size="medium"
                  variant="contained"
                  disabled={submitting || !formFullyFilled}
                  className={classes.actionBtn}
                  onClick={() => setOpenSchedulingDialog(true)}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#ffffff',
                      fontWeight: 'bold',
                    }}
                  >
                    {scheduleToEdit ? t('editSchedule') : t('addToSchedule')}
                  </Typography>
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={submitting || !formFullyFilled || scheduleToEdit !== undefined}
                  className={classes.actionBtn}
                  aria-label={'Submit'}
                  onClick={handleSubmitNow}
                >
                  <Loading hideChildren loading={submitting} size="1.5em" color="inherit">
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#ffffff',
                        fontWeight: 'bold',
                      }}
                    >
                      {t('submitText')}
                    </Typography>
                  </Loading>
                </Button>
              </DialogActions>
            </div>
          </div>
        </form>
      </StyledDialog>
      {openFavoriteDialog && (
        <ConfirmationDialog
          confirmText={callToDeleteFavoriteTask ? t('delete') : t('save')}
          cancelText="Back"
          open={openFavoriteDialog}
          title={callToDeleteFavoriteTask ? t('confirmDelete') : t('favTask')}
          submitting={callToDeleteFavoriteTask ? deletingFavoriteTask : savingFavoriteTask}
          onClose={() => {
            setOpenFavoriteDialog(false);
            setCallToDeleteFavoriteTask(false);
          }}
          onSubmit={callToDeleteFavoriteTask ? handleDeleteFavoriteTask : handleSubmitFavoriteTask}
          disableButtons={favoriteTaskExist && !callToUpdateFavoriteTask}
        >
          {!callToDeleteFavoriteTask && (
            <TextField
              size="small"
              value={favoriteTaskBuffer.name}
              onChange={(e) =>
                setFavoriteTaskBuffer({ ...favoriteTaskBuffer, name: e.target.value })
              }
              helperText={t('reqired')}
              error={favoriteTaskTitleError}
            />
          )}
          {favoritesTasks.find((task) => task.name === favoriteTaskBuffer.name) &&
            !callToDeleteFavoriteTask &&
            !callToUpdateFavoriteTask && (
              <Typography color="error" fontWeight="bold">
                {t('favTaskExists')}
              </Typography>
            )}
          {callToDeleteFavoriteTask && (
            <Typography>{`${t('sureToDelete')} "${favoriteTaskBuffer.name}"?`}</Typography>
          )}
        </ConfirmationDialog>
      )}
      {openSchedulingDialog && (
        <ConfirmationDialog
          confirmText="Schedule"
          cancelText="Cancel"
          open={openSchedulingDialog}
          title="Schedule Task"
          submitting={false}
          onClose={() => setOpenSchedulingDialog(false)}
          onSubmit={(ev) => {
            handleSubmitSchedule(ev);
            setOpenSchedulingDialog(false);
          }}
        >
          <Grid container spacing={theme.spacing(2)} marginTop={theme.spacing(1)}>
            <Grid item xs={6}>
              <DatePicker
                value={schedule.startOn}
                onChange={(date) =>
                  date &&
                  setSchedule((prev) => {
                    date.setHours(schedule.at.getHours());
                    date.setMinutes(schedule.at.getMinutes());
                    return { ...prev, startOn: date };
                  })
                }
                label="Start On"
                disabled={!scheduleEnabled}
                renderInput={(props) => <TextField {...props} fullWidth />}
              />
            </Grid>
            <Grid item xs={6}>
              <TimePicker
                value={schedule.at}
                onChange={(date) => {
                  if (!date) {
                    return;
                  }
                  setSchedule((prev) => ({ ...prev, at: date }));
                  if (!isNaN(date.valueOf())) {
                    setSchedule((prev) => {
                      const startOn = prev.startOn;
                      startOn.setHours(date.getHours());
                      startOn.setMinutes(date.getMinutes());
                      return { ...prev, startOn };
                    });
                  }
                }}
                label="At"
                disabled={!scheduleEnabled}
                renderInput={(props) => <TextField {...props} fullWidth />}
              />
            </Grid>
            <Grid item xs={12}>
              <DaySelectorSwitch
                value={schedule.days}
                disabled={!scheduleEnabled}
                onChange={(days) => setSchedule((prev) => ({ ...prev, days }))}
              />
            </Grid>
          </Grid>
          <Grid container marginTop={theme.spacing(1)} marginLeft={theme.spacing(0)}>
            <FormControl fullWidth={true}>
              <FormHelperText>Ends</FormHelperText>
              <RadioGroup
                aria-labelledby="controlled-radio-buttons-group"
                name="controlled-radio-buttons-group"
                value={scheduleUntilValue}
                onChange={handleScheduleUntilValue}
                row
              >
                <Grid item xs={6} paddingLeft={theme.spacing(1)}>
                  <FormControlLabel
                    value={ScheduleUntilValue.NEVER}
                    control={<Radio />}
                    label="Never"
                  />
                </Grid>
                <Grid item xs={2} paddingLeft={theme.spacing(1)}>
                  <FormControlLabel value={ScheduleUntilValue.ON} control={<Radio />} label="On" />
                </Grid>
                <Grid item xs={4}>
                  <DatePicker
                    value={
                      scheduleUntilValue === ScheduleUntilValue.NEVER ? new Date() : schedule.until
                    }
                    onChange={(date) =>
                      date &&
                      setSchedule((prev) => {
                        date.setHours(23);
                        date.setMinutes(59);
                        return { ...prev, until: date };
                      })
                    }
                    disabled={scheduleUntilValue !== ScheduleUntilValue.ON}
                    renderInput={(props) => <TextField {...props} fullWidth />}
                  />
                </Grid>
              </RadioGroup>
            </FormControl>
          </Grid>
        </ConfirmationDialog>
      )}
    </div>
  );
}
