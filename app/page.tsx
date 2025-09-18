'use client';

import { useEffect, useMemo, useState } from 'react';

type Session = { id: string; label: string; capacity: number };
type Program = { id: string; title: string; sessions: Session[] };
type Submission = {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  programId: string;
  sessionId: string;
  headcount: number;
  note?: string;
  ts?: string;
};

function formatPhone(v: string) {
  const d = (v || '').replace(/[^0-9]/g, '').slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0,3)}-${d.slice(3)}`;
  return `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
}

export default function Page() {
  const [admin, setAdmin] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<Submission>({
    name: '',
    phone: '',
    email: '',
    programId: '',
    sessionId: '',
    headcount: 1,
    note: '',
  });

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [ps, ss] = await Promise.all([
        fetch('/api/programs').then(r => r.json()),
        fetch('/api/submissions').then(r => r.json()),
      ]);
      setPrograms(ps.programs || []);
      setSubs(ss.submissions || []);
      const p0 = (ps.programs?.[0]?.id) || '';
      const s0 = (ps.programs?.[0]?.sessions?.[0]?.id) || '';
      setForm(f => ({
        ...f,
        programId: p0,
        sessionId: s0,
      }));
      setLoading(false);
    };
    fetchAll();
  }, []);

  const remaining = useMemo(() => {
    const p = programs.find(p => p.id === form.programId);
    const s = p?.sessions.find(s => s.id === form.sessionId);
    const taken = subs
      .filter(x => x.programId === form.programId && x.sessionId === form.sessionId)
      .reduce((acc, cur) => acc + Number(cur.headcount || 0), 0);
    return (s?.capacity ?? 0) - taken;
  }, [programs, subs, form.programId, form.sessionId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return alert('이름을 입력하세요.');
    if (!form.phone.trim()) return alert('연락처를 입력하세요.');
    if (!form.programId || !form.sessionId) return alert('프로그램/회차를 선택하세요.');
    if (form.headcount < 1) return alert('인원을 확인하세요.');

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: formatPhone(form.phone),
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || '신청 실패');
      }
      const data = await res.json();
      setSubs(data.submissions || []);
      alert('신청이 완료되었습니다!');
      setForm(f => ({ ...f, name: '', phone: '', email: '', headcount: 1, note: '' }));
    } catch (e: any) {
      alert(e.message || '오류가 발생했습니다.');
    }
  };

  const [pwd, setPwd] = useState('');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q.trim()) return subs;
    const t = q.toLowerCase();
    return subs.filter(s =>
      [s.name, s.phone, s.email, s.note].some(v => String(v || '').toLowerCase().includes(t)),
    );
  }, [q, subs]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#111827' }}>
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: '#16a34a', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700 }}>E</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1 }}>프로그램 신청</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: -2 }}>Vercel + GitHub</div>
            </div>
          </div>
          <div>
            {!admin ? (
              <button onClick={() => {
                const ok = prompt('관리자 비밀번호: (기본 admin123)');
                if (ok === 'admin123' || ok === pwd) setAdmin(true);
              }} style={{ fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white' }}>
                관리자
              </button>
            ) : (
              <button onClick={() => setAdmin(false)} style={{ fontSize: 13, padding: '6px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white' }}>
                관리자 나가기
              </button>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        {loading ? (
          <div style={{ fontSize: 14, color: '#6b7280' }}>불러오는 중…</div>
        ) : !admin ? (
          <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr', alignItems: 'start' }}>
            <section style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04)', padding: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>신청서</h2>
              <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
                  <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                    <span>이름 *</span>
                    <input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="홍길동"
                      style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}/>
                  </label>
                  <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                    <span>연락처 *</span>
                    <input value={form.phone} onChange={e=>setForm({...form, phone: formatPhone(e.target.value)})} placeholder="010-1234-5678"
                      style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}/>
                  </label>
                  <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                    <span>이메일</span>
                    <input value={form.email || ''} onChange={e=>setForm({...form, email: e.target.value})} placeholder="name@example.com"
                      style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}/>
                  </label>
                  <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                    <span>인원 *</span>
                    <input type="number" min={1} max={99} value={form.headcount}
                      onChange={e=>setForm({...form, headcount: Number(e.target.value || 1)})}
                      style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}/>
                  </label>
                </div>

                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
                  <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                    <span>프로그램 *</span>
                    <select value={form.programId} onChange={e=>setForm({...form, programId: e.target.value})}
                      style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </label>
                  <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                    <span>회차 *</span>
                    <select value={form.sessionId} onChange={e=>setForm({...form, sessionId: e.target.value})}
                      style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}>
                      {programs.find(p=>p.id===form.programId)?.sessions.map(s =>
                        <option key={s.id} value={s.id}>{s.label}</option>
                      )}
                    </select>
                  </label>
                </div>

                <div style={{ fontSize: 14, color: '#374151', marginTop: -4 }}>
                  잔여 좌석: <span style={{ fontWeight: 600, color: remaining <= 0 ? '#dc2626' : '#166534' }}>{remaining}</span> 석
                </div>

                <label style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                  <span>메모</span>
                  <textarea value={form.note || ''} onChange={e=>setForm({...form, note: e.target.value})}
                    placeholder="알레르기, 동반자 정보 등"
                    style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', minHeight: 80 }}/>
                </label>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" style={{ background: '#16a34a', color: 'white', padding: '8px 12px', borderRadius: 10, fontWeight: 600 }}>신청하기</button>
                  <button type="button" onClick={()=>window.location.reload()} style={{ border: '1px solid #e5e7eb', padding: '8px 12px', borderRadius: 10 }}>초기화</button>
                </div>
              </form>
            </section>

            <section style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04)', padding: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>모집 현황</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {programs.map(p => (
                  <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>{p.title}</div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {p.sessions.map(s => {
                        const taken = subs
                          .filter(x => x.programId === p.id && x.sessionId === s.id)
                          .reduce((a, c) => a + Number(c.headcount || 0), 0);
                        const rem = s.capacity - taken;
                        return (
                          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                            <div>{s.label}</div>
                            <div style={{ fontVariantNumeric: 'tabular-nums' }}>정원 {s.capacity} · 신청 {taken} · <span style={{ color: rem <= 0 ? '#dc2626' : '#166534', fontWeight: 600 }}>잔여 {rem}</span></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <section style={{ display: 'grid', gap: 24 }}>
            <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04)', padding: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>관리자 · 신청 목록</h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <input placeholder="이름/연락처/이메일/메모 검색" value={q} onChange={e=>setQ(e.target.value)}
                  style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px' }}/>
                <button onClick={()=>setQ('')} style={{ border: '1px solid #e5e7eb', padding: '8px 12px', borderRadius: 10 }}>지우기</button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 14 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                      <th style={{ padding: '8px 10px' }}>신청일시</th>
                      <th style={{ padding: '8px 10px' }}>이름</th>
                      <th style={{ padding: '8px 10px' }}>연락처</th>
                      <th style={{ padding: '8px 10px' }}>이메일</th>
                      <th style={{ padding: '8px 10px' }}>프로그램</th>
                      <th style={{ padding: '8px 10px' }}>회차</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>인원</th>
                      <th style={{ padding: '8px 10px' }}>메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px 10px' }}>{s.ts || ''}</td>
                        <td style={{ padding: '8px 10px' }}>{s.name}</td>
                        <td style={{ padding: '8px 10px' }}>{s.phone}</td>
                        <td style={{ padding: '8px 10px' }}>{s.email}</td>
                        <td style={{ padding: '8px 10px' }}>{s.programId}</td>
                        <td style={{ padding: '8px 10px' }}>{s.sessionId}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right' }}>{s.headcount}</td>
                        <td style={{ padding: '8px 10px' }}>{s.note}</td>
                      </tr>
                    ))}
                    {!filtered.length && <tr><td colSpan={8} style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>데이터가 없습니다.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', padding: 32 }}>© {new Date().getFullYear()} Ecotourism Demo. All rights reserved.</footer>
    </div>
  );
}
