'use client';

import * as React from 'react';
import { Box, CircularProgress, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';

type PlanningActionBarProps = {
  isSaving: boolean;
  onReset: () => void;
  onSave: () => void;
};

const ResetIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M16 3h5v5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 21H3v-5" />
  </svg>
);

const SaveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export default function PlanningActionBar({
  isSaving,
  onReset,
  onSave,
}: PlanningActionBarProps) {
  return (
    <Box
      sx={{
        position: 'fixed',
        right: { xs: 12, sm: 20 },
        bottom: { xs: 12, sm: 20 },
        zIndex: 1100,
        width: { xs: 'calc(100vw - 24px)', sm: 292 },
        animation: 'balloonIn 180ms ease-out',
        '@keyframes balloonIn': {
          '0%': { transform: 'translateY(8px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          p: 1.1,
          pl: 1.25,
          borderRadius: 2.5,
          bgcolor: 'rgba(255, 255, 255, 0.98)',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 28px rgba(15, 23, 42, 0.14)',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: '#0f172a',
          '&::after': {
            content: '""',
            position: 'absolute',
            right: 18,
            bottom: -6,
            width: 11,
            height: 11,
            bgcolor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            transform: 'rotate(45deg)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              flexShrink: 0,
              bgcolor: '#f59e0b',
              borderRadius: '50%',
              boxShadow: '0 0 0 3px #fef3c7',
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: '0.76rem', lineHeight: 1.25, color: '#334155' }}>
              ยังไม่ได้บันทึก
            </Typography>
            <Typography sx={{ fontSize: '0.66rem', lineHeight: 1.25, color: '#64748b' }}>
              มีการเปลี่ยนแปลงในแผน
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <Tooltip title="คืนค่าเริ่มต้น" arrow>
            <span>
              <IconButton
                size="small"
                aria-label="คืนค่าเริ่มต้น"
                onClick={onReset}
                disabled={isSaving}
                sx={{ width: 30, height: 30, color: '#64748b', border: '1px solid #e2e8f0' }}
              >
                <ResetIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="บันทึกการเปลี่ยนแปลง" arrow>
            <span>
              <IconButton
                size="small"
                aria-label="บันทึกการเปลี่ยนแปลง"
                disabled={isSaving}
                onClick={onSave}
                sx={{
                  width: 32,
                  height: 32,
                  color: '#ffffff',
                  bgcolor: '#4f46e5',
                  boxShadow: '0 3px 8px rgba(79, 70, 229, 0.24)',
                  '&:hover': { bgcolor: '#4338ca' },
                  '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#ffffff' },
                }}
              >
                {isSaving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Paper>
    </Box>
  );
}
