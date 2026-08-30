import React, { useState } from 'react';
import PlanToDoManager from './components/PlanToDoManager';
import BackupManager from './components/BackupManager';
import SeeDashboard from './components/SeeDashboard';

export default function App() {
  const [scope, setScope] = useState(localStorage.getItem('ab_scope') || 'A');
  const [currentPlanId, setCurrentPlanId] = useState(null);

  const handleScopeChange = (newScope) => {
    localStorage.setItem('ab_scope', newScope);
    setScope(newScope);
    setCurrentPlanId(null);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <header>
        <h1>자격증 합격 플래너</h1>
        <div>
          <span>현재 범위: <strong>{scope}</strong></span>
          <button onClick={() => handleScopeChange('A')}>A로 보기</button>
          <button onClick={() => handleScopeChange('B')}>B로 보기</button>
        </div>
      </header>
      <main>
        <BackupManager scope={scope} />
        <hr />
        <PlanToDoManager scope={scope} onSelectPlan={setCurrentPlanId} />
        <hr />
        {currentPlanId && <SeeDashboard currentPlanId={currentPlanId} onNextPlanCreated={() => setCurrentPlanId(null)} />}
      </main>
    </div>
  );
}