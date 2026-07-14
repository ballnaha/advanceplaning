'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Alert, Box, Button, Chip, Container, FormControl, InputLabel, MenuItem,
  Paper, Select, Stack, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography,
} from '@mui/material';
import type { PlanningJob } from '@/lib/planning';
import { generateSafeLqScenario } from '@/lib/planning-scenario';

type Props = { jobs: PlanningJob[]; dataGeneratedAt: string };
type ScenarioValue = ReturnType<typeof generateSafeLqScenario>;
const formatter = new Intl.NumberFormat('th-TH');

function TextSelect({ label, value, setValue, items }: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  items: string[][];
}) {
  const id = `scenario-${label}`;
  return (
    <FormControl size={'small'} sx={{ minWidth: 130 }}>
      <InputLabel id={id}>{label}</InputLabel>
      <Select labelId={id} label={label} value={value} onChange={(event) => setValue(event.target.value)}>
        {items.map(([key, text]) => <MenuItem key={key} value={key}>{text}</MenuItem>)}
      </Select>
    </FormControl>
  );
}

export default function ScenarioPreviewClient({ jobs, dataGeneratedAt }: Props) {
  const workCenters = React.useMemo(
    () => [...new Set(jobs.map((job) => job.arbpl))].sort((a, b) => a.localeCompare(b, 'th', { numeric: true })),
    [jobs],
  );
  const years = React.useMemo(
    () => [...new Set(jobs.flatMap((job) => job.stdate ? [job.stdate.slice(0, 4)] : []))].sort().reverse(),
    [jobs],
  );
  const recommendedWorkCenter = React.useMemo(() => workCenters
    .map((item) => ({ item, result: generateSafeLqScenario(jobs.filter((job) => job.arbpl === item)) }))
    .sort((a, b) => (b.result.before.lqChanges - b.result.after.lqChanges) - (a.result.before.lqChanges - a.result.after.lqChanges))[0]?.item, [jobs, workCenters]);
  const [workCenter, setWorkCenter] = React.useState(recommendedWorkCenter ?? workCenters[0] ?? '');
  const [year, setYear] = React.useState('ALL');
  const [month, setMonth] = React.useState('ALL');
  const [freezeHeadCount, setFreezeHeadCount] = React.useState(0);
  const scopedJobs = React.useMemo(() => jobs.filter((job) => {
    if (job.arbpl !== workCenter) return false;
    if (year !== 'ALL' && job.stdate?.slice(0, 4) !== year) return false;
    return month === 'ALL' || job.stdate?.slice(5, 7) === month;
  }), [jobs, month, workCenter, year]);
  const scenario = React.useMemo(
    () => generateSafeLqScenario(scopedJobs, { freezeHeadCount }),
    [freezeHeadCount, scopedJobs],
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fb', py: 3 }}>
      <Container maxWidth={'xl'}><Stack spacing={2.5}>
        <ScenarioHeader />
        <Alert severity={'info'} sx={{ borderRadius: 3 }}>Preview นี้ไม่แก้ฐานข้อมูล และยังไม่คำนวณเวลาจบจริงจาก Capacity หรือปฏิทินกะ</Alert>
        <ScenarioFilters values={{ workCenter, year, month, freezeHeadCount }} options={{ workCenters, years }} setters={{ setWorkCenter, setYear, setMonth, setFreezeHeadCount }} snapshot={dataGeneratedAt} ruleVersion={scenario.ruleVersion} />
        <MetricGrid scenario={scenario} />
        <ConstraintPanel scenario={scenario} jobCount={scopedJobs.length} />
        <ChangeTable scenario={scenario} />
      </Stack></Container>
    </Box>
  );
}

function ScenarioHeader() {
  return <Paper sx={{ p: 3, color: '#fff', bgcolor: '#312e81' }}><Stack direction={'row'} sx={{ justifyContent: 'space-between' }}><Box><Typography variant={'h4'}>Safe L/Q Optimization</Typography><Typography>Preview แผนลดการเปลี่ยน L/Q</Typography></Box><Button component={Link} href={'/'} sx={{ color: '#fff' }}>กลับ Dashboard</Button></Stack></Paper>;
}

