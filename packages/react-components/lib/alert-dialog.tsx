import * as React from 'react';
import {
  Box,
  Button,
  LinearProgress,
  LinearProgressProps,
  TextField,
  Theme,
  Typography,
  Divider,
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { makeStyles, createStyles } from '@mui/styles';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    textField: {
      background: theme.palette.background.default,
      pointerEvents: 'none',
    },
    summaryDiv: {
      borderRadius: '20px',
      backgroundColor: theme.palette.mode === 'dark' ? '#597276' : '#CE172D',
    },
    actionBtn: {
      minWidth: 80,
      borderRadius: '20px',
      backgroundColor: theme.palette.mode === 'dark' ? '#739BD0' : '#CE172D',
      '&:hover': {
        transform: 'scale(1.05)',
        backgroundColor: theme.palette.mode === 'dark' ? '#CE172D' : '#CE172D',
      },
    },
  }),
);

export interface AlertContent {
  title: string;
  value: string;
}

export interface CloseAlertDialogProps {
  title: string;
}

export const CloseAlertDialog = React.memo((props: CloseAlertDialogProps) => {
  const { title } = props;
  return <Dialog key={title} open={false} />;
});

export interface DialogAlertProps {
  onDismiss: () => void;
  onAcknowledge?: () => void;
  onInspect?: () => void;
  acknowledgedBy?: string;
  title: string;
  progress?: number;
  alertContents: AlertContent[];
  backgroundColor: string;
}

export const AlertDialog = React.memo((props: DialogAlertProps) => {
  const { t } = useTranslation();
  const LinearProgressWithLabel = (props: LinearProgressProps & { value: number }) => {
    return (
      <Box component="div" sx={{ display: 'flex', alignItems: 'center' }}>
        <Box component="div" sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" {...props} value={props.value * 100} />
        </Box>
        <Box component="div" sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary">{`${Math.round(
            props.value * 100,
          )}%`}</Typography>
        </Box>
      </Box>
    );
  };

  const returnDialogContent = (alertContents: AlertContent[]) => {
    return (
      <>
        {alertContents.map((message, index) => (
          <div key={index}>
            <TextField
              label={message.title}
              id="standard-size-small"
              size="small"
              variant="filled"
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

  const {
    onDismiss,
    onAcknowledge,
    onInspect,
    acknowledgedBy,
    title,
    progress,
    alertContents,
    backgroundColor,
  } = props;
  const classes = useStyles();
  const [isOpen, setIsOpen] = React.useState(true);
  const [acknowledged, setAcknowledged] = React.useState(acknowledgedBy !== undefined);
  return (
    <Dialog
      PaperProps={{
        className: classes.summaryDiv,
        style: {
          backgroundColor: backgroundColor,
          boxShadow: 'none',
        },
      }}
      maxWidth="sm"
      fullWidth={true}
      open={isOpen}
      key={title}
    >
      <DialogTitle align="center">{title}</DialogTitle>
      <Divider />
      {progress ? (
        <>
          <Typography variant="body2" fontWeight="bold" ml={3} mt={1}>
            {t('taskProgress')}
          </Typography>
          <Box component="div" width={0.95} ml={3}>
            <LinearProgressWithLabel value={progress} />
          </Box>
        </>
      ) : null}
      <DialogContent>{returnDialogContent(alertContents)}</DialogContent>

      <DialogActions>
        {onInspect ? (
          <Button
            size="small"
            variant="contained"
            className={classes.actionBtn}
            onClick={onInspect}
            disabled={false}
            autoFocus
          >
            <Typography
              variant="body2"
              sx={{
                color: '#ffffff',
                fontWeight: 'bold',
              }}
            >
              {t('inspect')}
            </Typography>
          </Button>
        ) : null}
        {acknowledged ? (
          <Button
            size="small"
            variant="contained"
            disabled={true}
            autoFocus
            className={classes.actionBtn}
          >
            <Typography
              variant="body2"
              sx={{
                color: '#ffffff',
                fontWeight: 'bold',
              }}
            >
              {acknowledgedBy ? `Acknowledged by ${acknowledgedBy}` : t('acknowledged')}
            </Typography>
          </Button>
        ) : onAcknowledge === undefined ? null : (
          <Button
            size="small"
            variant="contained"
            className={classes.actionBtn}
            onClick={() => {
              setAcknowledged(true);
              onAcknowledge();
            }}
            disabled={false}
            autoFocus
          >
            <Typography
              variant="body2"
              sx={{
                color: '#ffffff',
                fontWeight: 'bold',
              }}
            >
              {t('acknowledge')}
            </Typography>
          </Button>
        )}
        <Button
          size="small"
          variant="contained"
          className={classes.actionBtn}
          onClick={() => {
            setIsOpen(false);
            onDismiss();
          }}
          autoFocus
        >
          <Typography
            variant="body2"
            sx={{
              color: '#ffffff',
              fontWeight: 'bold',
            }}
          >
            {acknowledged ? t('close') : t('dismiss')}
          </Typography>
        </Button>
      </DialogActions>
    </Dialog>
  );
});
