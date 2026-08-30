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

  if (!stats) return <div>데이터 로딩 중...</div>;

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
      <h2>📊 See: 실행 결과 회고</h2>
      <ul>
        <li><strong>전체 할 일:</strong> {stats.total_todos}건</li>
        <li><strong>지연 수:</strong> <span style={{ color: 'red' }}>{stats.delayed_todos}건</span></li>
        <li><strong>막힘 수:</strong> <span style={{ color: 'orange' }}>{stats.blocked_todos}건</span></li>
        <li><strong>예상 시간:</strong> {stats.expected_time}분 / <strong>실제 시간:</strong> {stats.actual_time}분</li>
        <li><strong>시간 오차:</strong> {stats.diff_time}분</li>
      </ul>
      <hr />
      <h3>🔄 다음 Plan에 반영하기</h3>
      <form onSubmit={handleCreateNextPlan} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input value={nextPlanTitle} onChange={e => setNextPlanTitle(e.target.value)} placeholder="다음 계획 제목" />
        <textarea value={adjustment} onChange={e => setAdjustment(e.target.value)} placeholder="회고를 통한 다음 계획 조정 내용 작성" />
        <button type="submit">반영하여 새 Plan 만들기</button>
      </form>
    </div>
  );
}