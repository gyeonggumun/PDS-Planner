import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';

export default function PlanToDoManager({ scope, onSelectPlan }) {
  const [plans, setPlans] = useState([]);
  const [todos, setTodos] = useState([]);
  const [planForm, setPlanForm] = useState({ title: '', period: '7일' });
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
    if (!planForm.title.trim()) return alert('계획 제목을 입력해주세요.');
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
    if (!content || !content.trim()) return;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 섹션 타이틀 영역 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600', color: '#0f172a' }}>Plan & Execution Board</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>등록된 학습 및 업무 단위별 목표와 세부 과제를 관리합니다.</p>
        </div>
        <span style={{ fontSize: '0.8rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontWeight: '500', border: '1px solid #e2e8f0' }}>
          Active Scope: {scope}
        </span>
      </div>

      {/* 새 계획 등록 폼 카드 */}
      <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: '600', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Create New Plan</h3>
        <form onSubmit={handleCreatePlan} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input 
            placeholder="목표 제목 입력 (예: 정보처리기사 실기 대비)" 
            value={planForm.title} 
            onChange={e => setPlanForm({...planForm, title: e.target.value})} 
            style={{ flex: 1, minWidth: '240px', padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#ffffff', outline: 'none' }}
          />
          <select 
            value={planForm.period} 
            onChange={e => setPlanForm({...planForm, period: e.target.value})}
            style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.9rem', color: '#334155', outline: 'none' }}
          >
            <option value="7일">7일 단위</option>
            <option value="14일">14일 단위</option>
            <option value="30일">30일 단위</option>
          </select>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.15s' }}>
            계획 생성
          </button>
        </form>
      </div>

      {/* 계획 및 ToDo 리스트 컨테이너 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {plans.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.9rem' }}>
            등록된 계획이 없습니다. 상단 입력창을 통해 첫 번째 계획을 생성하세요.
          </div>
        )}
        
        {plans.map(plan => {
          const planTodos = todos.filter(t => t.plan_id === plan.id);
          const completedCount = planTodos.filter(t => t.status === 'completed').length;
          const progress = planTodos.length > 0 ? Math.round((completedCount / planTodos.length) * 100) : 0;

          return (
            <div key={plan.id} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* 카드 상단 정보 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '4px', fontWeight: '600', border: '1px solid #bfdbfe' }}>
                      {plan.period}
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '600', color: '#0f172a' }}>{plan.title}</h4>
                </div>
                <button 
                  onClick={() => onSelectPlan(plan.id)} 
                  style={{ backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  회고(See) 분석 리포트
                </button>
              </div>

              {/* 진행률 바 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b', marginBottom: '6px', fontWeight: '500' }}>
                  <span>진행 현황 ({completedCount} / {planTodos.length} 완료)</span>
                  <span>{progress}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#0f172a', transition: 'width 0.3s ease' }}></div>
                </div>
              </div>

              {/* 세부 할 일 입력 */}
              <form onSubmit={(e) => handleCreateTodo(plan.id, e)} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  placeholder="세부 과제(ToDo) 추가..." 
                  value={todoContents[plan.id] || ''} 
                  onChange={e => setTodoContents({...todoContents, [plan.id]: e.target.value})}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                />
                <button type="submit" style={{ padding: '8px 14px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', cursor: 'pointer' }}>
                  추가
                </button>
              </form>

              {/* 할 일 아이템 리스트 */}
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {planTodos.map(todo => {
                  const isDone = todo.status === 'completed';
                  return (
                    <li key={todo.id} style={{ backgroundColor: isDone ? '#f8fafc' : '#ffffff', border: '1px solid #f1f5f9', padding: '10px 12px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.9rem' }}>{isDone ? '✓' : '•'}</span>
                        <span style={{ textDecoration: isDone ? 'line-through' : 'none', color: isDone ? '#94a3b8' : '#334155', fontSize: '0.9rem' }}>
                          {todo.content}
                        </span>
                      </div>
                      {!isDone && (
                        <button 
                          onClick={() => handleCompleteTodo(todo.id)} 
                          disabled={todo.isCompleting}
                          style={{ backgroundColor: '#0f172a', color: '#ffffff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500', cursor: 'pointer' }}
                        >
                          {todo.isCompleting ? '처리중' : '완료'}
                        </button>
                      )}
                    </li>
                  );
                })}
                {planTodos.length === 0 && (
                  <li style={{ fontSize: '0.85rem', color: '#94a3b8', padding: '8px 0', textAlign: 'center' }}>
                    등록된 세부 과제가 없습니다.
                  </li>
                )}
              </ul>

            </div>
          );
        })}
      </div>
    </div>
  );
}