type FilterProps = {
  values: { workCenter: string; year: string; month: string; freezeHeadCount: number };
  options: { workCenters: string[]; years: string[] };
  setters: { setWorkCenter: (v: string) => void; setYear: (v: string) => void; setMonth: (v: string) => void; setFreezeHeadCount: (v: number) => void };
  snapshot: string;
  ruleVersion: string;
};

function ScenarioFilters(props: FilterProps) {
  return <Paper variant={'outlined'} sx={{ p: 2.5 }}><FilterFields {...props} /></Paper>;
}

function FilterFields(props: FilterProps) {
  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5}>
      <FilterIdentity {...props} />
      <FilterSelectors {...props} />
    </Stack>
  );
}

function FilterIdentity({ snapshot, ruleVersion }: FilterProps) {
  return (
    <Box sx={{ flex: 1 }}>
      <Typography sx={{ fontWeight: 900 }}>ขอบเขต Scenario</Typography>
      <Typography variant={'caption'}>{new Date(snapshot).toLocaleString('th-TH')} · {ruleVersion}</Typography>
    </Box>
  );
}

function FilterSelectors(props: FilterProps) {
  return <Stack direction={'row'}><PrimarySelectors {...props} /><SpecialSelectors {...props} /></Stack>;
}

function PrimarySelectors({ values, options, setters }: FilterProps) {
  const years = [['ALL', 'ทุกปี'], ...options.years.map((v) => [v, String(Number(v) + 543)])];
  return <><TextSelect label={'Work Center'} value={values.workCenter} setValue={setters.setWorkCenter} items={options.workCenters.map((v) => [v, v])} /><TextSelect label={'ปี'} value={values.year} setValue={setters.setYear} items={years} /></>;
}

function SpecialSelectors({ values, setters }: FilterProps) {
  return <><MonthSelect value={values.month} setValue={setters.setMonth} /><FreezeSelect value={values.freezeHeadCount} setValue={setters.setFreezeHeadCount} /></>;
}

function MonthSelect({ value, setValue }: { value: string; setValue: (v: string) => void }) {
  const items = [['ALL', 'ทุกเดือน'], ...Array.from({ length: 12 }, (_, i) => [String(i + 1).padStart(2, '0'), `เดือน ${i + 1}`])];
  return <TextSelect label={'เดือน'} value={value} setValue={setValue} items={items} />;
}

function FreezeSelect({ value, setValue }: { value: number; setValue: (v: number) => void }) {
  return <FormControl size={'small'} sx={{ minWidth: 140 }}><InputLabel id={'freeze'}>Freeze</InputLabel><Select labelId={'freeze'} label={'Freeze'} value={value} onChange={(event) => setValue(Number(event.target.value))}>{[0, 1, 2, 3, 5].map((item) => <MenuItem key={item} value={item}>{item ? `${item} งานแรก` : 'ไม่ Freeze'}</MenuItem>)}</Select></FormControl>;
}

function MetricGrid({ scenario }: { scenario: ScenarioValue }) {
  const metrics = [
    ['เปลี่ยน L/Q', scenario.before.lqChanges, scenario.after.lqChanges],
    ['เปลี่ยนขนาด', scenario.before.sizeChanges, scenario.after.sizeChanges],
    ['เปลี่ยนสี', scenario.before.colorChanges, scenario.after.colorChanges],
    ['งานถูกขยับ', 0, scenario.after.movedJobs],
    ['คะแนน', scenario.before.score, scenario.after.score],
  ] as const;
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(5,1fr)' }, gap: 1.5 }}>{metrics.map(([label, before, after]) => <MetricCard key={label} label={label} before={before} after={after} />)}</Box>;
}

