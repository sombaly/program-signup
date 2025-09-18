import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { readJSON, writeJSON } from '@/lib/github';

type Session = { id: string; label: string; capacity: number };
type Program = { id: string; title: string; sessions: Session[] };
type Submission = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  programId: string;
  sessionId: string;
  headcount: number;
  note?: string;
  ts: string;
};

const PROGRAMS_PATH = process.env.GITHUB_PROGRAMS_PATH!;
const SUBMISSIONS_PATH = process.env.GITHUB_SUBMISSIONS_PATH!;

export async function GET() {
  const { json } = await readJSON<Submission[]>(SUBMISSIONS_PATH);
  return NextResponse.json({ submissions: json || [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, programId, sessionId, headcount, note } = body || {};
    if (!name || !phone || !programId || !sessionId || !headcount) {
      return new NextResponse('invalid payload', { status: 400 });
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // Load programs & submissions
    const { json: programs } = await readJSON<Program[]>(PROGRAMS_PATH);
    const { json: submissions, sha } = await readJSON<Submission[]>(SUBMISSIONS_PATH);
    const subs = submissions || [];

    const prog = programs?.find(p => p.id === programId);
    const sess = prog?.sessions.find(s => s.id === sessionId);
    if (!prog || !sess) return new NextResponse('invalid program/session', { status: 400 });

    // Duplicate check (phone + programId + sessionId)
    const phoneKey = String(phone).replace(/[^0-9]/g, '');
    const dup = subs.find(s => String(s.phone).replace(/[^0-9]/g, '') === phoneKey && s.programId === programId && s.sessionId === sessionId);
    if (dup) return new NextResponse('이미 해당 프로그램/회차에 신청 이력이 있습니다.', { status: 409 });

    // Capacity check
    const taken = subs.filter(s => s.programId === programId && s.sessionId === sessionId).reduce((a, c) => a + Number(c.headcount || 0), 0);
    const remain = (sess.capacity ?? 0) - taken;
    if (remain < Number(headcount || 1)) return new NextResponse(`잔여 좌석(${remain}석)를 초과했습니다.`, { status: 409 });

    const rec: Submission = {
      id: Math.random().toString(36).slice(2, 10),
      name,
      phone,
      email,
      programId,
      sessionId,
      headcount: Number(headcount || 1),
      note,
      ts: now,
    };

    const next = [rec, ...subs];

    // Persist (create file if absent)
    await writeJSON(SUBMISSIONS_PATH, next, `add submission ${rec.id}`, sha);

    return NextResponse.json({ ok: true, submissions: next });
  } catch (e: any) {
    return new NextResponse(e.message || 'server error', { status: 500 });
  }
}
