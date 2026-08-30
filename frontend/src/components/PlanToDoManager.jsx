import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { fetchApi } from '../api';

export default function PlanToDoManager({ scope, onSelectPlan }) {
  const [plans, setPlans] = useState([]);
  const [todos, setTodos] = useState([]);
  
  // 새 Plan 폼 상태 (정보처리기사 등 자격증 준비 기본값)
  const [planForm, setPlanForm] = useState({ title: '정보처리기사 실기 1주차', period: '7일', expected_time: 1200 });
  
  // 필터 및 정렬 상태[cite: 1]
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, completed
  const [sortKey, setSortKey] = useState('deadline'); // deadline, priority

  // 1. 데이터 로드 (scope가 바뀔 때마다 다시 가져옴)
  useEffect(() => {
    loadPlansAndTodos();
  }, [scope]);

  const loadPlansAndTodos = async () => {
    try {
      // (백엔드에 GET /plans, GET /todos API가 구현되어 있다고 가정)
      const pData = await fetchApi('/plans');
      const tData = await fetchApi('/todos');
      setPlans(pData || []);
      setTodos(tData || []);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Plan 생성
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    const newPlanId = uuidv4();
    await fetchApi('/plans', {
      method: 'POST',
      body: JSON.stringify({ id: newPlanId, ...planForm })
    });
    loadPlansAndTodos();
  };

  // 3. ToDo 중복 방지 완료 처리 (Do 기록 연결)[cite: 1]
  const handleCompleteTodo = async (todoId) => {
    // 버튼 비활성화를 위해 UI 우선 업데이트
    setTodos(todos.map(t => t.id === todoId ? { ...t, isCompleting: true } : t));
    
    try {
      await fetchApi(`/todos/${todoId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          idempotency_key: uuidv4(), // 고유 키 발급으로 중복 차단[cite: 1]
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(), // 임시 1시간 소요
          actual_time: 60,
          block_reason: ''
        })
      });
      loadPlansAndTodos();
    } catch (e) {
      alert('완료 처리 중 오류가 발생했습니다.');
    }
  };

  // 프론트엔드 정렬 및 필터링 적용[cite: 1]
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
        <input value={planForm.title} onChange={e => setPlanForm({...planForm, title: e.target.value})} />
        <button type="submit">새 계획 만들기</button>
      </form>

      <h2>✅ ToDo (할 일 목록)</h2>
      <div style={{ marginBottom: '10px' }}>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">모든 상태</option>
          <option value="pending">진행 중</option>
          <option value="completed">완료됨</option>
        </select>
        <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ marginLeft: '10px' }}>
          <option value="deadline">마감일순 정렬</option>
          <option value="priority">우선순위 정렬</option>
        </select>
      </div>

      <ul style={{ padding: 0 }}>
        {filteredTodos.map(todo => (
          <li key={todo.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', border: '1px solid #ccc', marginBottom: '5px' }}>
            <span>
              {todo.status === 'completed' ? '✔️' : '🔄'} {todo.content}
            </span>
            <div>
              <button onClick={() => onSelectPlan(todo.plan_id)} style={{ marginRight: '5px' }}>회고(See) 보기</button>
              {todo.status !== 'completed' && (
                <button 
                  onClick={() => handleCompleteTodo(todo.id)} 
                  disabled={todo.isCompleting} // 더블클릭 UI 방지[cite: 1]
                >
                  완료하기
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}