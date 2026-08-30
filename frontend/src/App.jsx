import { useState, useEffect } from 'react';
import { fetchApi } from './api';

function App() {
  const [scope, setScope] = useState(localStorage.getItem('ab_scope') || 'A');
  const [data, setData] = useState(null);

  const changeScope = (newScope) => {
    localStorage.setItem('ab_scope', newScope);
    setScope(newScope);
  };

  const loadData = async () => {
    const result = await fetchApi('/todos');
    setData(result);
  };

  useEffect(() => {
    loadData();
  }, [scope]);

  return (
    <div>
      <h1>PDS Planner 심사 화면</h1>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => changeScope('A')} disabled={scope === 'A'}>A 인물로 보기</button>
        <button onClick={() => changeScope('B')} disabled={scope === 'B'}>B 인물로 보기</button>
      </div>
      <p>현재 상태: <strong>{scope}</strong></p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default App;