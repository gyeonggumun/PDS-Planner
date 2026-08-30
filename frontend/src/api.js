const API_BASE = 'http://localhost:3000/api'; // 로컬 테스트용 (Vercel 배포 시 환경 변수로 덮어씌워짐)

export const fetchApi = async (endpoint, options = {}) => {
  const scope = localStorage.getItem('ab_scope') || 'A';
  
  const headers = {
    'X-Scope-ID': scope,
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (response.status === 403 || response.status === 404) {
    alert("접근이 거부되었습니다. (다른 사용자의 보호된 자료입니다)");
    throw new Error("Scope Access Denied");
  }

  if (options.isDownload) {
    return response.blob();
  }

  return response.json();
};