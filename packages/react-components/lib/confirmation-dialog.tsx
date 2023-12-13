import {
  Button,
  Dialog,
  DialogActions,
  DialogActionsProps,
  DialogContent,
  DialogProps,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
  styled,
} from '@mui/material';
import clsx from 'clsx';
import React from 'react';
import { Loading } from './loading';
import Close from '@mui/icons-material/Close';

const dialogClasses = {
  title: 'confirmation-dialogue-info-value',
  actionBtn: 'confirmation-dialogue-action-button',
  textField: 'confirmation-dialogue-text-field',
};
const StyledDialog = styled((props: DialogProps) => <Dialog {...props} />)(({ theme }) => ({
  [`& .${dialogClasses.title}`]: {
    flex: '1 1 auto',
  },
  [`& .${dialogClasses.actionBtn}`]: {
    minWidth: 80,
    borderRadius: '20px',
    backgroundColor: theme.palette.mode === 'dark' ? '#739BD0' : '#739BD0',
  },
  [`& .${dialogClasses.textField}`]: {
    borderRadius: '20px',
    backgroundColor: theme.palette.mode === 'dark' ? '#597276' : '#D7E5CA',
  },
}));

export interface ConfirmationDialogProps extends DialogProps {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  // disable the dialog actions and shows a loading indicator
  submitting?: boolean;
  classes?: DialogActionsProps['classes'] & { button: string };
  toolbar?: React.ReactNode;
  onSubmit?: React.FormEventHandler;
}

export function ConfirmationDialog({
  title = 'Confirm',
  confirmText = 'OK',
  cancelText = 'Cancel',
  submitting = false,
  classes,
  onSubmit,
  toolbar,
  onClose,
  children,
  ...otherProps
}: ConfirmationDialogProps): JSX.Element {
  return (
    <StyledDialog
      PaperProps={{ className: dialogClasses.textField }}
      onClose={onClose}
      {...otherProps}
    >
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          onSubmit && onSubmit(ev);
        }}
        aria-label={title}
      >
        <DialogTitle>
          <Grid container wrap="nowrap">
            <Grid item className={dialogClasses.title}>
              {title}
            </Grid>
            <IconButton onClick={(ev) => onClose && onClose(ev, 'escapeKeyDown')}>
              <Close />
            </IconButton>
            <Grid item>{toolbar}</Grid>
          </Grid>
        </DialogTitle>
        <DialogContent>{children}</DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            type="submit"
            disabled={submitting}
            className={clsx(dialogClasses.actionBtn, classes?.button)}
          >
            <Loading hideChildren loading={submitting} size="1.5em" color="inherit">
              <Typography
                variant="body2"
                sx={{
                  color: '#ffffff',
                  fontWeight: 'bold',
                }}
              >
                {confirmText}
              </Typography>
            </Loading>
          </Button>
        </DialogActions>
      </form>
    </StyledDialog>
  );
}
