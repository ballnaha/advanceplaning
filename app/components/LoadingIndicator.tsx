'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';

type LoadingIndicatorProps = {
  title?: string;
  subtitle?: string | null;
  fullscreen?: boolean;
};

export default function LoadingIndicator({
  title = 'กำลังโหลดข้อมูลแผนการผลิต',
  subtitle = 'ระบบกำลังอ่านข้อมูลและจัดเตรียมคิวงาน',
  fullscreen = false,
}: LoadingIndicatorProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        p: 3,
        ...(fullscreen
          ? {
              minHeight: '100vh',
              bgcolor: '#f8fafc',
            }
          : {
              p: 4.5,
              borderRadius: '24px',
              bgcolor: 'rgba(255, 255, 255, 0.85)',
              boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
              border: '1px solid rgba(15, 23, 42, 0.04)',
              backdropFilter: 'blur(12px)',
            }),
      }}
    >
      <div
        className="planning-loading-spinner"
        style={{ margin: '0 auto 20px' }}
      />
      {title && (
        <Typography
          sx={{
            fontSize: fullscreen ? '1.25rem' : '1rem',
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.3,
          }}
        >
          {title}
        </Typography>
      )}
      {subtitle && (
        <Typography
          sx={{
            mt: 1,
            fontSize: fullscreen ? '0.88rem' : '0.78rem',
            color: '#64748b',
            fontWeight: 650,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
