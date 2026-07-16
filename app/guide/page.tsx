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
} from '@mui/material';
import {
  Data,
  InfoCircle,
  TaskSquare,
} from 'iconsax-react';

export default function GuidePage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Stack spacing={3.5}>
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
                      <strong>การย้ายข้ามประเภทเหล็ก:</strong> หากลาก Work Order ไปอีกกลุ่มประเภทเหล็ก ระบบจะบันทึกกลุ่มลำดับ (Sequence Group) ปลายทางแยกต่างหาก โดยคงข้อมูลประเภทเหล็กจริงตาม ZPG1D เดิมไว้
                    </li>
                    <li>
                      <strong>การขยับทีละตำแหน่ง:</strong> กดปุ่มลูกศรขึ้นหรือลูกศรลงที่มุมขวาของแถวงาน เพื่อขยับลำดับขึ้นหรือลงทีละ 1 ลำดับได้อย่างรวดเร็ว
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
                      <strong>เครื่องจักร (Machines):</strong> เลือกดูทุก Work Center หรือเลือกเฉพาะเครื่องจักรหนึ่งเครื่องจากแถบด้านบน ระบบจะจำกัด Status card และตารางแผนตามเครื่องที่เลือก
                    </li>
                    <li>
                      <strong>ค้นหา Order Number:</strong> ค้นหาด้วยเลข Order แบบบางส่วนได้ โดยระบบไม่แยกตัวพิมพ์เล็กและตัวพิมพ์ใหญ่
                    </li>
                    <li>
                      <strong>ปีและเดือน:</strong> กรองตามปีแผนงานและเดือนของ <strong>Start Date (stdate)</strong> หากเลือกทั้งหมด ระบบจะไม่จำกัดช่วงวันที่
                    </li>
                    <li>
                      <strong>สถานะ (Status):</strong> ใช้ Checkbox เพื่อเลือกได้หลายสถานะจาก NOT START, START, WAIT และ DONE สถานะที่เลือกทำงานร่วมกันแบบ OR หรือเลือก “ทั้งหมด” เพื่อแสดงทุกสถานะ โดย Status card ยังแสดงยอดของทุกสถานะในขอบเขตเครื่องจักร ปี เดือน และ Order ที่เลือกเพื่อใช้เปรียบเทียบ
                    </li>
                    <li>
                      <strong>การทำงานร่วมกันของ Filter:</strong> เครื่องจักร, Order, ปี, เดือน และ Status ใช้ร่วมกันแบบต้องตรงทุกเงื่อนไข (AND) และปุ่ม “ล้างตัวกรอง” จะคืนค่าทั้งหมดเป็นค่าเริ่มต้น
                    </li>
                    <li>
                      <strong>สถานะการแก้ไข (Dirty State):</strong> เมื่อใดที่มีการลากวางปรับลำดับงานค้างอยู่ ระบบจะแสดงบอลลูนลอยตัวสีน้ำเงินที่มุมขวาล่างเพื่อแจ้งเตือนว่ามีคิวรอการบันทึก
                    </li>
                    <li>
                      <strong>การตรวจสอบผลการเปลี่ยนคิว:</strong> กดไอคอนรูปเอกสารในบอลลูนเพื่อตรวจสอบว่ามีงานชิ้นใดบ้างที่มีตำแหน่งหรือกลุ่มผิดแปลกไปจากเดิม
                    </li>
                    <li>
                      <strong>บันทึกลงฐานข้อมูล:</strong> กดปุ่ม <strong>SAVE</strong> หรือ <strong>SAVE CHANGES</strong> เพื่ออัปเดตข้อมูลเข้าไปยัง MySQL (ผ่าน API /api/jobs/resequence แบบเป็นกลุ่มเพื่อความรวดเร็ว)
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
              ตอนโหลดหน้าแรก ระบบจะจัดลำดับคิวพื้นฐานตาม 7 ลำดับชั้น ตั้งแต่ประเภทเหล็ก วันเริ่มผลิต ไปจนถึงคิวเดิมจากไฟล์ต้นฉบับ หลังจากนั้น Planner สามารถลากปรับลำดับและกด SAVE ได้:
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
                  title: 'จัดกลุ่มตามขั้นตอนการผลิต (OP - vornr)',
                  color: '#7c3aed',
                  desc: 'ภายในวันเริ่มผลิตเดียวกัน ระบบจะเรียงงานตามหมายเลขขั้นตอนการผลิต (OP หรือ vornr) ก่อน เพื่อให้งานขั้นตอนเดียวกันอยู่ติดกัน',
                },
                {
                  step: 'ขั้นตอนที่ 6',
                  title: 'จัดกลุ่มตามรหัส L/Q (L/Q Code - zlmat)',
                  color: '#d97706',
                  desc: 'ภายใน OP เดียวกัน ระบบจะรวมงานที่ใช้รหัส L/Q (zlmat) เดียวกันให้อยู่ติดกัน และพยายามต่อรหัสเดิมจากกลุ่มขนาดก่อนหน้าเมื่อสีตรงกัน เพื่อลดจำนวนครั้งในการล้างและเปลี่ยนสารเคลือบ',
                },
                {
                  step: 'ขั้นตอนที่ 7',
                  title: 'เรียงลำดับวันกำหนดส่ง และคิวเดิม (Due Date & Source Row)',
                  color: '#475569',
                  desc: 'ในระดับย่อยที่สุดหากงานมีเงื่อนไขตามข้อข้างต้นตรงกันทุกประการ ระบบจะเรียงคิวตามวันกำหนดส่งผลิต (Findate) เสมอ และหากวันกำหนดส่งตรงกันอีก จะใช้ตำแหน่งเดิมตามไฟล์ Excel ต้นฉบับ (Source Row) เพื่อรักษาโครงสร้างดั้งเดิมไว้',
                },
              ].map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 2.5, position: 'relative' }}>
                  {/* Step line connector */}
                  {idx < 6 && (
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

                  <Box sx={{ flex: 1, pb: idx < 6 ? 3 : 0 }}>
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
                <InfoCircle size="20" variant="Bold" color="currentColor" />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 850, color: 'primary.main', mb: 1 }}>
                  คำแนะนำสำหรับนักวางแผนลำดับงาน (Tips for Planners):
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.6, fontSize: '0.875rem', mb: 2 }}>
                  ระบบสร้างคิวพื้นฐานให้อัตโนมัติเมื่อนำเข้าข้อมูล โดยให้ Start Date เป็นเงื่อนไขสำคัญภายในกลุ่มประเภทเหล็ก Planner สามารถทำ Fine-tuning ด้วยการลากจัดลำดับตามสถานการณ์หน้างาน แล้วตรวจสอบรายการเปลี่ยนแปลงก่อนกด SAVE
                </Typography>

                <Typography variant="subtitle1" sx={{ fontWeight: 850, color: 'primary.main', mb: 1.5 }}>
                  💡 ขอบเขตของ Filter และการแก้ไขคิว:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.65, fontSize: '0.875rem', mb: 2 }}>
                  • <strong>Filter มีผลต่อรายการที่มองเห็น:</strong>
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;ระบบกรองตามเครื่องจักร, เลข Order, ปีและเดือนของ Start Date และ Status โดยต้องตรงทุกเงื่อนไขที่เลือก งานนอก Filter จะไม่แสดงในตาราง แต่ยังคงอยู่ในแผนและฐานข้อมูล
                  <br /><br />
                  • <strong>Filter ไม่ได้จัดลำดับคิวใหม่อัตโนมัติ:</strong>
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;การเปลี่ยนลำดับเกิดจากการลากวาง ขยับขึ้น-ลง ย้าย Work Center หรือกด “จัดเรียงคิวอัตโนมัติ” การเปลี่ยนแปลงยังไม่ลงฐานข้อมูลจนกว่าจะกด SAVE
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
