'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { theme } from './theme';
import { NavigationProvider } from './NavigationContext';

export default function MuiProvider({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NavigationProvider>{children}</NavigationProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
