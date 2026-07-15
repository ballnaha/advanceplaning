'use client';

import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  Calendar,
  Clock,
  Data,
  InfoCircle,
  StatusUp,
  TaskSquare,
  TickCircle,
  Warning2,
} from 'iconsax-react';
import DayTimeline, { type TimelineOperation } from './DayTimeline';
import DailyLoadHeatmap from './DailyLoadHeatmap';

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

function SummaryCard({
  label,
  value,
  detail,
  icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        minHeight: 132,
        borderRadius: 3,
        border: '1px solid rgba(15, 23, 42, 0.07)',
        background: `radial-gradient(circle at 100% 0%, ${accent}16, transparent 48%), #ffffff`,
      }}
    >
      <Stack spacing={1.4}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 34, height: 34, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: `${accent}12` }}>
            {icon}
          </Box>
          <Typography sx={{ color: '#64748b', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.03em' }}>
            {label}
          </Typography>
        </Stack>
        <Box>
          <Typography sx={{ color: '#0f172a', fontSize: '1.55rem', lineHeight: 1.05, fontWeight: 950 }}>
            {value}
          </Typography>
          <Typography sx={{ mt: 0.45, color: '#64748b', fontSize: '0.72rem', fontWeight: 650 }}>
            {detail}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

function ReadinessRow({ item }: { item: WorkCenterReadiness }) {
  const hasData = item.operations > 0;
  return (
    <Paper elevation={0} sx={{ p: 1.6, borderRadius: 2.5, border: '1px solid #e2e8f0', bgcolor: hasData ? '#ffffff' : '#f8fafc' }}>
      <Stack spacing={1.1}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box>
            <Typography sx={{ color: '#0f172a', fontSize: '0.86rem', fontWeight: 950 }}>WC {item.workCenter}</Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.68rem' }}>
              {hasData ? `${numberFormatter.format(item.operations)} Operations · ${numberFormatter.format(item.orders)} Orders` : 'ยังไม่มีงานใน DB'}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={hasData ? `${numberFormatter.format(item.totalHours)} ชม.` : 'NO DATA'}
            sx={{ height: 24, fontSize: '0.66rem', fontWeight: 900, color: hasData ? '#0369a1' : '#64748b', bgcolor: hasData ? '#e0f2fe' : '#e2e8f0' }}
          />
        </Stack>
        <Box>
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography sx={{ color: '#64748b', fontSize: '0.64rem', fontWeight: 800 }}>ความพร้อม OP Time</Typography>
            <Typography sx={{ color: hasData ? '#0f766e' : '#94a3b8', fontSize: '0.64rem', fontWeight: 900 }}>{item.opTimeCoverage}%</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={item.opTimeCoverage}
            sx={{ mt: 0.55, height: 6, borderRadius: 99, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { borderRadius: 99, bgcolor: hasData ? '#0d9488' : '#cbd5e1' } }}
          />
        </Box>
      </Stack>
    </Paper>
  );
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
          <Alert severity="success" icon={<TickCircle size="22" color="#15803d" variant="Bold" />} sx={{ borderRadius: 3, border: '1px solid #bbf7d0', bgcolor: '#f0fdf4' }}>
            <AlertTitle sx={{ fontWeight: 950 }}>เหมาะสำหรับเริ่ม Day Timeline</AlertTitle>
            Start Date และ Finish Date ครบ {summary.dateCoverage}% จึงสร้าง Timeline รายวันได้ทันที ส่วน Timeline ระดับชั่วโมงต้องเพิ่มข้อมูลเวลาและ Capacity Calendar ก่อน
          </Alert>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.25 }}>
            <SummaryCard label="OPERATIONS" value={numberFormatter.format(summary.operations)} detail={`${numberFormatter.format(summary.orders)} Orders`} icon={<TaskSquare size="19" color="#4f46e5" />} accent="#4f46e5" />
            <SummaryCard label="DATE COVERAGE" value={`${summary.dateCoverage}%`} detail={`${formatDate(summary.firstDate)} – ${formatDate(summary.lastDate)}`} icon={<Calendar size="19" color="#0284c7" />} accent="#0284c7" />
            <SummaryCard label="OP TIME COVERAGE" value={`${summary.opTimeCoverage}%`} detail={`${numberFormatter.format(summary.missingOpTime)} Operations ไม่มี OP Time`} icon={<Clock size="19" color="#0d9488" />} accent="#0d9488" />
            <SummaryCard label="CURRENT DATA" value={numberFormatter.format(summary.currentYearOperations)} detail={`${numberFormatter.format(summary.legacyOperations)} Operations เป็นข้อมูลปีก่อน`} icon={<StatusUp size="19" color="#d97706" />} accent="#d97706" />
          </Box>

          <DayTimeline
            initialDate={initialDate}
            operations={operations}
            workCenters={workCenters.map((item) => item.workCenter)}
          />

          <DailyLoadHeatmap
            initialDate={initialDate}
            operations={operations}
            workCenters={workCenters.map((item) => item.workCenter)}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.55fr) minmax(300px, 0.85fr)' }, gap: 1.5 }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.4 }, borderRadius: 3.5, border: '1px solid rgba(15, 23, 42, 0.07)' }}>
              <Stack spacing={1.5}>
                <Box>
                  <Typography sx={{ color: '#0f172a', fontWeight: 950 }}>ความพร้อมราย Work center</Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.72rem' }}>ข้อมูลที่ใช้วางความยาวของ Operation bar ใน Timeline</Typography>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1 }}>
                  {workCenters.map((item) => <ReadinessRow key={item.workCenter} item={item} />)}
                </Box>
              </Stack>
            </Paper>

            <Stack spacing={1.5}>
              <Paper elevation={0} sx={{ p: 2.2, borderRadius: 3.5, border: '1px solid #fde68a', bgcolor: '#fffbeb' }}>
                <Stack spacing={1.2}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Warning2 size="20" color="#d97706" variant="Bold" />
                    <Typography sx={{ color: '#92400e', fontWeight: 950 }}>ข้อมูลที่ยังขาด</Typography>
                  </Stack>
                  {[
                    'เวลาเริ่ม–จบระดับชั่วโมง (ข้อมูลปัจจุบันเป็นระดับวัน)',
                    'กำลังการผลิตต่อวันและ Shift Calendar',
                    'วันหยุด, Downtime และ Maintenance',
                    'ความสามารถของแต่ละ Work center ต่อ OP',
                  ].map((text) => (
                    <Stack key={text} direction="row" spacing={0.8} sx={{ alignItems: 'flex-start' }}>
                      <Box sx={{ mt: 0.65, width: 5, height: 5, flexShrink: 0, borderRadius: '50%', bgcolor: '#f59e0b' }} />
                      <Typography sx={{ color: '#78350f', fontSize: '0.73rem', lineHeight: 1.45 }}>{text}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ p: 2.2, borderRadius: 3.5, border: '1px solid #c7d2fe', bgcolor: '#eef2ff' }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <InfoCircle size="20" color="#4f46e5" variant="Bold" />
                  <Box>
                    <Typography sx={{ color: '#3730a3', fontWeight: 950 }}>ขั้นตอนถัดไปหลังตรวจ Day Timeline</Typography>
                    <Typography sx={{ mt: 0.4, color: '#4338ca', fontSize: '0.73rem', lineHeight: 1.5 }}>
                      เพิ่ม Capacity Calendar และ Shift เพื่อคำนวณโหลดต่อวันให้ถูกต้อง ก่อนเปิด Drag & Drop หรือ Timeline ระดับชั่วโมง
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </Box>

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
