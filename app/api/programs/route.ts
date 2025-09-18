import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { readJSON, writeJSON } from '@/lib/github';

type Session = { id: string; label: string; capacity: number };
type Program = { id: string; title: string; sessions: Session[] };

const PROGRAMS_PATH = process.env.GITHUB_PROGRAMS_PATH!;

// Default seed
const DEFAULT_PROGRAMS: Program[] = [
  { id: "eco101", title: "숲해설 비밀코스 투어", sessions: [
    { id: "2025-09-27-am", label: "9/27(토) 오전", capacity: 20 },
    { id: "2025-09-27-pm", label: "9/27(토) 오후", capacity: 20 },
  ]},
  { id: "river201", title: "내성천 생태 모니터링", sessions: [
    { id: "2025-10-05-am", label: "10/5(일) 오전", capacity: 15 },
    { id: "2025-10-05-pm", label: "10/5(일) 오후", capacity: 15 },
  ]},
  { id: "kids301", title: "어린이 물사랑 캠프", sessions: [
    { id: "2025-10-12-day", label: "10/12(일) 종일", capacity: 30 },
  ]},
];

export async function GET() {
  const { json } = await readJSON<Program[]>(PROGRAMS_PATH);
  if (!json) {
    // seed if empty
    await writeJSON(PROGRAMS_PATH, DEFAULT_PROGRAMS, 'seed programs');
    return NextResponse.json({ programs: DEFAULT_PROGRAMS });
  }
  return NextResponse.json({ programs: json });
}
