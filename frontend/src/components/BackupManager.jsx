import React from 'react';
import { supabase } from '../supabase';

export default function BackupManager({ session }) {
  const handleExport = async () => {
    if (!session) return;
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

  const handlePurge = async () => {
    if (confirm('정말로 모든 데이터를 삭제하시겠습니까?')) {
      await supabase.from('plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      alert('모든 데이터가 삭제되었습니다.');
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <button onClick={handleExport} style={{ padding: '8px 16px', backgroundColor: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: '6px' }}>데이터 백업 (Export)</button>
      <button onClick={handlePurge} style={{ padding: '8px 16px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px' }}>전체 삭제 (Purge)</button>
    </div>
  );
}