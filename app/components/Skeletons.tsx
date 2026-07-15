'use client';

import React from 'react';
import { Box, Container, Paper, Stack, Skeleton, Divider } from '@mui/material';

// ----------------------------------------------------
// 1. Dashboard Skeleton Components
// ----------------------------------------------------

function DashboardMetricCards() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
        gap: 1.5,
      }}
    >
      {[0, 1, 2, 3, 4].map((item) => (
        <Paper
          key={item}
          variant="outlined"
          sx={{
            p: 1.75,
            borderRadius: 1.5,
            borderColor: 'rgba(15, 23, 42, 0.08)',
            boxShadow: 'none',
          }}
        >
          <Stack spacing={1}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width="68%" height={18} />
            <Skeleton variant="text" width="52%" height={30} />
          </Stack>
        </Paper>
      ))}
    </Box>
  );
}

function DashboardLoadSummaries() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.25fr 0.75fr' }, gap: 2 }}>
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Skeleton variant="text" width={190} height={28} sx={{ mb: 1 }} />
        <Stack spacing={1.5}>
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <Box key={item}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
                <Skeleton variant="text" width={72} height={22} />
                <Skeleton variant="text" width={58} height={22} />
              </Stack>
              <Skeleton variant="rounded" width="100%" height={8} sx={{ borderRadius: 999 }} />
            </Box>
          ))}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Skeleton variant="text" width={210} height={28} sx={{ mb: 1 }} />
        <Stack spacing={1}>
          {[0, 1, 2, 3, 4].map((item) => (
            <Stack key={item} direction="row" sx={{ justifyContent: 'space-between', gap: 1, alignItems: 'center' }}>
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="76%" height={22} />
                <Skeleton variant="text" width="48%" height={18} />
              </Box>
              <Skeleton variant="rounded" width={64} height={24} />
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}

function DashboardWorkCenterTable({ workCenter }: { workCenter: string }) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 2 }}
      >
        <Box sx={{ minWidth: 240 }}>
          <Skeleton variant="text" width={150} height={28} />
          <Skeleton variant="text" width={260} height={24} sx={{ mt: 0.5 }} />
        </Box>
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={120} height={32} />
          <Skeleton variant="rounded" width={112} height={32} />
        </Stack>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {[0, 1].map((groupIndex) => (
        <Box key={groupIndex} sx={{ mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.25,
              borderRadius: 1.5,
              bgcolor: 'rgba(15, 23, 42, 0.035)',
              borderLeft: '5px solid rgba(79, 70, 229, 0.28)',
            }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Skeleton variant="text" width={150} height={24} />
              <Skeleton variant="rounded" width={54} height={20} />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
              <Skeleton variant="text" width={90} />
              <Skeleton variant="text" width={110} />
              <Skeleton variant="text" width={96} />
            </Stack>
          </Box>
          <Box sx={{ mt: 1, border: '1px solid rgba(15, 23, 42, 0.06)', borderRadius: 1.5, overflow: 'hidden' }}>
            {[0, 1, 2].map((rowIndex) => (
              <Box
                key={rowIndex}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '56px minmax(140px, 1fr) 96px 96px',
                    md: '72px minmax(220px, 1fr) 120px 130px 130px 130px 96px 190px 110px 110px 96px 100px',
                  },
                  gap: 1.25,
                  alignItems: 'center',
                  px: 1.5,
                  py: 1.25,
                  borderTop: rowIndex === 0 ? 0 : '1px solid rgba(15, 23, 42, 0.05)',
                }}
              >
                <Skeleton variant="rounded" width={38} height={22} />
                <Skeleton variant="text" height={24} />
                <Skeleton variant="text" height={24} />
                <Skeleton variant="text" height={24} />
                <Skeleton variant="text" height={24} sx={{ display: { xs: 'none', md: 'block' } }} />
                <Skeleton variant="text" height={24} sx={{ display: { xs: 'none', md: 'block' } }} />
                <Skeleton variant="text" height={24} sx={{ display: { xs: 'none', md: 'block' } }} />
                <Skeleton variant="text" height={24} sx={{ display: { xs: 'none', md: 'block' } }} />
                <Skeleton variant="text" height={24} sx={{ display: { xs: 'none', md: 'block' } }} />
                <Skeleton variant="text" height={24} sx={{ display: { xs: 'none', md: 'block' } }} />
                <Skeleton variant="rounded" width={58} height={24} sx={{ display: { xs: 'none', md: 'block' } }} />
                <Skeleton variant="rounded" width={72} height={30} sx={{ display: { xs: 'none', md: 'block' } }} />
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Paper>
  );
}

export function DashboardSkeleton() {
  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{ px: { xs: 1.5, sm: 2, lg: 3, xl: 4 }, py: { xs: 2, md: 3 } }}
    >
      <Stack spacing={2.25}>
        {/* Work Center horizontal filter skeleton */}
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto' }}>
            {[111001, 111002, 111003, 111004, 111005].map((wc) => (
              <Skeleton key={wc} variant="rounded" width={132} height={40} sx={{ borderRadius: 1.5 }} />
            ))}
          </Stack>
        </Paper>

        <DashboardMetricCards />
        <DashboardLoadSummaries />
        <DashboardWorkCenterTable workCenter="111001" />
      </Stack>
    </Container>
  );
}

