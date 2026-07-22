'use client';

import * as React from 'react';
import { Button, Stack, Divider, CircularProgress } from '@mui/material';

type PlanningActionButtonsProps = {
  isDirty: boolean;
  isSaving: boolean;
  isSequencing?: boolean;
  density?: 'default' | 'compact';
  onAutoSequence: () => void;
  onSave: () => void;
  onExport: () => void;
};

const AutoSequenceIcon = () => (
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

const ExcelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 4 }}>
    <rect x="2" y="2" width="20" height="20" rx="3" fill="#16a34a" />
    <text x="12" y="16" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="Arial, sans-serif">XLS</text>
  </svg>
);

export default function PlanningActionButtons({
  isDirty,
  isSaving,
  isSequencing = false,
  density = 'default',
  onAutoSequence,
  onSave,
  onExport,
}: PlanningActionButtonsProps) {
  const compact = density === 'compact';
  const [isExporting, setIsExporting] = React.useState(false);

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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      onExport();
    } catch (e) {
      console.error('Failed to export excel:', e);
    } finally {
      setTimeout(() => {
        setIsExporting(false);
      }, 800);
    }
  };

  return (
    <Stack
      direction="row"
      spacing={compact ? 0.5 : 1}
      sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 0.5 }}
    >
      {/* EXPORT EXCEL */}
      <Button
        size="small"
        variant="outlined"
        disabled={isSaving || isSequencing || isExporting}
        onClick={handleExport}
        sx={{
          ...baseButtonSx,
          color: '#16a34a',
          borderColor: '#bbf7d0',
          '&:hover': {
            borderColor: '#16a34a',
            bgcolor: 'rgba(22, 163, 74, 0.04)',
            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.12)',
          },
        }}
      >
        {isExporting ? (
          <CircularProgress size={12} color="inherit" sx={{ mr: 0.75 }} />
        ) : (
          <ExcelIcon />
        )}
        {isExporting ? 'EXPORTING…' : 'EXPORT EXCEL'}
      </Button>

      {/* Divider separator */}
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: 'rgba(15, 23, 42, 0.12)' }} />

      {/* AUTO SEQUENCE */}
      <Button
        size="small"
        variant="outlined"
        onClick={onAutoSequence}
        disabled={isSaving || isSequencing || isExporting}
        sx={{
          ...baseButtonSx,
          color: '#475569',
          borderColor: '#cbd5e1',
          '&:hover': {
            borderColor: '#4f46e5',
            color: '#4338ca',
            bgcolor: 'rgba(79, 70, 229, 0.04)',
          },
        }}
      >
        {isSequencing ? (
          <CircularProgress size={12} color="inherit" sx={{ mr: 0.75 }} />
        ) : (
          <AutoSequenceIcon />
        )}
        {isSequencing ? 'กำลังจัดลำดับ…' : 'DEFAULT SETTING'}
      </Button>

      {/* SAVE */}
      <Button
        size="small"
        variant={isDirty ? 'contained' : 'outlined'}
        disabled={isSaving || isExporting}
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
