import { NextRequest, NextResponse } from 'next/server';
import { askAssistant } from '@/lib/intelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = (body?.message || '').toString().slice(0, 500);
    if (!message.trim()) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }
    const result = askAssistant(message);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[assistant] error', err);
    return NextResponse.json({ error: 'Assistant unavailable' }, { status: 500 });
  }
}
