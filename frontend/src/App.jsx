import React, { useState } from 'react';
import PlanToDoManager from './components/PlanToDoManager';
import BackupManager from './components/BackupManager';
import SeeDashboard from './components/SeeDashboard'; // 이전 답변에서 만든 컴포넌트

export default function App() {
  const [scope, setScope] = useState(localStorage.getItem('ab_scope') || 'A');
  const [currentPlanId, setCurrentPlanId] = useState(null);

  const handleScopeChange = (newScope) => {
    localStorage.setItem('ab_scope', newScope);
    setScope(newScope);
    setCurrentPlanId(null); // 범위가 바뀌면 현재 선택된 계획 초기화
    alert(`${newScope} 인물로 검토 범위를 전환했습니다.`);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        <h1>자격증 합격 플래너</h1>
        
        {/* A/B 격리 전환 버튼 */}
        <div>
          <span style={{ marginRight: '10px' }}>현재 사용자: <strong>{scope}</strong></span>
          <button onClick={() => handleScopeChange('A')} disabled={scope === 'A'}>A로 보기</button>
          <button onClick={() => handleScopeChange('B')} disabled={scope === 'B'}>B로 보기</button>
        </div>
      </header>

      <main style={{ marginTop: '20px' }}>
        <BackupManager scope={scope} />
        <hr style={{ margin: '20px 0' }} />
        
        <PlanToDoManager 
          scope={scope} 
          onSelectPlan={(id) => setCurrentPlanId(id)} 
        />
        <hr style={{ margin: '20px 0' }} />

        {currentPlanId && (
          <SeeDashboard currentPlanId={currentPlanId} />
        )}
      </main>
    </div>
  );
}