function MetricCard({ label, before, after }: { label: string; before: number; after: number }) {
  const better = after < before;
  return (
    <Paper variant={'outlined'} sx={{ p: 2, borderRadius: 3 }}>
      <Typography variant={'caption'} color={'text.secondary'}>{label}</Typography>
      <Typography variant={'h5'} sx={{ fontWeight: 950, color: better ? '#047857' : '#312e81' }}>{formatter.format(before)} → {formatter.format(after)}</Typography>
      <Chip size={'small'} label={after === before ? 'คงเดิม' : `${after - before > 0 ? '+' : ''}${formatter.format(after - before)}`} />
    </Paper>
  );
}

function ConstraintPanel({ scenario, jobCount }: { scenario: ScenarioValue; jobCount: number }) {
  return (
    <Paper variant={'outlined'} sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack direction={'row'} sx={{ justifyContent: 'space-between', mb: 1.5 }}>
        <Box><Typography sx={{ fontWeight: 950 }}>Constraint validation</Typography><Typography variant={'caption'}>{formatter.format(jobCount)} Operations</Typography></Box>
        <Chip label={scenario.improved ? 'ลด L/Q ได้' : 'คิวเดิมเหมาะสมแล้ว'} color={scenario.improved ? 'success' : 'default'} />
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, gap: 1 }}>
        {scenario.constraints.map((item) => <ConstraintItem key={item.id} label={item.label} detail={item.detail} passed={item.passed} />)}
      </Box>
      <Alert severity={'warning'} sx={{ mt: 2 }}>ยังไม่เปิด Apply เพื่อให้ Planner ตรวจผลก่อนเชื่อมการบันทึกคิวจริง</Alert>
    </Paper>
  );
}

function ConstraintItem({ label, detail, passed }: { label: string; detail: string; passed: boolean }) {
  return <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: passed ? '#f0fdf4' : '#fef2f2' }}><Typography sx={{ fontWeight: 900, fontSize: '.82rem' }}>{passed ? '✓' : '!'} {label}</Typography><Typography sx={{ color: '#64748b', fontSize: '.72rem' }}>{detail}</Typography></Box>;
}

function ChangeTable({ scenario }: { scenario: ScenarioValue }) {
  return (
    <Paper variant={'outlined'} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}><Typography sx={{ fontWeight: 950 }}>Sequence changes</Typography><Typography variant={'caption'}>{formatter.format(scenario.changes.length)} งานที่ตำแหน่งเปลี่ยน</Typography></Box>
      {scenario.changes.length === 0 ? <Alert severity={'success'}>ไม่พบตำแหน่งที่ลด L/Q ได้ใน Safe Block ปัจจุบัน</Alert> : <ChangesData changes={scenario.changes} />}
    </Paper>
  );
}

function ChangesData({ changes }: { changes: ScenarioValue['changes'] }) {
  return (
    <TableContainer sx={{ maxHeight: 520 }}><Table stickyHeader size={'small'}>
      <TableHead><TableRow>{['เดิม', 'เสนอ', 'Order', 'OP', 'L/Q Group', 'Finish Date'].map((label) => <TableCell key={label} sx={{ fontWeight: 900 }}>{label}</TableCell>)}</TableRow></TableHead>
      <TableBody>{changes.slice(0, 200).map((change) => <ChangeRow key={change.jobId} change={change} />)}</TableBody>
    </Table></TableContainer>
  );
}

function ChangeRow({ change }: { change: ScenarioValue['changes'][number] }) {
  return (
    <TableRow hover>
      <TableCell>{change.previousSequence}</TableCell><TableCell><Chip size={'small'} label={change.proposedSequence} /></TableCell>
      <TableCell sx={{ fontWeight: 850 }}>{change.order}</TableCell><TableCell>{change.operation}</TableCell>
      <TableCell>{change.lqGroup}</TableCell><TableCell>{change.finishDate ? new Date(`${change.finishDate}T00:00:00`).toLocaleDateString('th-TH') : '-'}</TableCell>
    </TableRow>
  );
}
