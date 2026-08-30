import React, { useRef } from 'react';
import { fetchApi } from '../api';

export default function BackupManager({ scope }) {
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    try {
      const blob = await fetchApi('/backup/export', { isDownload: true });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_scope_${scope}.json`;
      a.click();
    } catch (e) { console.error(e); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(`[경고] 정말로 ${scope} 인물의 모든 데이터를 삭제하시겠습니까?`)) return;
    await fetchApi('/backup/all', { method: 'DELETE' });
    window.location.reload();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetchApi('/backup/import', { method: 'POST', body: formData });
      alert('복원이 성공적으로 완료되었습니다!');
      window.location.reload();
    } catch (err) {
      alert('가져오기 실패: 파일 형식이 잘못되었거나 규격에 맞지 않습니다.');
    } finally {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
      <div>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#1e293b' }}>💾 데이터 백업 및 복구</h3>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>현재 격리 범위: <strong>인물 {scope}</strong></p>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={handleExport} style={{ padding: '8px 14px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
          📤 내보내기
        </button>
        
        <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileInputRef.current.click()} style={{ padding: '8px 14px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
          📥 가져오기
        </button>
        
        <button onClick={handleDeleteAll} style={{ padding: '8px 14px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>
          🗑️ 전체 삭제
        </button>
      </div>
    </div>
  );
}