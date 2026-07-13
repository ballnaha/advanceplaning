'use client';

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4f46e5', // Rich Indigo
      light: '#6366f1',
      dark: '#3730a3',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#06b6d4', // Liquid Cyan
      light: '#22d3ee',
      dark: '#0891b2',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f1f4f9', // Crisp cool white grey
      paper: 'rgba(255, 255, 255, 0.45)', // Highly translucent liquid glass
    },
    text: {
      primary: '#0f172a', // Slate 900
      secondary: '#475569', // Slate 600
    },
    divider: 'rgba(15, 23, 42, 0.06)',
  },
  typography: {
    fontFamily: 'var(--font-sarabun), "Sarabun", "Leelawadee UI", Tahoma, Arial, Helvetica, sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.03em',
      fontSize: '2.5rem',
      color: '#0f172a',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      fontSize: '2rem',
      color: '#0f172a',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
      fontSize: '1.6rem',
      color: '#0f172a',
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.35rem',
      color: '#0f172a',
    },
    h5: {
      fontWeight: 800,
      fontSize: '1.2rem',
      color: '#0f172a',
    },
    h6: {
      fontWeight: 850,
      fontSize: '1.1rem',
      color: '#0f172a',
    },
    subtitle1: {
      fontWeight: 850,
      fontSize: '1.05rem',
      color: '#0f172a',
    },
    subtitle2: {
      fontWeight: 850,
      fontSize: '0.95rem',
      color: '#0f172a',
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.6,
      color: '#1e293b', // Slate 800
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.55,
      color: '#334155', // Slate 700
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.45,
      color: '#475569', // Slate 600
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      fontSize: '0.875rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999, // Pill shape
          padding: '10px 24px',
          fontSize: '0.875rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 30px rgba(79, 70, 229, 0.16)',
          },
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.18)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)',
            },
          },
          '&.MuiButton-outlined': {
            borderColor: 'rgba(15, 23, 42, 0.1)',
            color: '#0f172a',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              borderColor: 'rgba(15, 23, 42, 0.25)',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 24,
          border: '1px solid rgba(15, 23, 42, 0.06)',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.04)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          padding: '8px 12px',
          borderColor: 'rgba(15, 23, 42, 0.08)',
        },
        head: {
          fontWeight: 800,
          fontSize: '0.875rem',
          backgroundColor: '#f8fafc',
          color: '#0f172a',
        },
      },
    },
  },
});
