'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Button, Container, Stack, Typography, IconButton, Tooltip } from '@mui/material';
import { Book1, Calendar, Category, ChartSquare, Data, Login } from 'iconsax-react';
import { useNavigation } from '../NavigationContext';

const navigation = [
  { label: 'แดชบอร์ดหลัก', title: 'Planning Dashboard', href: '/', icon: Category },
  { label: 'ไทม์ไลน์เครื่องจักร', title: 'Resource Timeline', href: '/timeline', icon: Calendar },
  { label: 'คู่มือการใช้งาน', title: 'คู่มือการใช้งาน', href: '/guide', icon: Book1 },
] as const;

function isActivePath(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export default function ApplicationHeader() {
  const pathname = usePathname();
  const { isNavigating, activePath, startNavigation } = useNavigation();

  const isUploadActive = isActivePath(activePath, '/upload');

  return (
    <Box
      component="header"
      sx={{
        position: 'relative',
        zIndex: 100,
        bgcolor: 'rgba(255, 255, 255, 0.75)',
        borderBottom: '1px solid rgba(15, 23, 42, 0.05)',
        backdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 4px 30px rgba(15, 23, 42, 0.015)',
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* Loading Progress Bar */}
      {isNavigating && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '30%',
            height: '3px',
            background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
            zIndex: 1010,
            animation: 'loadingProgress 1.6s infinite ease-in-out',
            borderRadius: '0 9999px 9999px 0',
            boxShadow: '0 0 8px rgba(99, 102, 241, 0.5)',
          }}
        />
      )}

      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: { xs: 2, sm: 3, md: 4 } }}
      >
        <Stack
          direction="row"
          spacing={{ xs: 1.5, md: 3 }}
          sx={{ minHeight: 76, alignItems: 'center', justifyContent: 'space-between' }}
        >
          {/* Logo Section */}
          <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0, alignItems: 'center' }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '12px',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #06b6d4 100%)',
                boxShadow: '0 8px 20px rgba(79, 70, 229, 0.22)',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'rotate(8deg) scale(1.06)',
                  boxShadow: '0 12px 24px rgba(79, 70, 229, 0.35)',
                },
              }}
              component={Link}
              href="/"
              onClick={() => startNavigation('/')}
            >
              <ChartSquare size="23" color="currentColor" variant="Bold" />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography sx={{ color: '#0f172a', fontSize: '0.94rem', fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  PSC Advance Planning
                </Typography>

              </Stack>
              <Typography sx={{ display: { xs: 'none', sm: 'block' }, mt: 0.25, color: '#64748b', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em' }}>
                PRODUCTION PLANNING SYSTEM
              </Typography>
            </Box>
          </Stack>

          {/* Navigation Section */}
          {(() => {
            const activeIndex = navigation.findIndex((item) => isActivePath(activePath, item.href));
            const hasActive = activeIndex !== -1;
            const itemWidthPercent = 100 / navigation.length;

            return (
              <Stack
                component="nav"
                aria-label="เมนูหลัก"
                direction="row"
                spacing={0}
                sx={{
                  position: 'relative',
                  minWidth: { xs: 260, sm: 360, md: 420 },
                  p: 0.5,
                  borderRadius: '9999px',
                  bgcolor: 'rgba(15, 23, 42, 0.038)',
                  border: '1px solid rgba(15, 23, 42, 0.03)',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' },
                }}
              >
                {/* iOS Sliding Capsule */}
                {hasActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 4,
                      bottom: 4,
                      left: `calc(4px + ${activeIndex} * ${itemWidthPercent}%)`,
                      width: `calc(${itemWidthPercent}% - 8px)`,
                      borderRadius: '9999px',
                      bgcolor: '#ffffff',
                      boxShadow: '0 3px 8px rgba(15, 23, 42, 0.07), 0 1px 3px rgba(15, 23, 42, 0.03)',
                      transition: 'left 320ms cubic-bezier(0.16, 1, 0.3, 1)',
                      zIndex: 1,
                    }}
                  />
                )}

                {navigation.map((item, idx) => {
                  const active = activeIndex === idx;
                  const Icon = item.icon;
                  return (
                    <Box
                      key={item.href}
                      component={Link}
                      href={item.href}
                      prefetch={false}
                      onClick={() => startNavigation(item.href)}
                      aria-current={active ? 'page' : undefined}
                      sx={{
                        flex: 1,
                        position: 'relative',
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.8,
                        px: { xs: 1, md: 2 },
                        py: 0.85,
                        borderRadius: '9999px',
                        color: active ? '#4f46e5' : '#64748b',
                        textDecoration: 'none',
                        fontSize: '0.82rem',
                        fontWeight: active ? 900 : 700,
                        whiteSpace: 'nowrap',
                        transition: 'color 250ms ease, font-weight 250ms ease',
                        '&:hover': {
                          color: active ? '#4f46e5' : '#0f172a',
                        },
                      }}
                    >
                      <Icon size="16" color="currentColor" variant={active ? 'Bold' : 'Linear'} />
                      <Box component="span" sx={{ display: { xs: active ? 'inline' : 'none', md: 'inline' } }}>
                        {item.label}
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            );
          })()}

          {/* Right Side Action */}
          <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0, alignItems: 'center' }}>
            <Tooltip title="นำเข้าแผนผลิต" arrow>
              <IconButton
                component={Link}
                href="/upload"
                onClick={() => startNavigation('/upload')}
                sx={{
                  color: isUploadActive ? '#4f46e5' : '#64748b',
                  bgcolor: isUploadActive ? 'rgba(79, 70, 229, 0.08)' : 'rgba(15, 23, 42, 0.02)',
                  border: '1px solid',
                  borderColor: isUploadActive ? 'rgba(79, 70, 229, 0.2)' : 'rgba(15, 23, 42, 0.06)',
                  p: 1.1,
                  borderRadius: '9999px',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    color: '#4f46e5',
                    bgcolor: 'rgba(79, 70, 229, 0.08)',
                    borderColor: 'rgba(79, 70, 229, 0.25)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.08)',
                  },
                }}
              >
                <Data size="18" variant={isUploadActive ? 'Bold' : 'Linear'} color="currentColor" />
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              size="small"
              startIcon={<Login size="16" color="currentColor" />}
              sx={{
                borderRadius: '9999px',
                px: 2.5,
                py: 0.75,
                fontSize: '0.8rem',
                fontWeight: 800,
                color: '#4f46e5',
                borderColor: 'rgba(79, 70, 229, 0.25)',
                bgcolor: 'rgba(79, 70, 229, 0.04)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  borderColor: '#4f46e5',
                  bgcolor: 'rgba(79, 70, 229, 0.08)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.08)',
                },
              }}
            >
              Login
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}


