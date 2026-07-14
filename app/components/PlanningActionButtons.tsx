'use client';

import * as React from 'react';
import { Button, Stack, CircularProgress } from '@mui/material';

type PlanningActionButtonsProps = {
  isDirty: boolean;
  isSaving: boolean;
  density?: 'default' | 'compact';
  onAutoArrange: () => void;
  onReset: () => void;
  onSave: () => void;
};

const MagicWandIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/>
    <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z" fill="currentColor"/>
  </svg>
);

const ResetIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M16 3h5v5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
  </svg>
);

const SaveIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
  </svg>
);

export default function PlanningActionButtons({
  isDirty,
  isSaving,
  density = 'default',
  onAutoArrange,
  onReset,
  onSave,
}: PlanningActionButtonsProps) {
  const compact = density === 'compact';
  
  const baseButtonSx = {
    minWidth: 0,
    px: compact ? 1.25 : 1.75,
    py: compact ? 0.5 : 0.75,
    fontSize: compact ? '0.7rem' : '0.75rem',
    fontWeight: 900,
    whiteSpace: 'nowrap',
    boxShadow: 'none',
    borderRadius: '8px',
    transition: 'all 0.15s ease-in-out',
    textTransform: 'none',
  } as const;

  return (
    <Stack
      direction="row"
      spacing={compact ? 0.5 : 1}
      sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}
    >
      {/* จัดลำดับด่วน */}
      <Button
        size="small"
        variant="outlined"
        onClick={onAutoArrange}
        disabled={isSaving}
        sx={{
          ...baseButtonSx,
          color: '#475569',
          borderColor: '#cbd5e1',
          '&:hover': {
            borderColor: '#6366f1',
            color: '#4f46e5',
            bgcolor: 'rgba(99, 102, 241, 0.04)',
          },
        }}
      >
        <MagicWandIcon />
        จัดลำดับด่วน
      </Button>

      {/* DEFAULT SETTING */}
      <Button
        size="small"
        variant="outlined"
        onClick={onReset}
        disabled={isSaving}
        sx={{
          ...baseButtonSx,
          color: '#475569',
          borderColor: '#cbd5e1',
          '&:hover': {
            borderColor: '#ef4444',
            color: '#dc2626',
            bgcolor: 'rgba(239, 68, 68, 0.04)',
          },
        }}
      >
        <ResetIcon />
        DEFAULT SETTING
      </Button>

      {/* SAVE */}
      <Button
        size="small"
        variant={isDirty ? 'contained' : 'outlined'}
        disabled={isSaving}
        onClick={onSave}
        sx={{
          ...baseButtonSx,
          ...(isDirty
            ? {
                bgcolor: '#4f46e5',
                color: '#ffffff',
                '&:hover': {
                  bgcolor: '#4338ca',
                  boxShadow: '0 4px 10px rgba(79, 70, 229, 0.15)',
                },
              }
            : {
                color: '#4f46e5',
                borderColor: '#a5b4fc',
                bgcolor: '#ffffff',
                '&:hover': {
                  borderColor: '#6366f1',
                  bgcolor: 'rgba(99, 102, 241, 0.05)',
                },
              }),
        }}
      >
        {isSaving ? (
          <CircularProgress size={12} color="inherit" sx={{ mr: 0.75 }} />
        ) : (
          <SaveIcon />
        )}
        {isSaving ? 'SAVING…' : 'SAVE'}
      </Button>
    </Stack>
  );
}

