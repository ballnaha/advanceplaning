'use client';

import * as React from 'react';
import { Box, CircularProgress, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';

type PlanningActionBarProps = {
  isSaving: boolean;
  onReset: () => void;
  onSave: () => void;
};

const ResetIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M16 3h5v5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 21H3v-5" />
  </svg>
);

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
        right: { xs: 12, sm: 24 },
        bottom: { xs: 12, sm: 24 },
        zIndex: 1100,
        width: { xs: 'calc(100vw - 24px)', sm: 310 },
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
          p: 1.4,
          pl: 1.6,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.35) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.45)',
          boxShadow: '0 12px 32px 0 rgba(31, 38, 135, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          color: '#0f172a',
          '&::after': {
            content: '""',
            position: 'absolute',
            right: 22,
            bottom: -6,
            width: 12,
            height: 12,
            background: 'rgba(255, 255, 255, 0.42)',
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.45)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.45)',
            transform: 'rotate(45deg)',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              flexShrink: 0,
              bgcolor: '#f59e0b',
              borderRadius: '50%',
              boxShadow: '0 0 0 4px rgba(245, 158, 11, 0.25)',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.5)',
                animation: 'pulseStatus 2s infinite ease-in-out',
              },
              '@keyframes pulseStatus': {
                '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.5)' },
                '70%': { transform: 'scale(1.1)', boxShadow: '0 0 0 6px rgba(245, 158, 11, 0)' },
                '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(245, 158, 11, 0)' },
              }
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: '0.84rem', lineHeight: 1.25, color: '#0f172a', letterSpacing: '-0.01em' }}>
              ยังไม่ได้บันทึก
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', lineHeight: 1.25, color: '#475569', fontWeight: 650 }}>
              มีการเปลี่ยนแปลงในแผน
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <Tooltip title="คืนค่าเริ่มต้น" arrow>
            <span>
              <IconButton
                size="small"
                aria-label="คืนค่าเริ่มต้น"
                onClick={onReset}
                disabled={isSaving}
                sx={{
                  width: 34,
                  height: 34,
                  color: '#475569',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  bgcolor: 'rgba(255, 255, 255, 0.45)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.75)',
                    borderColor: 'rgba(15, 23, 42, 0.15)',
                    transform: 'translateY(-1px)',
                  },
                  '&.Mui-disabled': { opacity: 0.5 }
                }}
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
                  width: 36,
                  height: 36,
                  color: '#ffffff',
                  bgcolor: '#4f46e5',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#4338ca',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 16px rgba(79, 70, 229, 0.4)',
                  },
                  '&.Mui-disabled': { bgcolor: '#cbd5e1', color: '#ffffff' },
                }}
              >
                {isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Paper>
    </Box>
  );
}
