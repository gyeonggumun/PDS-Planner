import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { fetchApi } from '../api';

export default function PlanToDoManager({ scope, onSelectPlan }) {
  const [todos, setTodos] = useState([]);
  const [planForm, setPlanForm] = useState({ title: '정보처리기사 실기 준비', period: '7일' });

  useEffect(() => {
    loadTodos();
  }, [scope]);

  const loadTodos = async () => {
    try {
      const tData = await fetchApi('/todos');
      setTodos(tData || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    await fetchApi('/plans', {
      method: 'POST',
      body: JSON.stringify({ id: uuidv4(), ...planForm })
    });
    alert('계획이 생성되었습니다.');
  };

  const handleCompleteTodo = async (todoId) => {
    setTodos(todos.map(t => t.id === todoId ? { ...t, isCompleting: true } : t));
    try {
      await fetchApi(`/todos/${todoId}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          idempotency_key: uuidv4(), // 중복 요청 방지용 멱등성 키[cite: 1]
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          actual_time: 60,
          block_reason: ''
        })
      });
      loadTodos();
    } catch (e) {
      alert('완료 처리 실패');
    }
  };

  return (
    <div>
      <h2>📝 Plan & ToDo</h2>
      <form onSubmit={handleCreatePlan} style={{ marginBottom: '20px' }}>
        <input value={planForm.title} onChange={e => setPlanForm({...planForm, title: e.target.value})} />
        <button type="submit">계획 만들기</button>
      </form>
      
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map(todo => (
          <li key={todo.id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '5px' }}>
            {todo.status === 'completed' ? '✔️' : '🔄'} {todo.content}
            <div style={{ marginTop: '10px' }}>
              <button onClick={() => onSelectPlan(todo.plan_id)}>회고(See)</button>
              {todo.status !== 'completed' && (
                <button onClick={() => handleCompleteTodo(todo.id)} disabled={todo.isCompleting}>
                  {todo.isCompleting ? '처리중...' : '완료하기'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}