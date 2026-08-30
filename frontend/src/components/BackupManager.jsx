import React, { useRef } from 'react';
import { fetchApi } from '../api';

export default function BackupManager({ scope }) {
  const fileInputRef = useRef(null);

  // 내보내기[cite: 1]
  const handleExport = async () => {
    try {
      const blob = await fetchApi('/backup/export', { isDownload: true });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_scope_${scope}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  // 전체 삭제[cite: 1]
  const handleDeleteAll = async () => {
    if (!window.confirm(`${scope} 인물의 모든 데이터를 정말 삭제하시겠습니까?`)) return;
    try {
      await fetchApi('/backup/all', { method: 'DELETE' });
      alert('전체 삭제되었습니다. (새로고침하여 확인하세요)');
      window.location.reload();
    } catch (e) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 가져오기 (복원)[cite: 1]
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetchApi('/backup/import', {
        method: 'POST',
        body: formData, // FormData 전송 시 api.js에서 Content-Type을 자동 제거함
      });
      alert('복원 완료! (새로고침하여 확인하세요)');
      window.location.reload();
    } catch (error) {
      alert('가져오기 실패: 잘못된 파일이거나 문법이 깨졌습니다.'); // T06-C41 거부 처리[cite: 1]
    } finally {
      fileInputRef.current.value = ''; // input 초기화
    }
  };

  return (
    <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '5px' }}>
      <h3>💾 백업 및 복구 (현재 범위: {scope})</h3>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button onClick={handleExport}>내보내기 (Export)</button>
        
        {/* 숨겨진 파일 인풋을 버튼으로 트리거 */}
        <input 
          type="file" 
          accept=".json" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImport} 
        />
        <button onClick={() => fileInputRef.current.click()}>가져오기 (Import)</button>
        
        <button onClick={handleDeleteAll} style={{ backgroundColor: 'red', color: 'white', border: 'none' }}>전체 삭제</button>
      </div>
    </div>
  );
}