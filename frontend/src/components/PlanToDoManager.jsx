import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';

export default function PlanToDoManager({ scope, onSelectPlan }) {
  const [plans, setPlans] = useState([]);
  const [todos, setTodos] = useState([]);
  const [planForm, setPlanForm] = useState({ title: '정보처리기사 실기 1주차 준비', period: '7일' });
  const [todoContents, setTodoContents] = useState({});

  useEffect(() => {
    loadData();
  }, [scope]);

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
    setPlanForm({ title: '', period: '7일' });
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
        deadline: new Date(Date.now() + 86400000).toISOString()
      })
    });
    
    setTodoContents({ ...todoContents, [planId]: '' });
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
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#333' }}>
      
      {/* 새 계획 등록 카드 */}
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #e9ecef', marginBottom: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: '#2c3e50' }}>✨ 새로운 학습 계획(Plan) 만들기</h3>
        <form onSubmit={handleCreatePlan} style={{ display: 'flex', gap: '10px' }}>
          <input 
            placeholder="계획 제목 (예: 정보처리기사 실기 대비)" 
            value={planForm.title} 
            onChange={e => setPlanForm({...planForm, title: e.target.value})} 
            style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '0.95rem' }}
          />
          <select 
            value={planForm.period} 
            onChange={e => setPlanForm({...planForm, period: e.target.value})}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ced4da', background: '#fff' }}
          >
            <option value="7일">7일 완성</option>
            <option value="14일">14일 완성</option>
            <option value="30일">30일 완성</option>
          </select>
          <button type="submit" style={{ padding: '10px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
            계획 생성
          </button>
        </form>
      </div>

      <h3 style={{ borderBottom: '2px solid #f1f3f5', paddingBottom: '10px', marginBottom: '20px', color: '#1e293b' }}>
        📋 등록된 계획 및 ToDo 리스트
      </h3>

      {plans.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f9fafb', borderRadius: '8px', color: '#6b7280' }}>
          아직 등록된 계획이 없습니다. 상단에서 첫 계획을 만들어보세요!
        </div>
      )}
      
      {plans.map(plan => {
        const planTodos = todos.filter(t => t.plan_id === plan.id);
        const completedCount = planTodos.filter(t => t.status === 'completed').length;
        const progress = planTodos.length > 0 ? Math.round((completedCount / planTodos.length) * 100) : 0;

        return (
          <div key={plan.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            
            {/* 계획 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4338ca', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>
                  기간: {plan.period}
                </span>
                <h4 style={{ margin: '8px 0 4px 0', fontSize: '1.25rem', color: '#0f172a' }}>🎯 {plan.title}</h4>
              </div>
              <button 
                onClick={() => onSelectPlan(plan.id)} 
                style={{ background: '#0f172a', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                📊 회고(See) 분석 보기
              </button>
            </div>

            {/* 진행률 바 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>
                <span>진행률 ({completedCount}/{planTodos.length} 완료)</span>
                <span>{progress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#4f46e5', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>

            {/* 할 일 추가 폼 */}
            <form onSubmit={(e) => handleCreateTodo(plan.id, e)} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input 
                placeholder="세부 할 일(ToDo)을 입력하세요..." 
                value={todoContents[plan.id] || ''} 
                onChange={e => setTodoContents({...todoContents, [plan.id]: e.target.value})}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
              />
              <button type="submit" style={{ padding: '8px 14px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer' }}>
                + 추가
              </button>
            </form>

            {/* 할 일 목록 */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {planTodos.map(todo => {
                const isDone = todo.status === 'completed';
                return (
                  <li key={todo.id} style={{ background: isDone ? '#f8fafc' : '#ffffff', border: '1px solid #f1f5f9', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{isDone ? '✅' : '⏳'}</span>
                      <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#94a3b8' : '#334155', fontSize: '0.95rem' }}>
                        {todo.content}
                      </span>
                    </div>
                    {!isDone && (
                      <button 
                        onClick={() => handleCompleteTodo(todo.id)} 
                        disabled={todo.isCompleting}
                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                      >
                        {todo.isCompleting ? '처리중...' : '완료'}
                      </button>
                    )}
                  </li>
                );
              })}
              {planTodos.length === 0 && (
                <li style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>
                  등록된 할 일이 없습니다. 할 일을 추가해 보세요.
                </li>
              )}
            </ul>

          </div>
        );
      })}
    </div>
  );
}