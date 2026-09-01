import React, { useRef } from 'react';
import { supabase } from '../supabase';

export default function BackupManager({ session }) {
  const fileInputRef = useRef(null);

  // 1. JSON 내보내기 (Export)
  const handleExport = async () => {
    if (!session) return;
    
    // 현재 접속한 유저의 데이터만 안전하게 가져옵니다.
    const { data: plans } = await supabase.from('plans').select('*');
    const { data: todos } = await supabase.from('todos').select('*');
    const { data: dos } = await supabase.from('dos').select('*');

    const backupData = { plans, todos, dos, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pds_backup_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 2. JSON 불러오기 (Import)
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file || !session) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.plans || !data.todos || !data.dos) {
          alert('올바른 백업 파일 형식이 아닙니다.');
          return;
        }

        const userId = session.user.id;
        
        // 중요: 남의 백업을 가져오더라도 '내 소유(owner)'로 변경하여 덮어씌웁니다.
        const plans = data.plans.map(p => ({ ...p, owner: userId }));
        const todos = data.todos.map(t => ({ ...t, owner: userId }));
        const dos = data.dos.map(d => ({ ...d, owner: userId }));

        // DB에 삽입 (순서 중요: Plan -> Todo -> Dos)
        if (plans.length > 0) await supabase.from('plans').upsert(plans);
        if (todos.length > 0) await supabase.from('todos').upsert(todos);
        if (dos.length > 0) await supabase.from('dos').upsert(dos);

        alert('데이터 불러오기가 완료되었습니다!');
        window.location.reload(); // 화면 새로고침하여 데이터 반영
      } catch (err) {
        console.error(err);
        alert('파일을 읽는 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // 같은 파일을 다시 열 수 있도록 초기화
  };

  // 3. 샘플 데이터 생성
  const handleLoadSample = async () => {
    if (!session) return;
    const userId = session.user.id;
    
    const planId = crypto.randomUUID();
    const todoId1 = crypto.randomUUID();
    const todoId2 = crypto.randomUUID();

    // 샘플 목표(Plan)
    await supabase.from('plans').insert([{
      id: planId,
      owner: userId,
      title: '정보처리기사 실기 합격하기',
      period: '2026-09',
      expected_time: 180
    }]);

    // 샘플 할 일(Todo)
    await supabase.from('todos').insert([
      { id: todoId1, plan_id: planId, owner: userId, content: '프로그래밍 언어 활용 기출 풀이', status: 'completed', expected_time: 90, deadline: '2026-09-10' },
      { id: todoId2, plan_id: planId, owner: userId, content: '네트워크 인프라 설정 복습', status: 'pending', expected_time: 90, deadline: '2026-09-15' }
    ]);

    // 샘플 실행 기록(Dos)
    await supabase.from('dos').insert([
      { id: crypto.randomUUID(), todo_id: todoId1, owner: userId, actual_time: 100, block_reason: '개념 이해 지연' }
    ]);

    alert('샘플 데이터가 추가되었습니다!');
    window.location.reload();
  };

  // 4. 데이터 초기화 (Purge)
  const handlePurge = async () => {
    if (confirm('정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      // 본인 소유의 데이터만 삭제됨 (RLS 정책 적용)
      await supabase.from('plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      alert('모든 데이터가 삭제되었습니다.');
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', flexWrap: 'wrap' }}>
      
      <button onClick={handleLoadSample} style={{ padding: '8px 16px', backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
        샘플 데이터 생성
      </button>
      
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} style={{ display: 'none' }} />
      <button onClick={() => fileInputRef.current.click()} style={{ padding: '8px 16px', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
        JSON 불러오기
      </button>
      
      <button onClick={handleExport} style={{ padding: '8px 16px', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
        JSON 내보내기
      </button>
      
      <button onClick={handlePurge} style={{ padding: '8px 16px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
        전체 삭제 (Purge)
      </button>
      
    </div>
  );
}