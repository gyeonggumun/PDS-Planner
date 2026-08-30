const API_BASE = 'http://localhost:3000/api';

export const fetchApi = async (endpoint, options = {}) => {
  const scope = localStorage.getItem('ab_scope') || 'A';
  
  const headers = {
    'X-Scope-ID': scope, // A/B 합성 검토 범위 강제
    ...options.headers,
  };

  // FormData(파일 업로드)가 아닐 때만 JSON Content-Type 추가
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (response.status === 403 || response.status === 404) {
    alert("접근이 거부되었습니다. (반대 범위의 보호 자료입니다)");
    throw new Error("Scope Access Denied");
  }

  // 파일 다운로드(Blob) 처리
  if (options.isDownload) {
    return response.blob();
  }

  return response.json();
};