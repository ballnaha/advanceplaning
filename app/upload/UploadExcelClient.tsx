'use client';

import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tab,
  Tabs,
} from '@mui/material';
import { Refresh, DocumentUpload, CloudConnection, ArchiveBook, Trash } from 'iconsax-react';
import * as XLSX from 'xlsx';
import { requiredExcelHeaders } from '@/lib/excel-headers';

type ExcelRow = Record<string, unknown>;

type ImportMethod = 'shared-drive' | 'manual';

type ImportState = {
  status: 'idle' | 'ready' | 'importing' | 'done' | 'error';
  message: string;
  totalRows: number;
  importedRows: number;
  fileName: string;
};

type ConfirmDialogState = {
  open: boolean;
  title: string;
  message: string;
  confirmColor: 'primary' | 'warning' | 'error' | 'info';
  confirmText: string;
  onConfirm: () => void;
};

const initialState: ImportState = {
  status: 'idle',
  message: 'เลือกไฟล์ Excel หรือกดซิงค์จาก Shared Drive เพื่อเริ่มต้น',
  totalRows: 0,
  importedRows: 0,
  fileName: '',
};

function chunkRows(rows: ExcelRow[], size: number) {
  const chunks: Array<{ rows: ExcelRow[]; startIndex: number }> = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push({ rows: rows.slice(index, index + size), startIndex: index });
  }
  return chunks;
}

function findMissingHeaders(rows: ExcelRow[]) {
  const firstRow = rows[0] ?? {};
  return requiredExcelHeaders.filter((header) => !(header in firstRow));
}

