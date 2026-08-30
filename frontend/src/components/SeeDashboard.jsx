import React, { useState, useEffect } from 'react';

export default function SeeDashboard({ currentPlanId, onNextPlanCreated }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjustment, setAdjustment] = useState('');
  const [nextPlanTitle, setNextPlanTitle] = useState('');

  // 1. See 집계 데이터 불러오기
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const scope = localStorage.getItem('ab_scope') || 'A';
        const response = await fetch(`http://localhost:3000/api/plans/${currentPlanId}/see`, {
          headers: {
            'Content-Type': 'application/json',
            'X-Scope-ID': scope, // A/B 격리 강제 헤더
          },
        });

        if (response.status === 403 || response.status === 404) {
          alert('접근이 거부되었습니다. (반대 범위의 데이터)');
          return;
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('집계 데이터를 불러오는 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentPlanId) fetchStats();
  }, [currentPlanId]);

  // 2. 조정 내용을 반영한 다음 Plan 생성 로직 (T06-C33 충족)
  const handleCreateNextPlan = async (e) => {
    e.preventDefault();
    if (!nextPlanTitle || !adjustment) {
      alert('다음 계획 제목과 조정 내용을 모두 입력해주세요.');
      return;
    }

    try {
      const scope = localStorage.getItem('ab_scope') || 'A';
      const response = await fetch('http://localhost:3000/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Scope-ID': scope,
        },
        body: JSON.stringify({
          title: nextPlanTitle,
          // 이전 See 단계에서 얻은 조정 결과를 다음 계획의 성공 기준이나 메모로 넘김
          success_criteria: `[이전 회고 반영] ${adjustment}`,
          period: '7일', // 예시값
          expected_time: stats.expected_time,
        }),
      });

      if (response.ok) {
        alert('조정 내용이 반영된 다음 Plan이 생성되었습니다!');
        setAdjustment('');
        setNextPlanTitle('');
        if (onNextPlanCreated) onNextPlanCreated();
      }
    } catch (error) {
      console.error('다음 Plan 생성 중 오류:', error);
    }
  };

  if (loading) return <div>집계 데이터를 불러오는 중...</div>;
  if (!stats) return <div>데이터가 없습니다.</div>;

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', maxWidth: '600px' }}>
      <h2>📊 See: 실행 결과 회고 (Plan ID: {stats.plan_id})</h2>
      
      {/* 집계 대시보드 (T06-C28 ~ C32) */}
      <ul style={{ listStyle: 'none', padding: 0, lineHeight: '1.8' }}>
        <li><strong>전체 계획 수:</strong> {stats.total_todos}건</li>
        <li><strong>완료 수:</strong> {stats.completed_todos}건</li>
        <li><strong>지연 수:</strong> <span style={{ color: 'red' }}>{stats.delayed_todos}건</span> (마감일 경과)</li>
        <li><strong>막힘 수:</strong> <span style={{ color: 'orange' }}>{stats.blocked_todos}건</span></li>
        <hr style={{ margin: '15px 0' }} />
        <li><strong>예상 소요 시간:</strong> {stats.expected_time}분</li>
        <li><strong>실제 소요 시간:</strong> {stats.actual_time}분</li>
        <li>
          <strong>오차(실제-예상):</strong>{' '}
          <span style={{ color: stats.diff_time > 0 ? 'red' : 'blue' }}>
            {stats.diff_time > 0 ? `+${stats.diff_time}` : stats.diff_time}분
          </span>
        </li>
      </ul>

      <hr style={{ margin: '20px 0' }} />

      {/* 다음 Plan으로 조정 내용 넘기기 폼 (T06-C33) */}
      <h3>🔄 다음 Plan 계획하기</h3>
      <form onSubmit={handleCreateNextPlan} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="다음 계획 제목 (예: 정보처리기사 2주차)" 
          value={nextPlanTitle}
          onChange={(e) => setNextPlanTitle(e.target.value)}
          style={{ padding: '8px' }}
        />
        <textarea 
          placeholder="데이터를 보고 얻은 결론과 다음 계획 조정 내용을 적어주세요. (예: 예상보다 오답 노트 작성 시간이 30분 더 걸림. 다음엔 배정 시간을 늘리겠음)" 
          value={adjustment}
          onChange={(e) => setAdjustment(e.target.value)}
          rows="3"
          style={{ padding: '8px' }}
        />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          조정 내용 반영하여 새 Plan 만들기
        </button>
      </form>
    </div>
  );
}