import React, { useRef } from 'react';
import { fetchApi } from '../api';

export default function BackupManager({ scope }) {
  const fileInputRef = useRef(null);

  // 1. 내보내기 로직 (JSON 다운로드)[cite: 1]
  const handleExport = async () => {
    try {
      const blob = await fetchApi('/backup/export', { isDownload: true });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_scope_${scope}.json`; // 현재 A/B 범위에 맞는 이름 부여
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('내보내기 실패:', e);
    }
  };

  // 2. 전체 삭제 로직[cite: 1]
  const handleDeleteAll = async () => {
    if (!window.confirm(`정말로 ${scope} 인물의 모든 데이터를 삭제하시겠습니까?`)) return;
    try {
      await fetchApi('/backup/all', { method: 'DELETE' });
      alert('모든 데이터가 삭제되었습니다. 새로고침을 진행합니다.');
      window.location.reload();
    } catch (e) {
      alert('전체 삭제 중 오류가 발생했습니다.');
    }
  };

  // 3. 가져오기 (복원) 로직 - 폼 데이터 활용[cite: 1]
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetchApi('/backup/import', {
        method: 'POST',
        body: formData, // FormData 사용 시 fetchApi 내부에서 Content-Type을 알아서 제거하여 브라우저가 자동 설정하도록 유도
      });
      alert('복원 작업이 완료되었습니다! 데이터를 다시 불러옵니다.');
      window.location.reload();
    } catch (error) {
      alert('가져오기 실패: 문법이 깨졌거나 잘못된 형식의 파일입니다.'); // 잘못된 파일 거부 조건 처리[cite: 1]
    } finally {
      fileInputRef.current.value = ''; // 다음 업로드를 위해 input 초기화
    }
  };

  return (
    <div style={{ backgroundColor: '#f0f4f8', padding: '20px', borderRadius: '8px', border: '1px solid #dce4ec' }}>
      <h3 style={{ marginTop: 0 }}>💾 시스템 관리 (현재 격리 범위: {scope})</h3>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <button onClick={handleExport} style={{ padding: '8px 12px', cursor: 'pointer' }}>내보내기 (Export)</button>
        
        {/* 파일 선택창을 숨기고 버튼 클릭으로 트리거 */}
        <input 
          type="file" 
          accept=".json" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImport} 
        />
        <button onClick={() => fileInputRef.current.click()} style={{ padding: '8px 12px', cursor: 'pointer' }}>
          가져오기 (Import)
        </button>
        
        <button 
          onClick={handleDeleteAll} 
          style={{ padding: '8px 12px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          데이터 전체 삭제
        </button>
      </div>
    </div>
  );
}