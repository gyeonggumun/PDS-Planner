import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export default function PlanToDoManager({ session, onSelectPlan }) {
  const [plans, setPlans] = useState([]);
  const [newPlan, setNewPlan] = useState({ title: '', period: '' });
  const [todos, setTodos] = useState({});
  const [newTodos, setNewTodos] = useState({});
  const [completeData, setCompleteData] = useState({});

  useEffect(() => {
    if (session) fetchPlans();
  }, [session]);

  const fetchPlans = async () => {
    const { data } = await supabase.from('plans').select('*');
    if (data) {
      setPlans(data);
      data.forEach(p => fetchTodos(p.id));
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('plans').insert([{
      id: crypto.randomUUID(),
      owner: session.user.id,
      title: newPlan.title,
      period: newPlan.period,
      expected_time: 0
    }]);
    if (!error) {
      setNewPlan({ title: '', period: '' });
      fetchPlans();
    }
  };

  const fetchTodos = async (planId) => {
    const { data } = await supabase.from('todos').select('*').eq('plan_id', planId);
    if (data) setTodos(prev => ({ ...prev, [planId]: data }));
  };

  const handleCreateTodo = async (e, planId) => {
    e.preventDefault();
    const { error } = await supabase.from('todos').insert([{
      id: crypto.randomUUID(),
      plan_id: planId,
      owner: session.user.id,
      content: newTodos[planId] || '',
      status: 'pending',
      expected_time: 60
    }]);
    if (!error) {
      setNewTodos(prev => ({ ...prev, [planId]: '' }));
      fetchTodos(planId);
    }
  };

  const handleCompleteTodo = async (todoId, planId) => {
    const d = completeData[todoId] || {};
    const { error: todoError } = await supabase.from('todos').update({ status: 'completed' }).eq('id', todoId);
    if (!todoError) {
      await supabase.from('dos').insert([{
        id: crypto.randomUUID(),
        todo_id: todoId,
        owner: session.user.id,
        actual_time: parseInt(d.actual_time || 60),
        block_reason: d.block_reason || ''
      }]);
      fetchTodos(planId);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Plan & ToDo Management</h2>
      <form onSubmit={handleCreatePlan} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input required placeholder="목표 입력" value={newPlan.title} onChange={e => setNewPlan({...newPlan, title: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <input required placeholder="기간" value={newPlan.period} onChange={e => setNewPlan({...newPlan, period: e.target.value})} style={{ width: '120px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
        <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px' }}>Plan 생성</button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {plans.map(plan => (
          <div key={plan.id} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{plan.title} ({plan.period})</h3>
              <button onClick={() => onSelectPlan(plan.id)} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>See 대시보드</button>
            </div>
            
            <form onSubmit={(e) => handleCreateTodo(e, plan.id)} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input required placeholder="새 ToDo 입력" value={newTodos[plan.id] || ''} onChange={e => setNewTodos({...newTodos, [plan.id]: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px' }}>추가</button>
            </form>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {(todos[plan.id] || []).map(todo => (
                <li key={todo.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ flex: 1, textDecoration: todo.status === 'completed' ? 'line-through' : 'none', color: todo.status === 'completed' ? '#94a3b8' : '#0f172a' }}>{todo.content}</span>
                  {todo.status !== 'completed' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="number" placeholder="소요시간(분)" style={{ width: '100px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} onChange={e => setCompleteData({...completeData, [todo.id]: {...completeData[todo.id], actual_time: e.target.value}})} />
                      <input type="text" placeholder="방해요소" style={{ width: '120px', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} onChange={e => setCompleteData({...completeData, [todo.id]: {...completeData[todo.id], block_reason: e.target.value}})} />
                      <button onClick={() => handleCompleteTodo(todo.id, plan.id)} style={{ padding: '6px 12px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>완료</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}