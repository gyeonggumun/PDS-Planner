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
      a.download = `backup_${scope}.json`;
      a.click();
    } catch (e) { console.error(e); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('전체 삭제하시겠습니까?')) return;
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
      alert('복원 완료!');
      window.location.reload();
    } catch (err) {
      alert('가져오기 실패: 파일 형식이 잘못되었습니다.');
    } finally {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ padding: '15px', background: '#f0f4f8' }}>
      <h3>💾 시스템 관리 (현재: {scope})</h3>
      <button onClick={handleExport}>내보내기</button>
      <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
      <button onClick={() => fileInputRef.current.click()}>가져오기</button>
      <button onClick={handleDeleteAll} style={{ color: 'red' }}>전체 삭제</button>
    </div>
  );
}