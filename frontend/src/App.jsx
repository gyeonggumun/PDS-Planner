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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      color: '#0f172a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 상단 네비게이션 바 */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.9rem'
            }}>
              P
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#0f172a', letterSpacing: '-0.01em' }}>PDS Enterprise Planner</h1>
            </div>
          </div>

          {/* 프로덕션 수준의 세그먼트 인물 전환 컨트롤 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              backgroundColor: '#f1f5f9',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <button 
                onClick={() => handleScopeChange('A')} 
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: scope === 'A' ? '#ffffff' : 'transparent',
                  color: scope === 'A' ? '#0f172a' : '#64748b',
                  fontWeight: scope === 'A' ? '600' : '500',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: scope === 'A' ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Workspace A
              </button>
              <button 
                onClick={() => handleScopeChange('B')} 
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: scope === 'B' ? '#ffffff' : 'transparent',
                  color: scope === 'B' ? '#0f172a' : '#64748b',
                  fontWeight: scope === 'B' ? '600' : '500',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: scope === 'B' ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Workspace B
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨테이너 (반응형 그리드 및 간격 최적화) */}
      <main style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '32px 24px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxSizing: 'border-box'
      }}>
        <BackupManager scope={scope} />
        
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
        }}>
          <PlanToDoManager 
            scope={scope} 
            onSelectPlan={(id) => setCurrentPlanId(id)} 
          />
        </div>

        {currentPlanId && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #cbd5e1',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}>
            <SeeDashboard currentPlanId={currentPlanId} onNextPlanCreated={() => setCurrentPlanId(null)} />
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer style={{
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        padding: '20px 24px',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.8rem'
      }}>
        PDS System Core v2.4 • Server-Enforced Workspace Isolation Active
      </footer>
    </div>
  );
}