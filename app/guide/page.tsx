'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowLeft,
  Book,
  Clock,
  Data,
  InfoCircle,
  Setting2,
  StatusUp,
  TaskSquare,
} from 'iconsax-react';

export default function GuidePage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={3.5}>
          {/* Header Card */}
          <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 2 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2.5}
              sx={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)',
                  }}
                >
                  <Book size="24" color="#ffffff" variant="Bold" />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 900 }}>
                    คู่มือการใช้งานระบบ (User Manual)
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                    คู่มืออธิบายฟังก์ชันการทำงาน และอัลกอริทึมการจัดเรียงคิวอัตโนมัติของ PSC Planing
                  </Typography>
                </Box>
              </Stack>
              <Button
                component={Link}
                href="/"
                variant="outlined"
                startIcon={<ArrowLeft size="18" />}
                sx={{
                  borderRadius: 1.5,
                  fontWeight: 750,
                  px: 2.5,
                  py: 1,
                }}
              >
                กลับไปแดชบอร์ดจัดคิว
              </Button>
            </Stack>
          </Paper>

          {/* Section 1: วิธีการใช้งาน Dashboard */}
          <Typography variant="h6" sx={{ fontWeight: 850, pl: 1, color: 'text.primary' }}>
            🖥️ 1. คู่มือการใช้งานแดชบอร์ดจัดคิว
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}
          >
            <Card sx={{ height: '100%', borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.05)', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TaskSquare size="20" color="currentColor" variant="Bold" />
                    การจัดการคิวงานผลิต (Manual Organizing)
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    คุณสามารถจัดการและเปลี่ยนตำแหน่งคิวงานผลิตของแต่ละเครื่องจักร (Work Center) ได้ตามขั้นตอนดังนี้:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 1, color: 'text.secondary', fontSize: '0.875rem' } }}>
                    <li>
                      <strong>การลากและวาง (Drag & Drop):</strong> กดเมาส์ค้างที่ไอคอนแฮมเบอร์เกอร์ขวาสุดของแถวงานผลิต ลากขึ้นหรือลงเพื่อแทรกตำแหน่งงานตามที่คุณต้องการ
                    </li>
                    <li>
                      <strong>การสลับกลุ่มอัตโนมัติ:</strong> หากคุณลากสลับคิวข้ามประเภทเหล็ก (เช่น นำเหล็กอาบปี๊บยัดเข้าไปในกลุ่มเหล็ก 3-Piece) ระบบจะจำกลุ่มวัตถุดิบใหม่ให้สอดคล้องกันโดยอัตโนมัติ
                    </li>
                    <li>
                      <strong>การขยับทีละตำแหน่ง:</strong> กดปุ่มลูกศรขึ้นหรือลูกศรลงที่มุมขวาของแถวงาน เพื่อขยับคิวขึ้นหรือลงทีละ 1 ลำดับได้อย่างรวดเร็ว
                    </li>
                    <li>
                      <strong>การเลือกครั้งละหลายงาน (Multi-Select):</strong> ติ๊กถูกหน้าคิวงานหลายแถวเพื่อทำการลากวางจัดกลุ่ม หรือกดลูกศรขึ้น-ลงเพื่อย้ายไปพร้อมกันทั้งหมด
                    </li>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ height: '100%', borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.05)', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Data size="20" color="currentColor" variant="Bold" />
                    ตัวกรองและการบันทึกข้อมูล (Sync & Filters)
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    การคัดกรองข้อมูล และระบบบันทึกคิวลงฐานข้อมูลหลักมีเงื่อนไขดังนี้:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 1, color: 'text.secondary', fontSize: '0.875rem' } }}>
                    <li>
                      <strong>การคัดกรองข้อมูล:</strong> คุณสามารถเลือกกรองแผนการทำงานเฉพาะปีและเดือนที่ต้องการวางแผนได้ผ่านตัวเลือกปีและเดือนในแถบตัวกรองด้านซ้ายมือ
                    </li>
                    <li>
                      <strong>สถานะการแก้ไข (Dirty State):</strong> เมื่อใดที่มีการลากวางปรับลำดับงานค้างอยู่ ระบบจะแสดงบอลลูนลอยตัวสีน้ำเงินที่มุมขวาล่างเพื่อแจ้งเตือนว่ามีคิวรอการบันทึก
                    </li>
                    <li>
                      <strong>การตรวจสอบผลการเปลี่ยนคิว:</strong> กดไอคอนรูปเอกสารในบอลลูนเพื่อตรวจสอบว่ามีงานชิ้นใดบ้างที่มีตำแหน่งหรือกลุ่มผิดแปลกไปจากเดิม
                    </li>
                    <li>
                      <strong>บันทึกลงฐานข้อมูล:</strong> กดปุ่ม <strong>"SAVE"</strong> หรือ <strong>"SAVE"</strong> เพื่ออัปเดตข้อมูลเข้าไปยัง MySQL (ผ่าน API /api/jobs/resequence แบบเป็นกลุ่มเพื่อความรวดเร็ว)
                    </li>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Section 2: เงื่อนไขการจัดคิวอัตโนมัติ */}
          <Divider sx={{ my: 1 }} />

          <Typography variant="h6" sx={{ fontWeight: 850, pl: 1, color: 'text.primary' }}>
            ⚙️ 2. เงื่อนไขและกฎอัลกอริทึมการจัดคิวอัตโนมัติ (Auto Arrange Logic)
          </Typography>

          <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
              เมื่อคุณกดปุ่ม <strong>"จัดลำดับงานด่วน"</strong> หรือ <strong>"จัดเรียงทั้งหมด"</strong> ระบบจะนำสูตรคัดเลือกและเรียงลำดับซ้อนกัน 5 ลำดับชั้นมาเรียงคิวคัดกรองโดยไม่ต้องจัดมือตามหลักเกณฑ์นี้:
            </Typography>

            {/* Visual Flowchart */}
            <Stack spacing={2.5}>
              {[
                {
                  step: 'ขั้นตอนที่ 1',
                  title: 'คัดกรองความเร่งด่วนสูงสุด (Urgent Priority)',
                  color: '#dc2626',
                  desc: 'ระบบจะสแกนหาใบสั่งผลิตที่มีกำหนดส่งเสร็จ (Finish Date) ภายในระยะเวลา 3 วันถัดไป (นับรวมวันนี้) แล้วดันงานกลุ่มนี้ขึ้นคิวหน้าสุดของตารางก่อนเสมอ และจัดกลุ่มตามวันส่งมอบ (เนื่องจากเป็นงานด่วน)',
                },
                {
                  step: 'ขั้นตอนที่ 2',
                  title: 'จัดกลุ่มแยกตามประเภทแผ่นเหล็ก (Material Group 1 - zpg1d)',
                  color: '#4f46e5',
                  desc: 'แยกประเภทการผลิตตามชนิดเหล็กหลักเพื่อไม่ให้เครื่องจักรทำงานสับสน โดยเรียงลำดับกลุ่มดังนี้: 1) เหล็กอาบปี๊บ (tinplate) ➡️ 2) เหล็กอาบ 3-Piece (three_piece) ➡️ 3) เหล็กอาบ NE (ne) ➡️ 4) เหล็กอาบ DRD (drd) ➡️ 5) เหล็กอาบ EOE (eoe)',
                },
                {
                  step: 'ขั้นตอนที่ 3',
                  title: 'จัดกลุ่มตามขนาดของแผ่นเหล็ก (Material Group 2 - zpg2d)',
                  color: '#0891b2',
                  desc: 'ระบบจะนำขนาดมิติความยาว-กว้างของแผ่นเหล็ก (เช่น คลีนจาก 0.20x250x300 เหลือ 250x300) มาทำการกรุ๊ปและเรียงลำดับ เพื่อให้การพิมพ์หรือการเคลือบขนาดแผ่นเดียวกันทำได้รวดเร็วต่อเนื่องโดยไม่ต้องสลับแม่พิมพ์บ่อย',
                },
                {
                  step: 'ขั้นตอนที่ 4',
                  title: 'อัลกอริทึมต่อสารเคลือบเพื่อลดเวลาหยุดล้างห้องเครื่อง (Lacquer Transition Algorithm)',
                  color: '#059669',
                  desc: 'เพื่อหลีกเลี่ยงการเสียเวลาหยุดเครื่องล้างทำความสะอาดสารเคลือบ/แลกเกอร์ (Varnish Changeovers): ระบบจะจดจำว่าแผ่นเหล็กชิ้นที่แล้วใช้แลกเกอร์อะไรเคลือบค้างอยู่ แล้วจะสแกนค้นหางานชิ้นถัดไปที่ใช้แลกเกอร์ชนิดเดียวกันขึ้นมาผลิตเป็นอันดับแรกทันทีเพื่อ "สวมต่อคิว" ช่วยลดจำนวนครั้งในการล้างเครื่องลงอย่างมีนัยสำคัญ',
                },
                {
                  step: 'ขั้นตอนที่ 5',
                  title: 'เรียงลำดับวันกำหนดส่ง และคิวเดิม (Due Date & Source Row)',
                  color: '#475569',
                  desc: 'ในระดับย่อยที่สุดหากงานมีเงื่อนไขตามข้อข้างต้นตรงกันทุกประการ ระบบจะเรียงคิวตามวันกำหนดส่งผลิต (Findate) เสมอ และหากวันกำหนดส่งตรงกันอีก จะใช้ตำแหน่งเดิมตามไฟล์ Excel ต้นฉบับ (Source Row) เพื่อรักษาโครงสร้างดั้งเดิมไว้',
                },
              ].map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2.5, position: 'relative' }}>
                  {/* Step line connector */}
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
                      <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {item.title}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, maxWidth: 840 }}>
                      {item.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>

            <Divider sx={{ my: 4 }} />

            <Stack direction="row" spacing={1.5} sx={{ bgcolor: 'rgba(79, 70, 229, 0.035)', p: 2.5, borderRadius: 2, border: '1px solid rgba(79, 70, 229, 0.1)' }}>
              <Box sx={{ color: 'primary.main', mt: 0.25 }}>
                <InfoCircle size="20" variant="Bold" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 850, color: 'primary.main', mb: 1 }}>
                  คำแนะนำสำหรับนักวางแผนคิวงาน (Tips for Planners):
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.6, fontSize: '0.875rem', mb: 2 }}>
                  อัลกอริทึมการจัดเรียงอัตโนมัติสร้างมาเพื่อลดภาระงานส่วนใหญ่ในการทำคิวรอบแรก อย่างไรก็ตาม นักวางแผนคิวยังคงสามารถทำ Fine-tuning หรือลากจัดลำดับเพื่อความเหมาะสมเฉพาะหน้าหน้างานเพิ่มเติมได้อย่างอิสระ หลังจากรันคำสั่งจัดเรียงอัตโนมัติแล้ว เพื่อการผลิตที่มีประสิทธิภาพสูงสุด
                </Typography>

                <Typography variant="subtitle1" sx={{ fontWeight: 850, color: 'primary.main', mb: 1.5 }}>
                  💡 หลักการเรียงคิว ก่อน และ หลัง กดปุ่มจัดเรียงเครื่องนี้:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.65, fontSize: '0.875rem', mb: 2 }}>
                  • <strong>ก่อนกดปุ่ม (สถานะเริ่มต้นหลังจากนำเข้าจาก Excel ครั้งแรก):</strong>
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<strong>เน้นประสิทธิภาพการเปลี่ยนสี/แลกเกอร์สูงสุด:</strong> ระบบจะจัดกลุ่มตามประเภทเหล็ก (zpg1d), มิติความกว้าง-ยาว (zpg2d), และจับคู่ชนิดแลกเกอร์ที่เหมือนกัน (zpg3d) เพื่อให้เครื่องจักรวิ่งงานได้อย่างต่อเนื่องและหยุดล้างเครื่อง (Changeover) น้อยที่สุด โดยจะยัง<strong>ไม่ได้ดึง</strong>งานส่งมอบด่วนภายใน 3 วันขึ้นมากองไว้หน้าสุดเดี่ยวๆ เพื่อรักษาประสิทธิภาพการผลิตและรอบล้างเครื่องที่ดีที่สุดของกลุ่มสินค้าเอาไว้
                  <br /><br />
                  • <strong>หลังกดปุ่ม (จัดลำดับงานด่วน หรือ จัดเรียงทั้งหมด):</strong>
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;<strong>เน้นการส่งมอบงานด่วนไม่ให้ล่าช้าก่อน:</strong> ระบบจะเปิดใช้กฎ <strong>"งานด่วนพิเศษ (Urgent Priority)"</strong> ดึงใบสั่งผลิตที่มีกำหนดส่งเสร็จ (Finish Date) ภายในระยะเวลา 3 วันถัดไปขึ้นมาอยู่คิวลำดับแรกสุดของเครื่องจักรนั้นๆ เสมอ เพื่อช่วยป้องกันปัญหาผลิตไม่ทันกำหนดส่ง จากนั้นค่อยนำงานปกติที่เหลือมาจัดกลุ่มและเรียงต่อสีเคลือบ/แลกเกอร์เพื่อประหยัดเวลาล้างเครื่องต่อท้ายตามลำดับ
                </Typography>

                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 800, display: 'block', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  ** ไฟล์ excel ถูกเก็บไว้ที่ pscprdk2web\D:\SAP_XLSX\ZPP001
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
