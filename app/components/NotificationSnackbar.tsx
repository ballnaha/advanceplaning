'use client';

import * as React from 'react';
import { Alert, Snackbar } from '@mui/material';
import type { AlertColor } from '@mui/material';

type NotificationSnackbarProps = {
  open: boolean;
  message: string;
  severity: AlertColor;
  onClose: () => void;
  autoHideDuration?: number;
};

export default function NotificationSnackbar({
  open,
  message,
  severity,
  onClose,
  autoHideDuration = 4000,
}: NotificationSnackbarProps) {
  return (
    <Snackbar
      key={message}
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: '100%',
          borderRadius: 1.5,
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
