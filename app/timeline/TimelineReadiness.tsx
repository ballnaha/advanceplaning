'use client';

import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Data } from 'iconsax-react';
import DayTimeline, { type TimelineOperation } from './DayTimeline';

type Summary = {
  operations: number;
  orders: number;
  dateCoverage: number;
  opTimeCoverage: number;
  missingOpTime: number;
  currentYearOperations: number;
  legacyOperations: number;
  firstDate: string | null;
  lastDate: string | null;
};

type WorkCenterReadiness = {
  workCenter: string;
  operations: number;
  orders: number;
  totalHours: number;
  dateCoverage: number;
  opTimeCoverage: number;
};

type Props = {
  generatedAt: string;
  initialDate: string;
  operations: TimelineOperation[];
  summary: Summary;
  workCenters: WorkCenterReadiness[];
};

const numberFormatter = new Intl.NumberFormat('th-TH');
const dateFormatter = new Intl.DateTimeFormat('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(`${value}T00:00:00`)) : '-';
}



export default function TimelineReadiness({ generatedAt, initialDate, operations, summary, workCenters }: Props) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f3f6fa' }}>
      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: { xs: 1.5, sm: 2, lg: 3, xl: 4 }, py: { xs: 2, md: 3 } }}
      >
        <Stack spacing={2.25}>



          <DayTimeline
            initialDate={initialDate}
            operations={operations}
            workCenters={workCenters.map((item) => item.workCenter)}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.75} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', px: 0.5 }}>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.66rem' }}>Snapshot: {new Date(generatedAt).toLocaleString('th-TH')}</Typography>
            <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
              <Data size="14" color="#94a3b8" />
              <Typography sx={{ color: '#94a3b8', fontSize: '0.66rem' }}>อ่านข้อมูลจาก production_jobs โดยไม่แก้ไข DB</Typography>
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
