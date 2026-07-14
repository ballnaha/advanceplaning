import type { PlanningAnalysis } from '@/lib/planning-analyzer';

export const runtime = 'nodejs';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type PlanningAiRequest = {
  question?: string;
  history?: ChatMessage[];
  analysis?: PlanningAnalysis;
};

type DeepSeekResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
};

function getDeepSeekConfig() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY?.trim() || '',
    baseUrl: (process.env.DEEPSEEK_API_BASE_URL?.trim() || 'https://api.deepseek.com').replace(/\/$/, ''),
    model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-flash',
  };
}

export async function GET() {
  const config = getDeepSeekConfig();
  return Response.json({
    configured: Boolean(config.apiKey),
    provider: 'DeepSeek',
    model: config.model,
  });
}

export async function POST(request: Request) {
  const config = getDeepSeekConfig();
  if (!config.apiKey) {
    return Response.json(
      {
        error: 'ยังไม่ได้ตั้งค่า DEEPSEEK_API_KEY ฝั่ง Server',
        code: 'AI_NOT_CONFIGURED',
      },
      { status: 503 },
    );
  }

  let body: PlanningAiRequest;
  try {
    body = (await request.json()) as PlanningAiRequest;
  } catch {
    return Response.json({ error: 'รูปแบบ Request ไม่ถูกต้อง' }, { status: 400 });
  }

  const question = body.question?.trim() || '';
  if (!question || question.length > 2000) {
    return Response.json({ error: 'คำถามต้องมีความยาว 1–2,000 ตัวอักษร' }, { status: 400 });
  }
  if (!body.analysis || typeof body.analysis !== 'object') {
    return Response.json({ error: 'ไม่พบผลวิเคราะห์แผนจาก Local Analyzer' }, { status: 400 });
  }

  const history = Array.isArray(body.history)
    ? body.history
      .filter((message) => (
        (message.role === 'user' || message.role === 'assistant') &&
        typeof message.content === 'string'
      ))
      .slice(-8)
      .map((message) => ({ role: message.role, content: message.content.slice(0, 4000) }))
    : [];

  const systemPrompt = [
    'คุณคือผู้ช่วยวิเคราะห์แผนการผลิต ตอบภาษาไทย กระชับ ชัดเจน และอ้างอิงตัวเลขจาก JSON เท่านั้น',
    'เป้าหมายหลักคือทำให้การเปลี่ยน L/Q น้อยที่สุด โดยต้องเคารพประเภทเหล็ก Start Date และลำดับ OP ตาม Planning Rules',
    'Status ยังไม่ถูกใช้ในการคำนวณ ห้ามนำ Status มาสรุปเป็นเหตุผลจัดลำดับ',
    'ห้ามอ้างว่าการย้ายข้าม Work Center ทำได้แน่นอนหากไม่มี Eligible Work Center master ให้เรียกว่า Candidate ที่ต้องตรวจสอบ',
    'ห้ามสั่งแก้ฐานข้อมูลหรือยืนยันแผนแทนผู้ใช้ ให้เสนอ Preview และผลกระทบก่อนเสมอ',
    'หากข้อมูลไม่พอ ให้บอกตรง ๆ ว่าขาดข้อมูลอะไร ห้ามแต่งตัวเลขหรือชื่อเครื่อง',
  ].join('\n');
  const analysisContext = JSON.stringify(body.analysis);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'system',
            content: `ผลจาก Local Planning Analyzer (JSON):\n${analysisContext}`,
          },
          ...history,
          { role: 'user', content: question },
        ],
        thinking: { type: 'disabled' },
        temperature: 0.2,
        max_tokens: 1400,
        stream: false,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    const payload = (await response.json()) as DeepSeekResponse;
    if (!response.ok) {
      return Response.json(
        { error: payload.error?.message || `DeepSeek API ตอบกลับ ${response.status}` },
        { status: 502 },
      );
    }

    const answer = payload.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return Response.json({ error: 'DeepSeek ไม่ได้ส่งคำตอบกลับมา' }, { status: 502 });
    }

    return Response.json({
      answer,
      provider: 'DeepSeek',
      model: config.model,
      usage: payload.usage ?? null,
    });
  } catch (error) {
    const isTimeout = error instanceof DOMException && error.name === 'TimeoutError';
    return Response.json(
      { error: isTimeout ? 'DeepSeek ใช้เวลาตอบเกิน 60 วินาที' : 'เชื่อมต่อ DeepSeek API ไม่สำเร็จ' },
      { status: 502 },
    );
  }
}

