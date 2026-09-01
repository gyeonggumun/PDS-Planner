import React, { useRef } from 'react';
import { supabase } from '../supabase';

export default function BackupManager({ scope }) {
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    const { data: plans } = await supabase.from('plans').select('*');
    const { data: todos } = await supabase.from('todos').select('*');
    const { data: dos } = await supabase.from('dos').select('*');

    const backupData = { plans, todos, dos, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_scope_${scope}.json`;
    a.click();
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(`[보안 경고] 인물 ${scope}의 모든 데이터가 영구 삭제됩니다. 진행하시겠습니까?`)) return;
    await supabase.from('plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    window.location.reload();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user.id;

        const plans = data.plans?.map(p => ({ ...p, owner: userId })) || [];
        const todos = data.todos?.map(t => ({ ...t, owner: userId })) || [];
        const dos = data.dos?.map(d => ({ ...d, owner: userId })) || [];

        if (plans.length > 0) await supabase.from('plans').upsert(plans);
        if (todos.length > 0) await supabase.from('todos').upsert(todos);
        if (dos.length > 0) await supabase.from('dos').upsert(dos);

        alert('데이터 복원이 완료되었습니다.');
        window.location.reload();
      } catch (err) {
        alert('가져오기 실패: 파일 스키마가 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSeedData = async () => {
    try {
      const planId = crypto.randomUUID();
      await supabase.from('plans').insert([{ id: planId, title: '샘플 계획 (정보처리기사)', period: '2026-09-01 ~ 2026-09-07', success_criteria: '샘플 테스트', expected_time: 120 }]);
      alert('테스트용 샘플 데이터가 성공적으로 생성되었습니다!');
      window.location.reload();
    } catch (e) {
      alert('샘플 데이터 생성 실패');
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
      <div>
        <h3 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>System Storage & Backup</h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Current Isolated Workspace: <strong style={{ color: '#0f172a' }}>{scope}</strong></p>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={handleSeedData} style={{ padding: '8px 12px', backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>⚡ 샘플 데이터 채우기</button>
        <button onClick={handleExport} style={{ padding: '8px 12px', backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}>Export JSON</button>
        <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileInputRef.current.click()} style={{ padding: '8px 12px', backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}>Import JSON</button>
        <button onClick={handleDeleteAll} style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}>Purge Data</button>
      </div>
    </div>
  );
}