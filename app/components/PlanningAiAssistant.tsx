'use client';

import * as React from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  Fab,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { PlanningJob } from '@/lib/planning';
import { analyzePlanning, answerPlanningLocally } from '@/lib/planning-analyzer';
import { DEFAULT_PLANNING_RULES } from '@/lib/planning-rules';

type PlanningAiAssistantProps = {
  jobs: PlanningJob[];
  scopeLabel: string;
};

type AssistantMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  source?: 'local' | 'deepseek';
};

type ProviderStatus = {
  configured: boolean;
  provider: string;
  model: string;
};

const quickQuestions = [
  'แผนปัจจุบันเปลี่ยน L/Q กี่ครั้ง?',
  'มีวิธีลดการเปลี่ยน L/Q โดยไม่ผิดกฎอย่างไร?',
  'Work Center ใดโหลดสูงที่สุด?',
  'มีลำดับ OP จุดใดที่ควรตรวจสอบ?',
];

function SparkIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2.8 13.6 8.4 19.2 10 13.6 11.6 12 17.2 10.4 11.6 4.8 10l5.6-1.6L12 2.8Z" fill="currentColor" />
      <path d="m18.5 15 .75 2.25L21.5 18l-2.25.75L18.5 21l-.75-2.25L15.5 18l2.25-.75L18.5 15Z" fill="currentColor" opacity=".72" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export default function PlanningAiAssistant({ jobs, scopeLabel }: PlanningAiAssistantProps) {
  const [open, setOpen] = React.useState(false);
  const [aiEnabled, setAiEnabled] = React.useState(false);
  const [providerStatus, setProviderStatus] = React.useState<ProviderStatus | null>(null);
  const [question, setQuestion] = React.useState('');
  const [messages, setMessages] = React.useState<AssistantMessage[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const nextMessageIdRef = React.useRef(1);
  const messageEndRef = React.useRef<HTMLDivElement | null>(null);
  const deferredJobs = React.useDeferredValue(jobs);
  const analysis = React.useMemo(
    () => analyzePlanning(deferredJobs, { scopeLabel, rules: DEFAULT_PLANNING_RULES }),
    [deferredJobs, scopeLabel],
  );

  React.useEffect(() => {
    if (!open || providerStatus) return;
    let active = true;
    void fetch('/api/ai/planning')
      .then(async (response) => {
        if (!response.ok) throw new Error('ตรวจสอบสถานะ AI ไม่สำเร็จ');
        return response.json() as Promise<ProviderStatus>;
      })
      .then((status) => {
        if (active) setProviderStatus(status);
      })
      .catch(() => {
        if (active) setProviderStatus({ configured: false, provider: 'DeepSeek', model: '-' });
      });
    return () => {
      active = false;
    };
  }, [open, providerStatus]);

  React.useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, submitting]);

  const appendMessage = React.useCallback((message: Omit<AssistantMessage, 'id'>) => {
    const next = { ...message, id: nextMessageIdRef.current };
    nextMessageIdRef.current += 1;
    setMessages((current) => [...current, next]);
  }, []);

  const submitQuestion = React.useCallback(async (rawQuestion?: string) => {
    const nextQuestion = (rawQuestion ?? question).trim();
    if (!nextQuestion || submitting) return;

    setQuestion('');
    setError('');
    appendMessage({ role: 'user', content: nextQuestion });

    if (!aiEnabled) {
      appendMessage({
        role: 'assistant',
        content: answerPlanningLocally(nextQuestion, analysis),
        source: 'local',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/ai/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: nextQuestion,
          analysis,
          history: messages.slice(-8).map(({ role, content }) => ({ role, content })),
        }),
      });
      const payload = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error || 'AI ไม่ได้ส่งคำตอบกลับมา');
      appendMessage({ role: 'assistant', content: payload.answer, source: 'deepseek' });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'เรียก AI ไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }, [aiEnabled, analysis, appendMessage, messages, question, submitting]);

  return (
    <>
      <Tooltip title={open ? 'ปิดผู้ช่วยวิเคราะห์แผน' : 'เปิดผู้ช่วยวิเคราะห์แผน'} placement="left" arrow>
        <Fab
          variant="extended"
          onClick={() => setOpen((current) => !current)}
          sx={{
            position: 'fixed',
            right: { xs: 16, md: 28 },
            bottom: { xs: 16, md: 28 },
            zIndex: 1150,
            px: 2,
            color: '#ffffff',
            bgcolor: '#312e81',
            fontWeight: 900,
            textTransform: 'none',
            boxShadow: '0 12px 30px rgba(49, 46, 129, 0.3)',
            '&:hover': { bgcolor: '#3730a3' },
          }}
        >
          <Box component="span" sx={{ display: 'inline-flex', mr: 0.8 }}><SparkIcon /></Box>
          AI วิเคราะห์แผน
        </Fab>
      </Tooltip>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 460 },
              maxWidth: '100vw',
              bgcolor: '#f8fafc',
              backgroundImage: 'none',
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ px: 2.25, py: 1.75, color: '#ffffff', bgcolor: '#172554' }}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box sx={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: 1.5, color: '#c7d2fe', bgcolor: 'rgba(255,255,255,.1)' }}>
                  <SparkIcon size={22} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.98rem', fontWeight: 950 }}>Planning AI Assistant</Typography>
                  <Typography sx={{ color: '#cbd5e1', fontSize: '0.7rem', fontWeight: 700 }}>{analysis.rules.version}</Typography>
                </Box>
              </Stack>
              <IconButton onClick={() => setOpen(false)} aria-label="ปิด" sx={{ color: '#ffffff' }}>
                <CloseIcon />
              </IconButton>
            </Stack>
            <Typography sx={{ mt: 1.2, color: '#dbeafe', fontSize: '0.76rem', lineHeight: 1.4 }}>
              {scopeLabel}
            </Typography>
          </Box>

          <Box sx={{ px: 2, py: 1.5 }}>
            <Paper variant="outlined" sx={{ p: 1.4, borderRadius: 2, bgcolor: '#ffffff' }}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Box>
                  <Typography sx={{ color: '#0f172a', fontSize: '0.82rem', fontWeight: 900 }}>เชื่อมต่อ DeepSeek AI</Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700 }}>
                    {providerStatus?.configured
                      ? `${providerStatus.model} · ส่งเฉพาะข้อมูลตาม Filter`
                      : 'Local Analyzer เท่านั้น · ยังไม่ส่งข้อมูลออก'}
                  </Typography>
                </Box>
                <Switch
                  checked={aiEnabled}
                  disabled={!providerStatus?.configured}
                  onChange={(event) => setAiEnabled(event.target.checked)}
                  slotProps={{ input: { 'aria-label': 'เปิดหรือปิด DeepSeek AI' } }}
                />
              </Stack>
              {providerStatus && !providerStatus.configured && (
                <Alert severity="info" sx={{ mt: 1, py: 0, fontSize: '0.7rem' }}>
                  ตั้งค่า DEEPSEEK_API_KEY ในไฟล์ .env แล้ว Restart Server เพื่อเปิด AI
                </Alert>
              )}
            </Paper>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0.8, mt: 1.2 }}>
              {[
                ['Operations', analysis.totals.jobs],
                ['เปลี่ยน L/Q', analysis.totals.lqChanges],
                ['ลดได้ประมาณ', analysis.totals.potentialLqReduction],
              ].map(([label, value]) => (
                <Paper key={String(label)} variant="outlined" sx={{ p: 1, borderRadius: 1.5, textAlign: 'center', bgcolor: '#ffffff' }}>
                  <Typography sx={{ color: '#312e81', fontSize: '1rem', fontWeight: 950 }}>{value}</Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.64rem', fontWeight: 800 }}>{label}</Typography>
                </Paper>
              ))}
            </Box>
          </Box>

          <Divider />

          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2, py: 1.5 }}>
            {messages.length === 0 && (
              <Box>
                <Typography sx={{ mb: 1, color: '#475569', fontSize: '0.75rem', fontWeight: 900 }}>คำถามแนะนำ</Typography>
                <Stack spacing={0.7}>
                  {quickQuestions.map((item) => (
                    <Paper
                      key={item}
                      component="button"
                      type="button"
                      onClick={() => void submitQuestion(item)}
                      variant="outlined"
                      sx={{ p: 1.1, color: '#334155', bgcolor: '#ffffff', borderRadius: 1.5, textAlign: 'left', font: 'inherit', fontSize: '0.76rem', fontWeight: 750, cursor: 'pointer', '&:hover': { borderColor: '#818cf8', bgcolor: '#eef2ff' } }}
                    >
                      {item}
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            <Stack spacing={1.1}>
              {messages.map((message) => (
                <Box key={message.id} sx={{ alignSelf: message.role === 'user' ? 'flex-end' : 'stretch', maxWidth: message.role === 'user' ? '88%' : '100%' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      px: 1.25,
                      py: 1,
                      borderRadius: message.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                      color: message.role === 'user' ? '#ffffff' : '#1e293b',
                      bgcolor: message.role === 'user' ? '#4f46e5' : '#ffffff',
                      border: message.role === 'user' ? 'none' : '1px solid #e2e8f0',
                    }}
                  >
                    <Typography sx={{ whiteSpace: 'pre-wrap', fontSize: '0.78rem', lineHeight: 1.55, fontWeight: 650 }}>
                      {message.content}
                    </Typography>
                  </Paper>
                  {message.role === 'assistant' && message.source && (
                    <Chip
                      size="small"
                      label={message.source === 'deepseek' ? 'DeepSeek AI' : 'Local Analyzer'}
                      sx={{ mt: 0.35, height: 18, fontSize: '0.58rem', fontWeight: 850 }}
                    />
                  )}
                </Box>
              ))}
              {submitting && (
                <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', color: '#64748b' }}>
                  <CircularProgress size={16} />
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 750 }}>DeepSeek กำลังวิเคราะห์ผลจาก Local Analyzer…</Typography>
                </Stack>
              )}
              {error && <Alert severity="error" onClose={() => setError('')} sx={{ fontSize: '0.72rem' }}>{error}</Alert>}
              <div ref={messageEndRef} />
            </Stack>
          </Box>

          <Box sx={{ p: 1.5, bgcolor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={question}
              disabled={submitting}
              placeholder={aiEnabled ? 'ถาม DeepSeek เกี่ยวกับแผนตาม Filter…' : 'ถาม Local Analyzer…'}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void submitQuestion();
                }
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <IconButton
                      onClick={() => void submitQuestion()}
                      disabled={!question.trim() || submitting}
                      aria-label="ส่งคำถาม"
                      sx={{ alignSelf: 'flex-end', color: '#4f46e5' }}
                    >
                      <SparkIcon size={19} />
                    </IconButton>
                  ),
                },
              }}
              sx={{ '& .MuiOutlinedInput-root': { pr: 0.5, borderRadius: 2, fontSize: '0.8rem' } }}
            />
            <Typography sx={{ mt: 0.6, color: '#94a3b8', fontSize: '0.62rem', textAlign: 'center' }}>
              AI ให้คำแนะนำเท่านั้น ไม่แก้แผนหรือบันทึกฐานข้อมูลอัตโนมัติ
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
