'use client';

import * as React from 'react';
import { Box, Button, Paper, Stack, Typography, CircularProgress } from '@mui/material';

type PlanningActionBarProps = {
  isSaving: boolean;
  onAutoArrange: () => void;
  onReset: () => void;
  onSave: () => void;
};

const numberFormatter = new Intl.NumberFormat('th-TH');

const MagicWandIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
    <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z" fill="currentColor" />
    <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" fill="currentColor" />
  </svg>
);

const ResetIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M16 3h5v5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 21H3v-5" />
  </svg>
);

const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export default function PlanningActionBar({
  isSaving,
  onAutoArrange,
  onReset,
  onSave,
}: PlanningActionBarProps) {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1100,
        width: 'auto',
        maxWidth: '90vw',
        animation: 'slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        '@keyframes slideUp': {
          '0%': { transform: 'translateY(100px) translateX(-50%) scale(0.9)', opacity: 0 },
          '100%': { transform: 'translateY(0) translateX(-50%) scale(1)', opacity: 1 },
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: '10px 14px 10px 20px',
          borderRadius: '999px',
          bgcolor: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 10px 20px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1.5, sm: 2.5 },
          color: '#ffffff',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          justifyContent: 'center',
        }}
      >
        {/* Left Side: Status & Description */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Pulsing amber indicator */}
          <Box
            sx={{
              width: 8,
              height: 8,
              bgcolor: '#f59e0b',
              borderRadius: '50%',
              boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.6)',
              animation: 'pulse 2s infinite ease-in-out',
              '@keyframes pulse': {
                '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.7)' },
                '70%': { transform: 'scale(1)', boxShadow: '0 0 0 8px rgba(245, 158, 11, 0)' },
                '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(245, 158, 11, 0)' },
              },
            }}
          />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 850, fontSize: '0.85rem', letterSpacing: '-0.01em', whiteSpace: 'nowrap', color: 'rgba(255, 255, 255, 0.85)' }}>
              มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
            </Typography>
            
          </Box>
        </Box>

        {/* Divider */}
        <Box sx={{ display: { xs: 'none', sm: 'block' }, width: '1px', height: 28, bgcolor: 'rgba(255, 255, 255, 0.15)' }} />

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {/* จัดลำดับด่วน */}
          <Button
            size="small"
            variant="outlined"
            onClick={onAutoArrange}
            disabled={isSaving}
            sx={{
              borderRadius: '999px',
              fontWeight: 850,
              fontSize: '0.75rem',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              px: 2,
              py: 0.75,
              whiteSpace: 'nowrap',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#4f46e5',
                bgcolor: 'rgba(79, 70, 229, 0.12)',
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
              borderRadius: '999px',
              fontWeight: 850,
              fontSize: '0.75rem',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              px: 2,
              py: 0.75,
              whiteSpace: 'nowrap',
              textTransform: 'none',
              '&:hover': {
                borderColor: '#ef4444',
                bgcolor: 'rgba(239, 68, 68, 0.12)',
              },
            }}
          >
            <ResetIcon />
            DEFAULT SETTING
          </Button>

          {/* SAVE CHANGES */}
          <Button
            size="small"
            variant="contained"
            disabled={isSaving}
            onClick={onSave}
            sx={{
              borderRadius: '999px',
              fontWeight: 900,
              fontSize: '0.75rem',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              px: 2.5,
              py: 0.75,
              whiteSpace: 'nowrap',
              textTransform: 'none',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                background: 'linear-gradient(135deg, #4338ca 0%, #2563eb 100%)',
                boxShadow: '0 6px 20px rgba(79, 70, 229, 0.4)',
              },
              '&.Mui-disabled': {
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            {isSaving ? (
              <CircularProgress size={14} color="inherit" sx={{ mr: 1 }} />
            ) : (
              <SaveIcon />
            )}
            {isSaving ? 'SAVING…' : 'SAVE CHANGES'}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
