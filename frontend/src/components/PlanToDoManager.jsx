import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { fetchApi } from '../api';

export default function PlanToDoManager({ scope, onSelectPlan }) {
  const [plans, setPlans] = useState([]);
  const [todos, setTodos] = useState([]);
  
  // 새 Plan 폼 상태 (정보처리기사 실기 준비 기본값 세팅)
  const [planForm, setPlanForm] = useState({ title: '정보처리기사 실기 1주차', period: '7일', expected_time: 1200 });
  
  // 필터 및 정렬 상태 관리
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, completed
  const [sortKey, setSortKey] = useState('deadline'); // deadline, priority

  // 1. 데이터 로드 (A/B scope가 바뀔 때마다 다시 가져옴)[cite: 1]
  useEffect(() => {
    loadPlansAndTodos();
  }, [scope]);

  const loadPlansAndTodos = async () => {
    try {
      const pData = await fetchApi('/plans');
      const tData = await fetchApi('/todos');
      setPlans(pData || []);
      setTodos(tData || []);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Plan 생성 요청
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    const newPlanId = uuidv4();
    await fetchApi('/plans', {
      method: 'POST',
      body: JSON.stringify({ id: newPlanId, ...planForm })
    });
    loadPlansAndTodos();
  };

  // 3. ToDo 완료 처리 (Do 기록 연결 및 멱등성 키로 중복 방지)[cite: 1]
  const handleCompleteTodo = async (todoId) => {
    // 버튼 비활성화를 위해 UI를 먼저 업데이트하여 연속 클릭 방지
    setTodos(todos.map(t => t.id === todoId ? { ...t, isCompleting: true } : t));
    
    try {
      await fetchApi(`/todos/${todoId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          idempotency_key: uuidv4(), // 고유 멱등성 키 발급으로 DB 단 중복 방어[cite: 1]
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(), // 예시: 1시간 소요
          actual_time: 60,
          block_reason: ''
        })
      });
      loadPlansAndTodos();
    } catch (e) {
      alert('완료 처리 중 오류가 발생했습니다.');
    }
  };

  // 프론트엔드 정렬 및 필터링 로직[cite: 1]
  const filteredTodos = todos
    .filter(t => filterStatus === 'all' ? true : t.status === filterStatus)
    .sort((a, b) => {
      if (sortKey === 'priority') return a.priority > b.priority ? 1 : -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

  return (
    <div>
      <h2>📝 Plan (계획 생성)</h2>
      <form onSubmit={handleCreatePlan} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          value={planForm.title} 
          onChange={e => setPlanForm({...planForm, title: e.target.value})} 
          style={{ flex: 1, padding: '8px' }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>새 계획 만들기</button>
      </form>

      <h2>✅ ToDo (할 일 목록)</h2>
      <div style={{ marginBottom: '15px' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '5px' }}>
          <option value="all">모든 상태보기</option>
          <option value="pending">진행 중</option>
          <option value="completed">완료됨</option>
        </select>
        <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ marginLeft: '10px', padding: '5px' }}>
          <option value="deadline">마감일순 정렬</option>
          <option value="priority">우선순위 정렬</option>
        </select>
      </div>

      <ul style={{ padding: 0, listStyle: 'none' }}>
        {filteredTodos.map(todo => (
          <li key={todo.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '8px' }}>
            <span style={{ textDecoration: todo.status === 'completed' ? 'line-through' : 'none' }}>
              {todo.status === 'completed' ? '✔️' : '🔄'} {todo.content}
            </span>
            <div>
              <button onClick={() => onSelectPlan(todo.plan_id)} style={{ marginRight: '8px' }}>회고(See) 열기</button>
              {todo.status !== 'completed' && (
                <button 
                  onClick={() => handleCompleteTodo(todo.id)} 
                  disabled={todo.isCompleting} // 더블클릭 UI 방어[cite: 1]
                >
                  {todo.isCompleting ? '처리중...' : '완료하기'}
                </button>
              )}
            </div>
          </li>
        ))}
        {filteredTodos.length === 0 && <p style={{ color: '#888' }}>표시할 할 일이 없습니다.</p>}
      </ul>
    </div>
  );
}