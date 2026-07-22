'use client';

import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
  Grid,
} from '@mui/material';
import {
  Data,
  InfoCircle,
  TaskSquare,
  CloudConnection,
  ArchiveBook,
  DocumentUpload,
  Refresh,
  Flash,
} from 'iconsax-react';

export default function GuidePage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 5 }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          {/* Main Title Header */}
          <Box sx={{ mb: 1, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', mb: 1 }}>
              คู่มือการใช้งานระบบจัดลำดับแผนงานผลิต
            </Typography>
            <Typography variant="body1" sx={{ color: '#475569', fontWeight: 600, maxW: 680, mx: 'auto' }}>
              ศูนย์รวมคู่มือ ขั้นตอนการดำเนินงาน และเงื่อนไขตรรกะระบบอัตโนมัติของแอปพลิเคชันวางแผนจัดคิวผลิต PSC Planning
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center', mt: 2.5 }}>
              <Chip label="อัปเดตล่าสุด: กรกฎาคม 2569" color="primary" variant="outlined" sx={{ fontWeight: 700, borderRadius: 2 }} />

            </Stack>
          </Box>

          {/* Section 1: เงื่อนไขการจัดคิวอัตโนมัติ */}
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              ⚙️ 1. เงื่อนไขและกฎอัลกอริทึมการจัดคิวอัตโนมัติ (Auto Arrange Logic)
            </Typography>

            <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4, border: '1px solid rgba(15, 23, 42, 0.05)' }}>
              <Typography variant="body2" sx={{ color: '#475569', fontWeight: 650, mb: 4, lineHeight: 1.6 }}>
                เมื่อกดปุ่ม **"DEFAULT SETTING" (หรือจัดเรียงคิวอัตโนมัติ)** ระบบจะทำการดึงประมวลผลงานในฐานข้อมูลของเครื่องจักรเครื่องนั้น ๆ มาทำการคำนวณและจัดคิวเข้าแผนให้เรียงกันอย่างมีประสิทธิภาพผ่าน 8 กฎเกณฑ์ลำดับดังต่อไปนี้:
              </Typography>

              {/* Visual Flowchart */}
              <Stack spacing={2.5}>
                {[
                  {
                    step: 'ขั้นตอนที่ 1',
                    title: 'จัดกลุ่มแยกตามประเภทแผ่นเหล็ก (Material Group 1 - zpg1d)',
                    color: '#4f46e5',
                    desc: 'แยกประเภทการผลิตตามชนิดเหล็กหลักเพื่อไม่ให้เครื่องจักรทำงานสับสน โดยเรียงลำดับกลุ่มดังนี้: 1) เหล็กอาบปี๊บ (tinplate) ➡️ 2) เหล็กอาบ 3-Piece (three_piece) ➡️ 3) เหล็กอาบ NE (ne) ➡️ 4) เหล็กอาบ DRD (drd) ➡️ 5) เหล็กอาบ EOE (eoe)',
                  },
                  {
                    step: 'ขั้นตอนที่ 2',
                    title: 'จัดกลุ่มตามวันเริ่มผลิต (Start Date - stdate)',
                    color: '#2563eb',
                    desc: 'ภายในประเภทเหล็กเดียวกัน ระบบจะเรียงงานตามวันเริ่มผลิต (stdate) จากวันเก่าไปวันใหม่ก่อน เพื่อให้งานที่ต้องเริ่มก่อนขึ้นคิวก่อน',
                  },
                  {
                    step: 'ขั้นตอนที่ 3',
                    title: 'จัดกลุ่มตามขนาดของแผ่นเหล็ก (Material Group 2 - zpg2d)',
                    color: '#0891b2',
                    desc: 'ภายในวันเริ่มผลิตเดียวกัน ระบบจะนำขนาดมิติความยาว-กว้างของแผ่นเหล็ก (เช่น คลีนจาก 0.20x250x300 เหลือ 250x300) มาจัดกลุ่มและเรียงลำดับ เพื่อลดการสลับขนาด',
                  },
                  {
                    step: 'ขั้นตอนที่ 4',
                    title: 'จัดกลุ่มตามสี/กลุ่ม L/Q (Material Group 3 - zpg3d)',
                    color: '#059669',
                    desc: 'ระบบจะจัดงานที่มีสีหรือกลุ่ม L/Q (zpg3d) เดียวกันให้อยู่ติดกัน และพยายามต่อกลุ่มสีเดิมเพื่อลดการเปลี่ยนสีระหว่างงาน',
                  },
                  {
                    step: 'ขั้นตอนที่ 5',
                    title: 'จัดกลุ่มตามรหัส L/Q (L/Q Code - zlmat)',
                    color: '#7c3aed',
                    desc: 'ภายในกลุ่มสีเดียวกัน ระบบจะรวมงานที่ใช้รหัส L/Q (zlmat) เดียวกันให้อยู่ติดกัน หากกลุ่มสีต่อเนื่องจากกลุ่มขนาดก่อนหน้า ระบบจะพยายามต่อรหัส L/Q เดิมก่อน เพื่อลดจำนวนครั้งในการล้างและเปลี่ยนสารเคลือบ',
                  },
                  {
                    step: 'ขั้นตอนที่ 6',
                    title: 'จัดกลุ่มตามขั้นตอนการผลิต (OP - vornr)',
                    color: '#d97706',
                    desc: 'ภายในรหัส L/Q เดียวกัน ระบบจะจัดกลุ่มและเรียงหมายเลขขั้นตอนการผลิต (OP หรือ vornr) จากน้อยไปมาก โดยเปรียบเทียบตัวเลขตามค่าจริง',
                  },
                  {
                    step: 'ขั้นตอนที่ 7',
                    title: 'เรียงวันกำหนดส่งและลำดับเดิม (finish date, Sequence & Source Row)',
                    color: '#475569',
                    desc: 'ภายในกลุ่มย่อยเดียวกัน ระบบจะเรียงวันกำหนดส่งผลิต (Findate) จากเก่าไปใหม่ก่อน หากไม่มี Findate จะใช้ Start Date แทน จากนั้นใช้ Sequence ที่บันทึกไว้ และ Source Row จากไฟล์ Excel เป็นตัวตัดสินลำดับสุดท้าย',
                  },
                  {
                    step: 'ขั้นตอนที่ 8',
                    title: 'รักษาลำดับ OP และความต่อเนื่องของ Work Order',
                    color: '#334155',
                    desc: 'หลังได้คิวพื้นฐาน ระบบจะตรวจให้ OP ของ Work Order เดียวกันเรียงจากน้อยไปมากเสมอ และพยายามย้ายงานของ Order เดียวกันให้อยู่ติดกันเฉพาะกรณีที่ไม่ทำให้จำนวนการเปลี่ยนรหัส L/Q เพิ่มขึ้น',
                  },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 2.5, position: 'relative' }}>
                    {/* Step line connector */}
                    {idx < 7 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 20,
                          top: 40,
                          bottom: -30,
                          width: 2,
                          bgcolor: 'rgba(15, 23, 42, 0.08)',
                          zIndex: 1,
                        }}
                      />
                    )}

                    {/* Step Number Circle */}
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        bgcolor: item.color,
                        color: '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 850,
                        fontSize: '0.9rem',
                        zIndex: 2,
                        boxShadow: `0 4px 12px ${item.color}33`,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </Box>

                    <Box sx={{ flex: 1, pb: idx < 7 ? 3 : 0 }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, mb: 0.75 }}>
                        <Chip
                          size="small"
                          label={item.step}
                          sx={{
                            bgcolor: `${item.color}15`,
                            color: item.color,
                            fontWeight: 800,
                            height: 20,
                            fontSize: '0.68rem',
                            border: `1px solid ${item.color}35`,
                          }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 850, color: '#0f172a' }}>
                          {item.title}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, maxWidth: 840, fontWeight: 550 }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Box>

          {/* Section 3: การซิงค์และอัปโหลดแผนงาน */}
          <Divider sx={{ my: 1, borderColor: 'rgba(15, 23, 42, 0.06)' }} />

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              📂 2. การนำเข้าข้อมูลแผนงานและระบบซิงค์อัตโนมัติ (Import & Shared Drive Sync)
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: '100%', borderRadius: 4, border: '1px solid rgba(15, 23, 42, 0.06)', boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.02)' }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Stack spacing={2.5}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 850, color: '#0891b2', display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <CloudConnection size="24" color="currentColor" variant="Bulk" />
                        ระบบซิงค์อัตโนมัติ (Shared Drive Sync)
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, lineHeight: 1.6 }}>
                        สามารถดึงไฟล์นำเข้าแผนผลิตจากเซิร์ฟเวอร์ส่วนกลางได้โดยตรงด้วยขั้นตอนอัตโนมัติ:
                      </Typography>
                      <Box component="ul" sx={{ pl: 2.5, m: 0, '& li': { mb: 1.5, color: '#475569', fontSize: '0.875rem', lineHeight: 1.6, fontWeight: 550 } }}>
                        <li>
                          <strong>ที่อยู่ไฟล์แชร์กลาง:</strong> ดึงไฟล์ส่งออกล่าสุดจากระบบของบริษัทที่เน็ตเวิร์กพาร์ท: `\\192.168.17.2\D$\SAP_XLSX\ZPP001\ZPP001.XLSX` (หรือเครื่อง `pscprdk2web`)
                        </li>
                        <li>
                          <strong>คลิกเดียวเพื่อซิงค์:</strong> กดปุ่ม **"เริ่มซิงค์จาก Shared Drive"** ระบบจะสแกนโฟลเดอร์ ค้นหาไฟล์อัปเดตล่าสุด และนำเข้าลงฐานข้อมูลในระบบทันที
                        </li>
                        <li>
                          <strong>รักษาลำดับคิวที่จัดไว้:</strong> ระบบจับคู่รายการเดิมด้วย Order และ OP เพื่อคง Seq/กลุ่มคิวเดิมไว้ และจะใช้ Default Logic จัดเฉพาะรายการใหม่หรือรายการที่เปลี่ยน Work Center
                        </li>
                        <li>
                          <strong>การสำรองข้อมูลท้องถิ่น:</strong> ทุกครั้งที่ซิงค์สำเร็จ ระบบจะทำสำเนาไฟล์ต้นฉบับเก็บสำรองไว้ที่โฟลเดอร์ของโปรเจกต์อัตโนมัติ เพื่อป้องกันการอัปโหลดไฟล์ใหม่แล้วข้อมูลเดิมสูญหาย
                        </li>
                        <li>
                          <strong>ปุ่มดาวน์โหลดไฟล์เดิม:</strong> บนหน้าซิงค์จะมีปุ่มเขียวแสดงขึ้นมาเพื่อระบุข้อมูลประวัติ และสามารถคลิกดาวน์โหลดไฟล์ Excel ต้นฉบับมาตรวจสอบย้อนหลังได้ตลอดเวลา
                        </li>
                        <li>
                          <strong>การทำตั้งเวลาอัตโนมัติ (Windows Task Scheduler):</strong> สามารถตั้งรันอัปเดตอัตโนมัติผ่าน Windows Task Scheduler หรือเครื่องมือตั้งเวลาอื่น ๆ ได้โดยการยิงขอเรียกแบบ GET ไปที่:
                          <Box sx={{ p: 1, mt: 1, bgcolor: '#f1f5f9', borderRadius: 1.5, fontFamily: 'monospace', fontSize: '0.78rem', wordBreak: 'break-all', border: '1px solid rgba(15,23,42,0.06)' }}>
                            GET /api/import-jobs/sync-shared-drive?trigger=true&key=psc_sync_secret
                          </Box>
                          
                        </li>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ height: '100%', borderRadius: 4, border: '1px solid rgba(15, 23, 42, 0.06)', boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.02)' }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <Stack spacing={2.5}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 850, color: '#64748b', display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <DocumentUpload size="24" color="currentColor" variant="Bulk" />
                        การอัปโหลดแมนนวล (Manual File Upload)
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, lineHeight: 1.6 }}>
                        กรณีต้องการนำเข้าแผนงานเฉพาะกิจผ่านไฟล์ในคอมพิวเตอร์ของคุณ สามารถทำได้ผ่านกล่องอัปโหลดในหน้าจัดเก็บ:
                      </Typography>
                      <Box component="ul" sx={{ pl: 2.5, m: 0, '& li': { mb: 1.5, color: '#475569', fontSize: '0.875rem', lineHeight: 1.6, fontWeight: 550 } }}>
                        <li>
                          <strong>ขอบเขตสกุลไฟล์:</strong> รองรับเฉพาะไฟล์ตาราง Excel นามสกุล `.xlsx` หรือ `.xls` เท่านั้น
                        </li>
                        <li>
                          <strong>ระบบลากและวาง (Drag & Drop Zone):</strong> สามารถเลือกคลิกที่กล่องเพื่อหาไฟล์ หรือใช้เมาส์ลากไฟล์จากเครื่องคอมพิวเตอร์มาวางในกล่องขอบปะสีดำเพื่ออัปโหลดทันที
                        </li>
                        <li>
                          <strong>การตรวจสอบหัวตาราง:</strong> ระบบจะทำการตรวจสอบหัวตาราง หากหัวตารางไม่ครบถ้วนตามแบบแผนมาตรฐานระบบจะแจ้งเตือนพร้อมระบุชื่อคอลัมน์ที่ขาดไปทันทีเพื่อความปลอดภัยของข้อมูล
                        </li>
                        <li>
                          <strong>รักษาลำดับเดิมระหว่างนำเข้า:</strong> เมื่อพบ Order + OP เดิม ระบบจะอัปเดตข้อมูลจาก Excel โดยคงตำแหน่ง Seq เดิมไว้ ส่วน Order ใหม่จะถูกแทรกตาม Default Logic อัตโนมัติ
                        </li>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Section 4: ระบบสำรองและกู้คืนเวอร์ชัน */}
          <Divider sx={{ my: 1, borderColor: 'rgba(15, 23, 42, 0.06)' }} />

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              🔄 3. ระบบกู้คืนแผนงานประวัติการจัดคิว (Queue Backup & Rollbacks)
            </Typography>

            <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4, border: '1px solid rgba(15, 23, 42, 0.05)' }}>
              <Grid container spacing={4} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Stack spacing={2.5}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 850, color: '#d97706', display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <ArchiveBook size="24" color="currentColor" variant="Bulk" />
                      การสำรองข้อมูลคิวอัตโนมัติสูงสุด 3 เวอร์ชัน
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, lineHeight: 1.6 }}>
                      เพื่อป้องกันอันตรายจากการอัปโหลดไฟล์ Excel ใหม่ทับแผนจัดคิวเดิมที่นักวางแผนจัดระเบียบไว้อย่างประณีต ระบบจึงมีระบบสำรองข้อมูลอัตโนมัติ:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2.5, m: 0, '& li': { mb: 1.5, color: '#475569', fontSize: '0.875rem', lineHeight: 1.6, fontWeight: 550 } }}>
                      <li>
                        <strong>สร้างจุดกู้คืนอัตโนมัติ:</strong> ทุกครั้งก่อนที่จะเริ่มการกดบันทึกข้อมูลนำเข้าจาก Excel ใหม่ (ทั้งแบบดึง Shared Drive และแบบแมนนวล) ระบบจะทำการสำรองโครงสร้างแผน ณ เสี้ยววินาทีนั้นบันทึกเก็บไว้เป็นประวัติย้อนหลังอัตโนมัติ
                      </li>
                      <li>
                        <strong>จำกัดประวัติย้อนหลัง:</strong> ระบบจะจัดเก็บและวนลูปประวัติกู้คืนแผนไว้สูงสุด 3 เวอร์ชันล่าสุด (Version 1 - 3) เพื่อประหยัดพื้นที่ฐานข้อมูล
                      </li>
                      <li>
                        <strong>วิธีการกู้คืนแผนเดิม (Rollback):</strong> ในแถบด้านขวาของหน้าจออัปโหลด จะแสดงไทม์ไลน์จุดย้อนกลับ Planner สามารถตรวจดู วัน เวลา ที่สร้าง และคลิกปุ่ม **"กู้คืนแผนนี้ (Rollback)"** โดยระบบจะแสดงบ็อกซ์ยืนยันและนำแผนเก่าทั้งหมดมาเขียนทับกลับคืนสู่ฐานข้อมูลทันทีในเวลาไม่เกิน 2 วินาที
                      </li>
                    </Box>
                  </Stack>
                </Grid>
                <Grid size={{ xs: 12, md: 5 }}>
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3.5,
                      bgcolor: '#fafafa',
                      border: '1.5px dashed rgba(217, 119, 6, 0.2)',
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 850, color: '#b45309', mb: 1.5 }}>
                      ⚠️ ข้อควรระวังระหว่างการกู้คืนคิว (Rollbacks)
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontWeight: 600, textAlign: 'left', lineHeight: 1.65 }}>
                      การกด Rollback จะทำการเขียนทับข้อมูลแผนการผลิตทั้งหมดในฐานข้อมูลปัจจุบัน ดังนั้นหลังจากสั่งย้อนกลับแล้ว แผนการจัดเรียงบนแดชบอร์ดหลักจะเปลี่ยนเป็นของเวอร์ชันอดีตนั้นทันทีเพื่อให้นักวางแผนตรวจสอบงาน
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {/* Section 5: การส่งออกรายงานแผนผลิต */}
          <Divider sx={{ my: 1, borderColor: 'rgba(15, 23, 42, 0.06)' }} />

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              📊 4. ระบบส่งออกตารางแผนผลิตระดับมืออาชีพ (Filtered Multi-Sheet Excel Export)
            </Typography>

            <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4, border: '1px solid rgba(15, 23, 42, 0.05)' }}>
              <Stack spacing={2.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 850, color: '#059669', display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Refresh size="24" color="currentColor" variant="Bulk" />
                  การดาวน์โหลดไฟล์จัดโครงสร้างรายงานสำหรับหน้าเครื่อง
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 600, lineHeight: 1.6 }}>
                  เพื่อความรวดเร็วในการประสานงานและแจกจ่ายงานสู่ Operator หน้าเครื่องจักร ระบบจึงมีฟังก์ชันส่งออก Excel ระดับสูง:
                </Typography>
                <Box component="ul" sx={{ pl: 2.5, m: 0, '& li': { mb: 1.5, color: '#475569', fontSize: '0.875rem', lineHeight: 1.6, fontWeight: 550 } }}>
                  <li>
                    <strong>ส่งออกตามตัวกรองปัจจุบัน (Real-time Filtered Export):</strong> หากนักวางแผนกดกรองหน้าจอแดชบอร์ด เช่น คัดกรองเฉพาะสถานะ WIP, เจาะจงเฉพาะปีหรือเดือนผลิต หรือค้นหารหัสใบสั่งงานแบบเฉพาะเจาะจง เมื่อกดปุ่ม **"EXPORT EXCEL"** ข้อมูลคิวที่ถูกดาวน์โหลดออกมาจะตรงกับข้อมูลคัดกรองที่แสดงอยู่หน้าบอร์ดจัดคิวนั้น ๆ ทันที
                  </li>
                  <li>
                    <strong>โครงสร้างแยกรายเครื่องจักร (Multi-Sheet Tabs):</strong> ภายในไฟล์ Excel ที่ดาวน์โหลดออกมา จะถูกจัดสรรแบ่งหน้าเป็นชีตย่อยด้านล่างอย่างชาญฉลาด:
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;• <strong>ชีต "ภาพรวมแผนผลิต" (Dashboard):</strong> แสดงตารางสรุปกำลังผลิตรวม และตารางแสดงสถิติกำลังโหลดงานรวมของแต่ละเครื่องจักรให้วิเคราะห์ง่าย
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;• <strong>ชีต "แผนหลักเรียงลำดับคิว" (Master):</strong> รวบรวมข้อมูลรายการงานผลิตทั้งหมดที่กรอง
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;• <strong>ชีตรายเครื่องจักร "เครื่อง [รหัส]" (Per WC Tabs):</strong> จะทำการตัดแบ่งเฉพาะคิวงานที่ต้องรันของเครื่องจักรเครื่องนั้น ๆ ออกมาเปรียบเสมือนใบส่งงานประจำเครื่อง ทำให้สามารถพิมพ์หรือส่งงานเฉพาะเครื่องจักรได้ง่าย
                  </li>
                  <li>
                    <strong>ระบบปรับความกว้างช่องและจัดวันที่อัตโนมัติ:</strong> คอลัมน์วันที่จะถูกแปลงเป็นรูปแบบอ่านสะดวก และขนาดช่องตารางของทุกชีตจะทำการยืดขยายตามค่าความยาวจริงในคอลัมน์อัตโนมัติ เพื่อหมดกังวลเรื่องการแสดงผลบีบอัดจนอ่านไม่เข้าใจ
                  </li>
                </Box>
              </Stack>
            </Paper>
          </Box>

          {/* Section 6: ย้ายแผนการผลิตด่วน (Quick Reschedule) */}
          <Divider sx={{ my: 1, borderColor: 'rgba(15, 23, 42, 0.06)' }} />

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              ⚡ 5. ระบบย้ายแผนการผลิตด่วน (Quick Reschedule)
            </Typography>

            <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 4, border: '1px solid rgba(15, 23, 42, 0.05)' }}>
              <Stack spacing={3}>
                <Typography variant="body2" sx={{ color: '#475569', fontWeight: 650, lineHeight: 1.6 }}>
                  เมื่อเกิดเหตุฉุกเฉินที่ต้องย้ายงานผลิตไปเครื่องจักรอื่นหรือเปลี่ยนวันเริ่มต้นผลิตใหม่ทันที นักวางแผนสามารถใช้ฟังก์ชัน **"ย้ายแผนการผลิตด่วน (Quick Reschedule)"** ในหน้ารายละเอียดใบสั่งงาน (Order Detail Modal) ได้โดยไม่ต้องลากย้ายบนบอร์ดเอง
                </Typography>

                {/* Steps */}
                <Stack spacing={2.5}>
                  {[
                    {
                      step: 'ขั้นตอนที่ 1',
                      title: 'เปิดรายละเอียดใบสั่งงาน (Order Detail Modal)',
                      color: '#4f46e5',
                      desc: 'คลิกที่การ์ดของงานที่ต้องการย้ายบนหน้าแดชบอร์ดจัดคิว ระบบจะแสดง Modal ข้อมูลรายละเอียดงานผลิตขึ้นมา ภายในจะแสดงข้อมูลครบถ้วน เช่น Order Number, เครื่องจักรปัจจุบัน, วันเริ่ม-สิ้นสุด, จำนวนผลิต และรายละเอียดอื่น ๆ',
                    },
                    {
                      step: 'ขั้นตอนที่ 2',
                      title: 'กดปุ่ม "⚡ ย้ายแผนการผลิตด่วน (Quick Reschedule)"',
                      color: '#2563eb',
                      desc: 'ที่ด้านขวาของ Modal จะมีปุ่มสีม่วง "⚡ ย้ายแผนการผลิตด่วน (Quick Reschedule)" กดเพื่อเปิดแผงเครื่องมือย้ายงานทางลัดขึ้นมา หากต้องการปิดแผงนี้สามารถกดปุ่มเดิมอีกครั้ง (ข้อความจะเปลี่ยนเป็น "❌ ปิดเครื่องมือย้ายงาน")',
                    },
                    {
                      step: 'ขั้นตอนที่ 3',
                      title: 'เลือกเครื่องจักรปลายทาง (Work Center)',
                      color: '#0891b2',
                      desc: 'ในแผง Quick Reschedule จะมีช่อง Dropdown ให้เลือกเครื่องจักรปลายทาง (Work Center) ที่ต้องการย้ายงานไป ระบบจะแสดงรายการเครื่องจักรทั้งหมดที่มีในระบบให้เลือก โดยค่าเริ่มต้นจะเป็นเครื่องจักรปัจจุบันของงาน',
                    },
                    {
                      step: 'ขั้นตอนที่ 4',
                      title: 'กำหนดวันที่เริ่มต้นแผนใหม่ (Start Date)',
                      color: '#059669',
                      desc: 'เลือกวันที่เริ่มต้นผลิตใหม่ผ่าน Date Picker โดยหน้า Timeline จะเลื่อน Finish Date ตามจำนวนวันที่ย้ายและรักษาระยะเวลาระหว่าง Start Date กับ Finish Date เดิมไว้ ส่วนวันผลิตเสร็จบนกราฟคำนวณจาก Start Date + PRD.(Days) และระบบจะแสดงสถานะ LATE หากวันผลิตเสร็จเกิน Finish Date ใหม่',
                    },
                    {
                      step: 'ขั้นตอนที่ 5',
                      title: 'กดปุ่ม "ย้ายและจัดลำดับคิว" เพื่อบันทึก',
                      color: '#7c3aed',
                      desc: 'เมื่อเลือกเครื่องจักรและวันที่เรียบร้อยแล้ว กดปุ่มสีม่วง "ย้ายและจัดลำดับคิว" ระบบจะย้ายงานและคำนวณ Seq ใหม่ด้วยตรรกะ Default Setting ในหน้าจอก่อน จากนั้นจะแจ้ง Seq ใหม่และรอให้ผู้ใช้กดปุ่มบันทึกแผนเพื่อส่งการเปลี่ยนแปลงลงฐานข้อมูล',
                    },
                  ].map((item, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 2.5, position: 'relative' }}>
                      {idx < 4 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 20,
                            top: 40,
                            bottom: -30,
                            width: 2,
                            bgcolor: 'rgba(15, 23, 42, 0.08)',
                            zIndex: 1,
                          }}
                        />
                      )}
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: '50%',
                          bgcolor: item.color,
                          color: '#ffffff',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 850,
                          fontSize: '0.9rem',
                          zIndex: 2,
                          boxShadow: `0 4px 12px ${item.color}33`,
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </Box>
                      <Box sx={{ flex: 1, pb: idx < 4 ? 3 : 0 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, mb: 0.75 }}>
                          <Chip
                            size="small"
                            label={item.step}
                            sx={{
                              bgcolor: `${item.color}15`,
                              color: item.color,
                              fontWeight: 800,
                              height: 20,
                              fontSize: '0.68rem',
                              border: `1px solid ${item.color}35`,
                            }}
                          />
                          <Typography variant="body1" sx={{ fontWeight: 850, color: '#0f172a' }}>
                            {item.title}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, maxWidth: 840, fontWeight: 550 }}>
                          {item.desc}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ borderColor: 'rgba(15, 23, 42, 0.06)' }} />

                <Stack direction="row" spacing={1.5} sx={{ bgcolor: 'rgba(245, 158, 11, 0.04)', p: 3, borderRadius: 2.5, border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                  <Box sx={{ color: '#d97706', mt: 0.25 }}>
                    <InfoCircle size="20" variant="Bold" color="currentColor" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#92400e', fontWeight: 850, mb: 1, fontSize: '0.86rem' }}>
                      💡 ตรรกะการจัดลำดับคิวเมื่อย้ายงาน (Queue Re-sequencing Logic):
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 1, color: '#92400e', fontSize: '0.82rem', lineHeight: 1.6, fontWeight: 600 } }}>
                      <li>
                        <strong>ใช้ Default Setting Logic เดียวกัน:</strong> หลังย้ายงาน ระบบจะจัดคิวใหม่ทั้ง Work Center ต้นทางและปลายทางด้วยกฎเดียวกับปุ่ม DEFAULT SETTING ไม่ใช่เพียงเพิ่ม Seq ต่อท้าย
                      </li>
                      <li>
                        <strong>เกณฑ์การเรียงคิว:</strong> ระบบเรียงตามประเภทเหล็ก (zpg1d), Start Date, ขนาด (zpg2d), สี/กลุ่ม L/Q (zpg3d), รหัส L/Q, OP, finish date และลำดับจากข้อมูลต้นฉบับ พร้อมรักษาลำดับ OP และความต่อเนื่องของ Work Order
                      </li>
                      <li>
                        <strong>ผลลัพธ์หลังย้าย:</strong> ระบบกำหนด Seq ใหม่เป็น 1, 2, 3… ให้ทุกงานในคิวที่ได้รับผลกระทบ ดังนั้นงานที่ย้ายไปวันใหม่จะอยู่ในตำแหน่งที่ตรรกะ Default Setting คำนวณ ไม่จำเป็นต้องอยู่ท้ายคิวเสมอ
                      </li>
                      <li>
                        <strong>บันทึกด้วยผู้ใช้ทุกหน้า:</strong> การย้ายจาก Quick Reschedule ในหน้า Planning Dashboard, Gantt Timeline และ Day Timeline ใช้ตรรกะเดียวกัน แต่ยังไม่บันทึกฐานข้อมูลทันที ต้องกดปุ่มบันทึกแผนของหน้านั้นเพื่อยืนยันการเปลี่ยนแปลง
                      </li>
                    </Box>
                  </Box>
                </Stack>
              </Stack>
            </Paper>
          </Box>

        </Stack>
      </Container>
    </Box>
  );
}
