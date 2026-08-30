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
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '30px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1e293b', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* 헤더 및 A/B 전환 탭 */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '20px 24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>🎯 PDS 합격 플래너</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>계획·수행·회고로 이어지는 스마트 학습 관리</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', paddingLeft: '8px' }}>검토 범위:</span>
          <button 
            onClick={() => handleScopeChange('A')} 
            style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: scope === 'A' ? '#4f46e5' : 'transparent', color: scope === 'A' ? '#fff' : '#64748b', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            인물 A
          </button>
          <button 
            onClick={() => handleScopeChange('B')} 
            style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: scope === 'B' ? '#4f46e5' : 'transparent', color: scope === 'B' ? '#fff' : '#64748b', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            인물 B
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <BackupManager scope={scope} />
        
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <PlanToDoManager 
            scope={scope} 
            onSelectPlan={(id) => setCurrentPlanId(id)} 
          />
        </div>

        {currentPlanId && (
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '2px solid #e0e7ff' }}>
            <SeeDashboard currentPlanId={currentPlanId} onNextPlanCreated={() => setCurrentPlanId(null)} />
          </div>
        )}
      </main>
    </div>
  );
}