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
} from '@mui/material';
import { Refresh } from 'iconsax-react';
import * as XLSX from 'xlsx';
import { requiredExcelHeaders } from '@/lib/excel-headers';

type ExcelRow = Record<string, unknown>;

type ImportState = {
  status: 'idle' | 'ready' | 'importing' | 'done' | 'error';
  message: string;
  totalRows: number;
  importedRows: number;
  fileName: string;
};

const initialState: ImportState = {
  status: 'idle',
  message: 'เลือกไฟล์ Excel เพื่อเริ่ม import',
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

  const progress = state.totalRows > 0 ? Math.round((state.importedRows / state.totalRows) * 100) : 0;

  const parseFile = async (file: File) => {
    setState({
      ...initialState,
      status: 'importing',
      fileName: file.name,
      message: 'กำลังอ่านไฟล์ Excel',
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
        message: `หัวตารางไม่ครบ: ${missingHeaders.join(', ')}`,
      });
      return;
    }

    setRows(parsedRows);
    setState({
      status: 'ready',
      fileName: file.name,
      totalRows: parsedRows.length,
      importedRows: 0,
      message: `อ่านไฟล์สำเร็จ พบ ${parsedRows.length.toLocaleString('th-TH')} แถว`,
    });
  };

  const importToDatabase = async () => {
    const chunks = chunkRows(rows, chunkSize);

    setState((current) => ({
      ...current,
      status: 'importing',
      importedRows: 0,
      message: `กำลัง import เข้า DB แบบ ${chunkSize.toLocaleString('th-TH')} แถวต่อ chunk`,
    }));

    for (const [chunkIndex, chunk] of chunks.entries()) {
      const response = await fetch('/api/import-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: chunk.rows,
          startIndex: chunk.startIndex,
          reset: chunkIndex === 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Import failed' }));
        setState((current) => ({
          ...current,
          status: 'error',
          message: error.error ?? 'Import failed',
        }));
        return;
      }

      setState((current) => ({
        ...current,
        importedRows: Math.min(current.totalRows, chunk.startIndex + chunk.rows.length),
        message: `Import chunk ${chunkIndex + 1}/${chunks.length} สำเร็จ`,
      }));
    }

    setState((current) => ({
      ...current,
      status: 'done',
      importedRows: current.totalRows,
      message: 'Import เข้า database สำเร็จ',
    }));
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
                <Button variant="contained" component="label" disabled={state.status === 'importing'}>
                  เลือกไฟล์ Excel
                  <input
                    hidden
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void parseFile(file);
                      event.target.value = '';
                    }}
                  />
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Refresh size="18" color={rows.length === 0 || state.status === 'importing' ? '#cbd5e1' : '#0891b2'} />}
                  disabled={rows.length === 0 || state.status === 'importing'}
                  onClick={importToDatabase}
                >
                  Import เข้า DB
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Chip label={state.fileName || 'ยังไม่ได้เลือกไฟล์'} />
                <Chip label={`${state.totalRows.toLocaleString('th-TH')} rows`} />
                <Chip label={`${chunkSize.toLocaleString('th-TH')} rows/chunk`} />
              </Stack>

              <Box>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="body2" sx={{ fontWeight: 750 }}>
                    Progress
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {state.importedRows.toLocaleString('th-TH')} / {state.totalRows.toLocaleString('th-TH')} แถว
                  </Typography>
                </Stack>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 999 }} />
              </Box>

              <Alert severity={state.status === 'error' ? 'error' : state.status === 'done' ? 'success' : 'info'}>
                {state.message}
              </Alert>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
