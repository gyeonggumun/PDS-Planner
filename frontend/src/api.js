const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

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

  // [수정] 디버그/백업 관련 엔드포인트는 403/404 공통 알림 예외 처리
  if ((response.status === 403 || response.status === 404) && !endpoint.includes('/debug/') && !endpoint.includes('/backup/')) {
    alert("접근이 거부되었습니다. (다른 사용자의 보호된 자료입니다)");
    throw new Error("Scope Access Denied");
  }

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  if (options.isDownload) {
    return response.blob();
  }

  return response.json();
};