export default function UploadExcelClient() {
  const [rows, setRows] = React.useState<ExcelRow[]>([]);
  const chunkSize = 200;
  const [state, setState] = React.useState<ImportState>(initialState);
  const [importMethod, setImportMethod] = React.useState<ImportMethod>('shared-drive');

  const [backups, setBackups] = React.useState<Array<{ id: number; versionName: string; createdAt: string }>>([]);
  const [restoring, setRestoring] = React.useState(false);
  const [clearingDatabase, setClearingDatabase] = React.useState(false);
  const [syncLog, setSyncLog] = React.useState<{ filename: string; localBackupFilename?: string; fileSize: number; mtime: string; syncedAt: string; rowCount: number } | null>(null);
  const [syncing, setSyncing] = React.useState(false);

  const [confirmDialog, setConfirmDialog] = React.useState<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
    confirmColor: 'primary',
    confirmText: 'ยืนยัน',
    onConfirm: () => {},
  });

  const loadBackupStatus = async () => {
    try {
      const res = await fetch('/api/import-jobs/restore');
      if (res.ok) {
        const data = await res.json();
        setBackups(data.latestBackups || []);
      }
    } catch (err) {
      console.error('Failed to load backup status:', err);
    }
  };

  const loadSyncLog = async () => {
    try {
      const res = await fetch('/api/import-jobs/sync-shared-drive');
      if (res.ok) {
        const data = await res.json();
        setSyncLog(data.log || null);
      }
    } catch (err) {
      console.error('Failed to load sync log:', err);
    }
  };

  React.useEffect(() => {
    void loadBackupStatus();
    void loadSyncLog();
  }, []);

  const progress = state.totalRows > 0 ? Math.round((state.importedRows / state.totalRows) * 100) : 0;

  const selectImportMethod = (method: ImportMethod) => {
    if (state.status === 'importing' || importMethod === method) return;
    setImportMethod(method);
  };

  const parseFile = async (file: File) => {
    setState({
      ...initialState,
      status: 'importing',
      fileName: file.name,
      message: 'กำลังอ่านไฟล์ Excel...',
    });

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const parsedRows = XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: '', raw: true });
    const missingHeaders = findMissingHeaders(parsedRows);

    if (missingHeaders.length > 0) {
      setRows([]);
      setState({
        status: 'error',
        fileName: file.name,
        totalRows: 0,
        importedRows: 0,
        message: `หัวตารางของไฟล์นี้ไม่ครบถ้วน ขาดหัวตาราง: ${missingHeaders.join(', ')}`,
      });
      return;
    }

    setRows(parsedRows);
    setState({
      status: 'ready',
      fileName: file.name,
      totalRows: parsedRows.length,
      importedRows: 0,
      message: `อ่านไฟล์สำเร็จ พบข้อมูลทั้งหมด ${parsedRows.length.toLocaleString('th-TH')} แถว`,
    });
  };

  const importToDatabase = async () => {
    const chunks = chunkRows(rows, chunkSize);
    let backupId: number | undefined;

    setState((current) => ({
      ...current,
      status: 'importing',
      importedRows: 0,
      message: `กำลังบันทึกข้อมูลเข้าสู่ฐานข้อมูล (แบ่งแถวแบบ chunk ละ ${chunkSize.toLocaleString('th-TH')} แถว)...`,
    }));

    for (const [chunkIndex, chunk] of chunks.entries()) {
      const response = await fetch('/api/import-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: chunk.rows,
          startIndex: chunk.startIndex,
          reset: chunkIndex === 0,
          preserveSequence: true,
          backupId,
          final: chunkIndex === chunks.length - 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Import failed' }));
        setState((current) => ({
          ...current,
          status: 'error',
          message: error.error ?? 'การบันทึกข้อมูลลงฐานข้อมูลล้มเหลว',
        }));
        return;
      }

      const responseData = await response.json().catch(() => ({}));
      if (chunkIndex === 0 && responseData.backupId) {
        backupId = responseData.backupId;
      }

      setState((current) => ({
        ...current,
        importedRows: Math.min(current.totalRows, chunk.startIndex + chunk.rows.length),
        message: `กำลังนำเข้ากลุ่มข้อมูลย่อยที่ ${chunkIndex + 1}/${chunks.length} สำเร็จ`,
      }));
    }

    setState((current) => ({
      ...current,
      status: 'done',
      importedRows: current.totalRows,
      message: 'นำเข้าข้อมูลเข้าสู่ฐานข้อมูลสำเร็จเรียบร้อย',
    }));

    void loadBackupStatus();
  };

  const handleRestore = async (backupId: number, versionName: string) => {
    setConfirmDialog({
      open: true,
      title: 'ยืนยันการกู้คืนแผนงาน (Rollback)',
      message: `คุณต้องการย้อนกลับแผนงานเดิมไปใช้เวอร์ชัน "${versionName}" ใช่หรือไม่?\n(คำเตือน: ข้อมูลแผนงานปัจจุบันทั้งหมดบนระบบจะถูกลบและเขียนทับด้วยข้อมูลสำรองนี้)`,
      confirmColor: 'warning',
      confirmText: 'ยืนยันการกู้คืนคิว',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setRestoring(true);
        setState({
          status: 'importing',
          message: `กำลังกู้คืนข้อมูลย้อนกลับไปเวอร์ชัน "${versionName}"...`,
          totalRows: 0,
          importedRows: 0,
          fileName: '',
        });

        try {
          const res = await fetch('/api/import-jobs/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backupId }),
          });
          const data = await res.json();
          if (res.ok) {
            setRows([]);
            setState({
              status: 'done',
              message: `คืนค่าแผนงานสำเร็จ ย้อนกลับไปใช้เวอร์ชัน: ${versionName}`,
              totalRows: data.count || 0,
              importedRows: data.count || 0,
              fileName: '',
            });
          } else {
            setState({
              status: 'error',
              message: `ล้มเหลวในการคืนค่าข้อมูล: ${data.error ?? 'เกิดข้อผิดพลาดในการคืนค่า'}`,
              totalRows: 0,
              importedRows: 0,
              fileName: '',
            });
          }
        } catch (err: any) {
          setState({
            status: 'error',
            message: `ล้มเหลวในการเชื่อมต่อ: ${err.message ?? 'เกิดข้อผิดพลาดในการเชื่อมต่อ'}`,
            totalRows: 0,
            importedRows: 0,
            fileName: '',
          });
        } finally {
          setRestoring(false);
          void loadBackupStatus();
        }
      },
    });
  };

  const handleSharedDriveSync = async () => {
    setConfirmDialog({
      open: true,
      title: 'ยืนยันการซิงค์ไฟล์ SAP อัตโนมัติ',
      message: 'คุณต้องการดึงไฟล์ Excel ล่าสุดจาก Shared Drive และปรับปรุงแผนงานผลิตในฐานข้อมูลใช่หรือไม่?\n(ระบบจะทำการสำรองแผนงานปัจจุบันเก็บไว้ในประวัติกู้คืนโดยอัตโนมัติ)',
      confirmColor: 'primary',
      confirmText: 'เริ่มซิงค์ข้อมูลทันที',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setSyncing(true);
        setState({
          status: 'importing',
          message: 'กำลังตรวจสอบโฟลเดอร์และดึงไฟล์ Excel จาก Shared Drive...',
          totalRows: 0,
          importedRows: 0,
          fileName: '',
        });

        try {
          const res = await fetch('/api/import-jobs/sync-shared-drive', { method: 'POST' });
          const data = await res.json();

          if (res.ok) {
            setRows([]);
            setState({
              status: 'done',
              message: `${data.message} (${data.log.rowCount.toLocaleString('th-TH')} แถว)`,
              totalRows: data.log.rowCount,
              importedRows: data.log.rowCount,
              fileName: data.log.filename,
            });
          } else {
            setState({
              status: 'error',
              message: data.error ?? 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Shared Drive',
              totalRows: 0,
              importedRows: 0,
              fileName: '',
            });
          }
        } catch (err: any) {
          setState({
            status: 'error',
            message: err.message ?? 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
            totalRows: 0,
            importedRows: 0,
            fileName: '',
          });
        } finally {
          setSyncing(false);
          void loadSyncLog();
          void loadBackupStatus();
        }
      },
    });
  };

  const handleClearDatabase = () => {
    setConfirmDialog({
      open: true,
      title: 'ยืนยันล้างตาราง production_jobs',
      message: 'คุณต้องการลบข้อมูลแผนงานผลิตทั้งหมดออกจากตาราง production_jobs ใช่หรือไม่?\nระบบจะสำรองข้อมูลปัจจุบันก่อนลบ เพื่อให้สามารถกู้คืนจาก Rollback ได้',
      confirmColor: 'error',
      confirmText: 'ล้างฐานข้อมูล',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        setClearingDatabase(true);
        setState({
          status: 'importing',
          message: 'กำลังสำรองข้อมูลและล้างตาราง production_jobs...',
          totalRows: 0,
          importedRows: 0,
          fileName: '',
        });

        try {
          const response = await fetch('/api/import-jobs', { method: 'DELETE' });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? 'ไม่สามารถล้างฐานข้อมูลได้');

          setRows([]);
          setState({
            status: 'done',
            message: data.message ?? 'ล้างตาราง production_jobs สำเร็จ',
            totalRows: 0,
            importedRows: 0,
            fileName: '',
          });
        } catch (error) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'ไม่สามารถล้างฐานข้อมูลได้',
            totalRows: 0,
            importedRows: 0,
            fileName: '',
          });
        } finally {
          setClearingDatabase(false);
          void loadBackupStatus();
        }
      },
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Page Title Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
            การจัดการข้อมูลนำเข้าแผนงาน (Import & Sync Settings)
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
            ดึงข้อมูลแผนการวางคิวผลิต SAP จากแชร์โฟลเดอร์เน็ตเวิร์ก หรือเลือกไฟล์ Excel อัปโหลดเพื่อจัดเรียงแผนใหม่ได้ตลอดเวลา
          </Typography>
        </Box>

        {/* Global Import Action/Error Status */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          {state.status === 'importing' && (
            <Paper
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid rgba(59, 130, 246, 0.15)',
                bgcolor: 'rgba(59, 130, 246, 0.015)'
              }}
            >
              <Stack spacing={2}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#2563eb' }}>
                  {state.message}
                </Typography>
                <Box>
                  <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 999 }} />
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: '#64748b', fontWeight: 700, textAlign: 'right' }}>
                    ความคืบหน้า: {state.importedRows.toLocaleString('th-TH')} / {state.totalRows.toLocaleString('th-TH')} แถว ({progress}%)
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}

          {state.status === 'done' && (
            <Alert severity="success" variant="outlined" sx={{ borderRadius: 3, fontWeight: 700 }}>
              {state.message}
            </Alert>
          )}

          {state.status === 'error' && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 3, fontWeight: 700 }}>
              {state.message}
            </Alert>
          )}
        </Stack>

        <Grid container spacing={3}>
          {/* Left Column: Operation Actions */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Tabs
                  value={importMethod}
                  onChange={(_event, method: ImportMethod) => selectImportMethod(method)}
                  variant="fullWidth"
                  aria-label="วิธีนำเข้าข้อมูล"
                >
                  <Tab
                    value="shared-drive"
                    disabled={state.status === 'importing'}
                    icon={<CloudConnection size="20" />}
                    iconPosition="start"
                    label="Shared Drive (แนะนำ)"
                    sx={{ fontWeight: 800, minHeight: 64 }}
                  />
                  <Tab
                    value="manual"
                    disabled={state.status === 'importing'}
                    icon={<DocumentUpload size="20" />}
                    iconPosition="start"
                    label="อัปโหลดไฟล์เอง"
                    sx={{ fontWeight: 800, minHeight: 64 }}
                  />
                </Tabs>
              </Paper>

              {/* Card 1: Shared Drive Sync */}
              {importMethod === 'shared-drive' && <Paper
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  borderRadius: 4,
                  border: '1px solid rgba(15, 23, 42, 0.05)',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.02)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    bgcolor: '#0891b2'
                  }
                }}
              >
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <CloudConnection size="24" color="#0891b2" variant="Bulk" />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                      ซิงค์ข้อมูลผ่าน Shared Drive (ระบบแนะนำ)
                    </Typography>
                  </Stack>

                  <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, lineHeight: 1.6 }}>
                    ดึงข้อมูลจากไฟล์ SAP ส่งออกล่าสุดจากไดเรกทอรีเน็ตเวิร์กแชร์อัตโนมัติเพื่อนำเข้าฐานข้อมูลวางแผนงานผลิตอย่างถูกต้อง รวดเร็ว โดยไม่ต้องทำรายการอัปโหลดไฟล์ด้วยตนเอง
                  </Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleSharedDriveSync}
                      disabled={syncing || state.status === 'importing'}
                      startIcon={<Refresh size="18" color="currentColor" />}
                      sx={{
                        fontWeight: 800,
                        bgcolor: '#0891b2',
                        '&:hover': { bgcolor: '#0e7490' },
                        borderRadius: 2.5,
                        px: 3,
                        py: 1.25,
                        boxShadow: '0 4px 12px rgba(8, 145, 178, 0.15)'
                      }}
                    >
                      {syncing ? 'กำลังซิงค์ข้อมูล...' : 'เริ่มซิงค์จาก Shared Drive'}
                    </Button>

                    {syncLog ? (
                      <Chip
                        label={`ไฟล์ล่าสุด: ${syncLog.filename} (${syncLog.rowCount.toLocaleString('th-TH')} แถว)`}
                        color="success"
                        variant="outlined"
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                      />
                    ) : (
                      <Chip label="ยังไม่มีประวัติการซิงค์ข้อมูล" variant="outlined" sx={{ borderRadius: 2 }} />
                    )}
                  </Stack>

                  {syncLog && (
                    <Alert
                      severity="success"
                      variant="outlined"
                      action={
                        syncLog.localBackupFilename ? (
                          <Button
                            color="success"
                            variant="contained"
                            size="small"
                            href={`/api/import-jobs/download-excel?filename=${syncLog.localBackupFilename}`}
                            sx={{ fontWeight: 800, borderRadius: 1.5 }}
                          >
                            ดาวน์โหลดไฟล์นี้ (.xlsx)
                          </Button>
                        ) : undefined
                      }
                      sx={{
                        borderRadius: 3,
                        alignItems: 'center',
                        '& .MuiAlert-message': { width: '100%' }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        การซิงค์ไฟล์ล่าสุดสำเร็จเมื่อ: {new Date(syncLog.syncedAt).toLocaleString('th-TH')}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#475569', fontWeight: 600 }}>
                        อัปเดตไฟล์ในแชร์ไดรฟ์เมื่อ: {new Date(syncLog.mtime).toLocaleString('th-TH')} · ขนาดไฟล์: {(syncLog.fileSize / 1024).toFixed(1)} KB
                      </Typography>
                    </Alert>
                  )}
                </Stack>
              </Paper>}

              {/* Card 2: Manual File Upload */}
              {importMethod === 'manual' && <Paper
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  borderRadius: 4,
                  border: '1px solid rgba(15, 23, 42, 0.05)',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.02)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    bgcolor: '#64748b'
                  }
                }}
              >
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <DocumentUpload size="24" color="#64748b" variant="Bulk" />
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                      นำเข้าไฟล์ Excel แบบกำหนดเอง (Manual Upload)
                    </Typography>
                  </Stack>

                  <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, lineHeight: 1.6 }}>
                    ในกรณีที่คุณต้องการนำเข้าแผนงานชุดเฉพาะกิจ หรือไม่มีการเชื่อมต่อกับแชร์ไดรฟ์ SAP คุณสามารถนำเข้าไฟล์ .xlsx แบบกำหนดเองได้จากกล่องอัปโหลดด้านล่างนี้
                  </Typography>

                  {/* Dashed Drag/Click Dropzone */}
                  <Box
                    sx={{
                      border: '2.5px dashed rgba(100, 116, 139, 0.2)',
                      borderRadius: 4,
                      p: 4,
                      textAlign: 'center',
                      bgcolor: 'rgba(248, 250, 252, 0.6)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        borderColor: '#2563eb',
                        bgcolor: 'rgba(37, 99, 235, 0.015)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                    component="label"
                  >
                    <input
                      hidden
                      type="file"
                      accept=".xlsx,.xls"
                      disabled={state.status === 'importing'}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void parseFile(file);
                        event.target.value = '';
                      }}
                    />
                    <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
                      <DocumentUpload size="40" color="#64748b" />
                      <Typography variant="body1" sx={{ fontWeight: 850, color: '#1e293b' }}>
                        คลิกเพื่อเลือกไฟล์ หรือ ลากไฟล์ Excel มาวางที่นี่
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        เฉพาะนามสกุลไฟล์ตาราง .xlsx หรือ .xls เท่านั้น
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Selected File & Import Controls */}
                  {rows.length > 0 && (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        bgcolor: '#fafafa',
                        border: '1px solid rgba(15, 23, 42, 0.06)'
                      }}
                    >
                      <Stack spacing={2}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                              พร้อมนำเข้าไฟล์ Excel
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 700 }}>
                              {state.fileName}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Chip
                              label={`${state.totalRows.toLocaleString('th-TH')} แถว`}
                              color="primary"
                              size="small"
                              sx={{ fontWeight: 700, borderRadius: 1.5 }}
                            />
                            <Chip
                              label={`ขนาด chunk: ${chunkSize}`}
                              variant="outlined"
                              size="small"
                              sx={{ fontWeight: 700, borderRadius: 1.5 }}
                            />
                          </Stack>
                        </Stack>

                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<Refresh size="18" />}
                          disabled={state.status === 'importing'}
                          onClick={importToDatabase}
                          fullWidth
                          sx={{
                            fontWeight: 800,
                            borderRadius: 2.5,
                            py: 1.25,
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
                          }}
                        >
                          {state.status === 'importing' ? 'กำลังนำเข้าสู่ระบบ...' : 'ยืนยันเพื่อบันทึกข้อมูลเข้าฐานข้อมูล'}
                        </Button>
                      </Stack>
                    </Paper>
                  )}
                </Stack>
              </Paper>}
            </Stack>
          </Grid>

          {/* Right Column: Recovery & Rollbacks Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderRadius: 4,
                border: '1px solid rgba(15, 23, 42, 0.05)',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.02)',
                height: '100%'
              }}
            >
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', color: '#0f172a' }}>
                  <ArchiveBook size="24" color="#d97706" variant="Bulk" />
                  <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
                    ประวัติการกู้คืนคิว (Rollbacks)
                  </Typography>
                </Stack>

                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, lineHeight: 1.6 }}>
                  ระบบเซฟจัดเก็บลำดับคิวเดิมของผู้ใช้ไว้อัตโนมัติสูงสุด 3 เวอร์ชันก่อนที่จะเริ่มทำการเขียนทับข้อมูลจาก Excel ใหม่ เพื่อความปลอดภัยจากการจัดคิวพลาด
                </Typography>

                {backups.length > 0 ? (
                  <Stack spacing={2.5} sx={{ position: 'relative', pl: 1.5, mt: 1 }}>
                    {/* Vertical timeline connector */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 5,
                        top: 12,
                        bottom: 12,
                        width: 2,
                        bgcolor: 'rgba(15, 23, 42, 0.06)',
                        zIndex: 0
                      }}
                    />

                    {backups.map((item, index) => (
                      <Box
                        key={item.id}
                        sx={{
                          position: 'relative',
                          pl: 2,
                          zIndex: 1
                        }}
                      >
                        {/* Timeline node dot */}
                        <Box
                          sx={{
                            position: 'absolute',
                            left: -19,
                            top: 6,
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            bgcolor: index === 0 ? '#3b82f6' : 'rgba(15, 23, 42, 0.25)',
                            border: '2.5px solid #fff',
                            boxShadow: index === 0 ? '0 0 0 3px rgba(59, 130, 246, 0.2)' : 'none'
                          }}
                        />

                        <Stack spacing={1.25}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>
                              {item.versionName}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 600, mt: 0.25 }}>
                              วันเวลาสำรอง: {new Date(item.createdAt).toLocaleString('th-TH')}
                            </Typography>
                          </Box>

                          <Button
                            color="warning"
                            variant="outlined"
                            size="small"
                            onClick={() => handleRestore(item.id, item.versionName)}
                            disabled={restoring || state.status === 'importing'}
                            sx={{
                              fontWeight: 800,
                              alignSelf: 'flex-start',
                              py: 0.5,
                              px: 2,
                              borderRadius: 2,
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              borderColor: 'rgba(217, 119, 6, 0.3)',
                              '&:hover': {
                                borderColor: '#d97706',
                                bgcolor: 'rgba(217, 119, 6, 0.02)'
                              }
                            }}
                          >
                            {restoring ? 'กำลังกู้คืน...' : 'กู้คืนแผนนี้ (Rollback)'}
                          </Button>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Alert severity="warning" variant="outlined" sx={{ borderRadius: 3, fontWeight: 650 }}>
                    ยังไม่มีข้อมูลประวัติกู้คืนระบบ (จะสร้างจุดกู้คืนอัตโนมัติเมื่อเริ่มอัปโหลดไฟล์ Excel ใหม่)
                  </Alert>
                )}

                <Box
                  sx={{
                    mt: 1,
                    pt: 2.5,
                    borderTop: '1px solid rgba(100, 116, 139, 0.18)',
                  }}
                >
                    <Typography sx={{ color: '#475569', fontWeight: 900, fontSize: '0.82rem', mb: 0.5 }}>
                    Danger Zone
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block', color: '#64748b', lineHeight: 1.5, mb: 1.25 }}>
                    ล้างข้อมูลทั้งหมดในตาราง production_jobs ระบบจะสร้าง Backup ก่อนลบอัตโนมัติ
                  </Typography>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Trash size="17" />}
                    onClick={handleClearDatabase}
                    disabled={clearingDatabase || restoring || syncing || state.status === 'importing'}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 850,
                      textTransform: 'none',
                      color: '#ffffff',
                      bgcolor: '#b91c1c',
                      boxShadow: '0 4px 10px rgba(185, 28, 28, 0.2)',
                      '&:hover': {
                        color: '#ffffff',
                        bgcolor: '#991b1b',
                        boxShadow: '0 6px 14px rgba(153, 27, 27, 0.26)',
                      },
                    }}
                  >
                    {clearingDatabase ? 'กำลังล้างฐานข้อมูล...' : 'Clear production_jobs'}
                  </Button>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Premium Custom Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              p: 1.5,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
              maxWidth: 480,
            },
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: '1.25rem', color: '#0f172a', pb: 1 }}>
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569', fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.6 }}>
            {confirmDialog.message.split('\n').map((line, i) => (
              <span key={i} style={{ display: 'block', marginBottom: i === 0 ? '8px' : '0px' }}>
                {line}
              </span>
            ))}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1.5 }}>
          <Button
            onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
            variant="outlined"
            sx={{
              fontWeight: 800,
              borderRadius: 2.5,
              px: 2.5,
              py: 1,
              color: '#64748b',
              borderColor: 'rgba(100, 116, 139, 0.25)',
              '&:hover': {
                borderColor: '#64748b',
                bgcolor: 'rgba(100, 116, 139, 0.02)'
              }
            }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={confirmDialog.onConfirm}
            variant="contained"
            color={confirmDialog.confirmColor}
            autoFocus
            sx={{
              fontWeight: 800,
              borderRadius: 2.5,
              px: 3,
              py: 1,
              boxShadow: confirmDialog.confirmColor === 'warning'
                ? '0 4px 12px rgba(217, 119, 6, 0.15)'
                : '0 4px 12px rgba(37, 99, 235, 0.15)',
            }}
          >
            {confirmDialog.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
