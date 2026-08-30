import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';

export default function PlanToDoManager({ scope, onSelectPlan }) {
  const [plans, setPlans] = useState([]);
  const [todos, setTodos] = useState([]);
  const [planForm, setPlanForm] = useState({ title: '정보처리기사 실기 1주차 준비', period: '7일' });
  const [todoContents, setTodoContents] = useState({}); // 각 Plan별 할일 입력창 상태 분리 관리

  useEffect(() => {
    loadData();
  }, [scope]);

  // Plan과 ToDo를 한 번에 불러오기
  const loadData = async () => {
    try {
      const pData = await fetchApi('/plans');
      const tData = await fetchApi('/todos');
      setPlans(pData || []);
      setTodos(tData || []);
    } catch (e) {
      console.error('데이터 로드 실패:', e);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    await fetchApi('/plans', {
      method: 'POST',
      body: JSON.stringify({ id: crypto.randomUUID(), ...planForm, expected_time: 1200 })
    });
    alert('계획이 화면에 추가되었습니다.');
    loadData();
  };

  const handleCreateTodo = async (planId, e) => {
    e.preventDefault();
    const content = todoContents[planId];
    if (!content) return alert('할 일 내용을 입력하세요.');

    await fetchApi('/todos', {
      method: 'POST',
      body: JSON.stringify({
        id: crypto.randomUUID(),
        plan_id: planId,
        content: content,
        status: 'pending',
        expected_time: 60,
        deadline: new Date(Date.now() + 86400000).toISOString() // 하루 뒤 마감
      })
    });
    
    setTodoContents({ ...todoContents, [planId]: '' }); // 입력창 초기화
    loadData();
  };

  const handleCompleteTodo = async (todoId) => {
    setTodos(todos.map(t => t.id === todoId ? { ...t, isCompleting: true } : t));
    try {
      await fetchApi(`/todos/${todoId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          actual_time: 60,
          block_reason: ''
        })
      });
      loadData();
    } catch (e) {
      alert('완료 처리 실패');
      loadData();
    }
  };

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

      <hr style={{ borderTop: '2px dashed #eee', margin: '30px 0' }} />

      <h2>✅ 등록된 계획 및 ToDo</h2>
      {plans.length === 0 && <p style={{ color: '#888' }}>아직 등록된 계획이 없습니다.</p>}
      
      {plans.map(plan => (
        <div key={plan.id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginBottom: '20px', backgroundColor: '#fafafa' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#333' }}>🎯 {plan.title} (기간: {plan.period})</h3>
            <button onClick={() => onSelectPlan(plan.id)} style={{ backgroundColor: '#2c3e50', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px' }}>
              📊 이 계획 회고(See) 열기
            </button>
          </div>

          <form onSubmit={(e) => handleCreateTodo(plan.id, e)} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input 
              placeholder="이 계획에 추가할 ToDo 입력..." 
              value={todoContents[plan.id] || ''} 
              onChange={e => setTodoContents({...todoContents, [plan.id]: e.target.value})}
              style={{ flex: 1, padding: '6px' }}
            />
            <button type="submit">ToDo 추가</button>
          </form>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {todos.filter(t => t.plan_id === plan.id).map(todo => (
              <li key={todo.id} style={{ background: '#fff', border: '1px solid #eee', padding: '10px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ textDecoration: todo.status === 'completed' ? 'line-through' : 'none', color: todo.status === 'completed' ? '#aaa' : '#000' }}>
                  {todo.status === 'completed' ? '✔️' : '🔄'} {todo.content}
                </span>
                {todo.status !== 'completed' && (
                  <button onClick={() => handleCompleteTodo(todo.id)} disabled={todo.isCompleting}>
                    {todo.isCompleting ? '처리중...' : '완료하기'}
                  </button>
                )}
              </li>
            ))}
            {todos.filter(t => t.plan_id === plan.id).length === 0 && (
              <li style={{ fontSize: '0.9em', color: '#999' }}>등록된 할 일이 없습니다.</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}