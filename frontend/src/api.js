export const fetchApi = async (endpoint, options = {}) => {
  const scope = localStorage.getItem('ab_scope') || 'A';
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Scope-ID': scope, // A/B 합성 검토 범위
    ...options.headers,
  };

  const response = await fetch(`http://localhost:3000/api${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 403 || response.status === 404) {
    alert("접근이 거부되었습니다. (반대 범위의 데이터)");
  }
  return response.json();
};