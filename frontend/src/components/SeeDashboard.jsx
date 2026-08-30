import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';

export default function SeeDashboard({ currentPlanId, onNextPlanCreated }) {
  const [stats, setStats] = useState(null);
  const [adjustment, setAdjustment] = useState('');
  const [nextPlanTitle, setNextPlanTitle] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchApi(`/plans/${currentPlanId}/see`);
        setStats(data);
      } catch (e) {
        console.error(e);
      }
    };
    if (currentPlanId) loadStats();
  }, [currentPlanId]);

  const handleCreateNextPlan = async (e) => {
    e.preventDefault();
    if (!nextPlanTitle || !adjustment) return alert('제목과 조정 내용을 입력하세요.');

    try {
      await fetchApi('/plans', {
        method: 'POST',
        body: JSON.stringify({
          title: nextPlanTitle,
          success_criteria: `[회고 반영] ${adjustment}`,
          period: '7일',
          expected_time: stats?.expected_time || 0,
        }),
      });
      alert('조정 내용이 반영된 새 Plan이 생성되었습니다!');
      setAdjustment('');
      setNextPlanTitle('');
      if (onNextPlanCreated) onNextPlanCreated();
    } catch (e) {
      alert('생성 실패');
    }
  };

  if (!stats) return <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>회고 데이터를 불러오는 중...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>📊 See: 실행 결과 회고 분석</h3>
        <span style={{ fontSize: '0.8rem', background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>
          Plan ID: {stats.plan_id.slice(0, 8)}...
        </span>
      </div>

      {/* 통계 지표 카드 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>전체 할 일</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f172a' }}>{stats.total_todos}건</div>
        </div>
        <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '10px', border: '1px solid #fecaca', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#ef4444', marginBottom: '4px' }}>지연 건수</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#dc2626' }}>{stats.delayed_todos}건</div>
        </div>
        <div style={{ background: '#fffbeb', padding: '14px', borderRadius: '10px', border: '1px solid #fde68a', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#d97706', marginBottom: '4px' }}>막힘 건수</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#b45309' }}>{stats.blocked_todos}건</div>
        </div>
        <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '10px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: '#16a34a', marginBottom: '4px' }}>시간 오차</div>
          <div style={{ fontSize: '1.2rem', fontWeight: '700', color: stats.diff_time > 0 ? '#dc2626' : '#16a34a' }}>
            {stats.diff_time > 0 ? `+${stats.diff_time}` : stats.diff_time}분
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#334155' }}>🔄 회고 내용을 반영해 다음 Plan 수립하기</h4>
        <form onSubmit={handleCreateNextPlan} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input 
            value={nextPlanTitle} 
            onChange={e => setNextPlanTitle(e.target.value)} 
            placeholder="다음 계획 제목 (예: 정보처리기사 실기 2주차)" 
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
          />
          <textarea 
            value={adjustment} 
            onChange={e => setAdjustment(e.target.value)} 
            placeholder="이번 회고를 통해 조정할 내용 (예: 예상보다 암기 시간이 오래 걸려 다음엔 배정 시간을 늘림)" 
            rows="3"
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
          />
          <button type="submit" style={{ padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem' }}>
            조정 내용 반영하여 새 Plan 만들기 ✨
          </button>
        </form>
      </div>
    </div>
  );
}