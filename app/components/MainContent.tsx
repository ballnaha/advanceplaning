import React from 'react';
import { Box } from '@mui/material';

export default function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="main"
      sx={{
        flex: '1 0 auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {children}
    </Box>
  );
}