// ----------------------------------------------------
// 2. Timeline Skeleton Components
// ----------------------------------------------------

export function TimelineSkeleton() {
  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{ px: { xs: 1.5, sm: 2, lg: 3, xl: 4 }, py: { xs: 2, md: 3 } }}
    >
      <Stack spacing={2.25}>
        {/* Top Alert Banner Skeleton */}
        <Skeleton variant="rounded" width="100%" height={68} sx={{ borderRadius: 3 }} />


        {/* Machine Timeline Table Skeleton */}
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={2}>
            {/* Header row */}
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton variant="text" width={180} height={28} />
              <Stack direction="row" spacing={1}>
                <Skeleton variant="rounded" width={90} height={32} />
                <Skeleton variant="rounded" width={90} height={32} />
              </Stack>
            </Stack>

            {/* Timetable grid mock */}
            <Box sx={{ border: '1px solid rgba(15, 23, 42, 0.06)', borderRadius: 2, overflow: 'hidden' }}>
              {/* Header Columns */}
              <Box sx={{ display: 'flex', bgcolor: '#f8fafc', p: 1.5, borderBottom: '1px solid #e2e8f0' }}>
                <Skeleton variant="text" width={120} height={22} sx={{ mr: 'auto' }} />
                <Stack direction="row" spacing={4} sx={{ width: '70%', justifyContent: 'space-around' }}>
                  <Skeleton variant="text" width={60} height={22} />
                  <Skeleton variant="text" width={60} height={22} />
                  <Skeleton variant="text" width={60} height={22} />
                  <Skeleton variant="text" width={60} height={22} />
                  <Skeleton variant="text" width={60} height={22} />
                </Stack>
              </Box>

              {/* Rows */}
              {[0, 1, 2].map((row) => (
                <Box key={row} sx={{ display: 'flex', p: 2, borderBottom: row === 2 ? 0 : '1px solid rgba(15, 23, 42, 0.05)', alignItems: 'center' }}>
                  <Box sx={{ mr: 'auto', minWidth: 120 }}>
                    <Skeleton variant="text" width={90} height={24} />
                    <Skeleton variant="text" width={60} height={18} sx={{ mt: 0.5 }} />
                  </Box>
                  <Stack direction="row" spacing={2} sx={{ width: '70%', alignItems: 'center' }}>
                    <Skeleton variant="rounded" width="100%" height={32} />
                  </Stack>
                </Box>
              ))}
            </Box>
          </Stack>
        </Paper>

        {/* Heatmap Section skeleton */}
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack spacing={2}>
            <Skeleton variant="text" width={220} height={28} />
            <Box sx={{ display: 'flex', height: 160, gap: 1, alignItems: 'flex-end', p: 2 }}>
              {[...Array(24)].map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  width="100%"
                  height={`${20 + Math.sin(i) * 50 + Math.cos(i) * 30}%`}
                  sx={{ borderRadius: 1 }}
                />
              ))}
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
