import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function SeeDashboard({ currentPlanId, onNextPlanCreated }) {
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (currentPlanId) generateReport(currentPlanId);
  }, [currentPlanId]);

  const generateReport = async (planId) => {
    const { data: todos } = await supabase.from('todos').select('*').eq('plan_id', planId);
    const { data: dos } = await supabase.from('dos').select('*, todos!inner(*)').eq('todos.plan_id', planId);

    if (!todos) return;

    const total_todos = todos.length;
    const completed_todos = todos.filter(t => t.status === 'completed').length;
    const delayed_todos = todos.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < new Date()).length;
    
    const dosList = dos || [];
    const blocked_todos = dosList.filter(d => d.block_reason && d.block_reason.trim() !== '').length;
    const expected_time = todos.reduce((acc, t) => acc + (t.expected_time || 0), 0);
    const actual_time = dosList.reduce((acc, d) => acc + (d.actual_time || 0), 0);
    const diff_time = actual_time - expected_time;

    setReport({ total_todos, completed_todos, delayed_todos, blocked_todos, expected_time, actual_time, diff_time });
  };

  if (!report) return <div>회고 데이터를 불러오는 중...</div>;

  return (
    <div>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>See: 회고 및 분석 리포트</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
        <li style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>총 ToDo 수: <strong>{report.total_todos}</strong>건</li>
        <li style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>완료된 ToDo: <strong>{report.completed_todos}</strong>건</li>
        <li style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>지연된 ToDo: <strong style={{ color: '#dc2626' }}>{report.delayed_todos}</strong>건</li>
        <li style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>블로커 발생 건수: <strong style={{ color: '#d97706' }}>{report.blocked_todos}</strong>건</li>
        <li style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>예상 소요 시간: <strong>{report.expected_time}</strong>분</li>
        <li style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>실제 소요 시간: <strong>{report.actual_time}</strong>분</li>
        <li style={{ padding: '8px 0' }}>시간 차이: <strong style={{ color: report.diff_time > 0 ? '#dc2626' : '#10b981' }}>{report.diff_time > 0 ? `+${report.diff_time}` : report.diff_time}</strong>분</li>
      </ul>
      <button onClick={onNextPlanCreated} style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '6px' }}>다음 Plan 작성하기</button>
    </div>
  );
}