'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Container, Stack, Typography } from '@mui/material';
import { Book1, Calendar, Category, ChartSquare, Data } from 'iconsax-react';

const navigation = [
  { label: 'Dashboard', title: 'Planning Dashboard', href: '/', icon: Category },
  { label: 'Resource Timeline', title: 'Resource Timeline', href: '/timeline', icon: Calendar },
  { label: 'นำเข้าข้อมูล', title: 'นำเข้าข้อมูล Excel', href: '/upload', icon: Data },
  { label: 'คู่มือ', title: 'คู่มือการใช้งาน', href: '/guide', icon: Book1 },
] as const;

function isActivePath(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export default function ApplicationHeader() {
  const pathname = usePathname();
  const currentPage = navigation.find((item) => isActivePath(pathname, item.href));

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        bgcolor: 'rgba(255, 255, 255, 0.96)',
        borderBottom: '1px solid #e2e8f0',
        backdropFilter: 'blur(16px)',
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: { xs: 1.5, sm: 2, lg: 3, xl: 4 } }}
      >
        <Stack
          direction="row"
          spacing={{ xs: 1, md: 2 }}
          sx={{ minHeight: 68, alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1.1} sx={{ flexShrink: 0, alignItems: 'center' }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 2.25,
                color: '#ffffff',
                background: 'linear-gradient(145deg, #0284c7 0%, #4f46e5 100%)',
                boxShadow: '0 7px 18px rgba(37, 99, 235, 0.2)',
              }}
            >
              <ChartSquare size="21" color="currentColor" variant="Bold" />
            </Box>
            <Box>
              <Typography sx={{ color: '#0f172a', fontSize: '0.88rem', fontWeight: 950, lineHeight: 1.15 }}>
                PSC Advance Planning
              </Typography>
              <Typography sx={{ display: { xs: 'none', sm: 'block' }, mt: 0.15, color: '#94a3b8', fontSize: '0.59rem', fontWeight: 750, letterSpacing: '0.04em' }}>
                PRODUCTION PLANNING SYSTEM
              </Typography>
            </Box>
          </Stack>

          <Stack
            component="nav"
            aria-label="เมนูหลัก"
            direction="row"
            spacing={0.35}
            sx={{
              minWidth: 0,
              px: 0.4,
              py: 0.4,
              overflowX: 'auto',
              borderRadius: 2.25,
              bgcolor: '#f8fafc',
              border: '1px solid #eef2f7',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {navigation.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <Box
                  key={item.href}
                  component={Link}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  sx={{
                    display: 'flex',
                    flexShrink: 0,
                    alignItems: 'center',
                    gap: 0.65,
                    px: { xs: 1, md: 1.25 },
                    py: 0.75,
                    borderRadius: 1.7,
                    color: active ? '#1d4ed8' : '#64748b',
                    bgcolor: active ? '#ffffff' : 'transparent',
                    boxShadow: active ? '0 2px 8px rgba(15, 23, 42, 0.08)' : 'none',
                    textDecoration: 'none',
                    fontSize: '0.7rem',
                    fontWeight: active ? 900 : 750,
                    whiteSpace: 'nowrap',
                    '&:hover': { color: active ? '#1d4ed8' : '#334155', bgcolor: '#ffffff' },
                  }}
                >
                  <Icon size="15" color="currentColor" variant={active ? 'Bold' : 'Linear'} />
                  <Box component="span" sx={{ display: { xs: active ? 'inline' : 'none', md: 'inline' } }}>
                    {item.label}
                  </Box>
                </Box>
              );
            })}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', lg: 'flex' }, flexShrink: 0, alignItems: 'center' }}>
            <Box sx={{ display: { xs: 'none', lg: 'block' }, textAlign: 'right' }}>
              <Typography sx={{ color: '#0f172a', fontSize: '0.72rem', fontWeight: 900, lineHeight: 1.15 }}>
                {currentPage?.title ?? 'PSC Planning'}
              </Typography>
              <Typography sx={{ mt: 0.2, color: '#94a3b8', fontSize: '0.59rem', fontWeight: 700 }}>
                Advance Planning
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
