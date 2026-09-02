import React, { useRef } from 'react';
import { supabase } from '../supabase';

export default function BackupManager({ scope }) {
  const fileInputRef = useRef(null);

  // 1. Export JSON: 내 데이터만 Supabase에서 가져와 JSON으로 다운로드
  const handleExport = async () => {
    try {
      const { data: plans } = await supabase.from('plans').select('*');
      const { data: todos } = await supabase.from('todos').select('*');
      const { data: dos } = await supabase.from('dos').select('*');

      const backupData = { plans: plans || [], todos: todos || [], dos: dos || [] };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_scope_${scope}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert('내보내기 중 오류가 발생했습니다.');
    }
  };

  // 2. Purge Data: RLS 정책을 통해 본인 소유의 데이터만 안전하게 영구 삭제
  const handleDeleteAll = async () => {
    if (!window.confirm(`[보안 경고] 인물 ${scope}의 모든 데이터가 영구 삭제됩니다. 진행하시겠습니까?`)) return;
    try {
      await supabase.from('plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      alert('데이터가 성공적으로 삭제되었습니다.');
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 3. Import JSON: 백업 파일을 읽어 현재 로그인한 유저의 소유권(owner)으로 DB에 덮어쓰기
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        if (!userId) throw new Error('인증 오류');

        const plans = data.plans?.map(p => ({ ...p, owner: userId })) || [];
        const todos = data.todos?.map(t => ({ ...t, owner: userId })) || [];
        const dos = data.dos?.map(d => ({ ...d, owner: userId })) || [];

        if (plans.length > 0) await supabase.from('plans').upsert(plans);
        if (todos.length > 0) await supabase.from('todos').upsert(todos);
        if (dos.length > 0) await supabase.from('dos').upsert(dos);

        alert('데이터 복원이 완료되었습니다.');
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert('가져오기 실패: 파일 스키마가 올바르지 않거나 처리 중 오류가 발생했습니다.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ backgroundColor: '#ffffff', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
      <div>
        <h3 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: '600', color: '#0f172a' }}>System Storage & Backup</h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Current Isolated Workspace: <strong style={{ color: '#0f172a' }}>{scope}</strong></p>
      </div>
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={handleExport} style={{ padding: '8px 12px', backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}>
          Export JSON
        </button>
        
        <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileInputRef.current.click()} style={{ padding: '8px 12px', backgroundColor: '#ffffff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}>
          Import JSON
        </button>
        
        <button onClick={handleDeleteAll} style={{ padding: '8px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer' }}>
          Purge Data
        </button>
      </div>
    </div>
  );
}