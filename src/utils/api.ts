/**
 * ============================================
 * 🔌 API Client & Token Manager
 * ============================================
 * 
 * 백엔드 API와 통신하는 핵심 유틸리티
 * 
 * 주요 기능:
 * - HTTP 요청 처리 (GET, POST, PUT, PATCH, DELETE)
 * - 자동 토큰 관리 (Access Token, Refresh Token)
 * - 토큰 만료 시 자동 갱신
 * - 에러 핸들링
 * 
 * ⚠️ 환경 변수 설정 필수:
 * .env 파일에 다음 값을 설정하세요:
 * 
 * VITE_API_BASE_URL=http://your-backend-server.com
 * VITE_USE_MOCK_API=false  (실제 API 사용시)
 * VITE_USE_MOCK_API=true   (Mock API 사용시)
 */

// ============================================
// 환경 변수 로드
// ============================================
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:8000';
const USE_MOCK_API = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USE_MOCK_API === 'false') ? false : true;

// ============================================
// 📦 토큰 관리자
// ============================================
/**
 * 인증 토큰을 localStorage에 저장/조회/삭제하는 관리자
 * 
 * - Access Token: 짧은 유효기간, API 요청에 사용
 * - Refresh Token: 긴 유효기간, Access Token 재발급에 사용
 */
export const tokenManager = {
  /**
   * Access Token 조회
   */
  getAccessToken: (): string | null => localStorage.getItem('accessToken'),
  
  /**
   * Refresh Token 조회
   */
  getRefreshToken: (): string | null => localStorage.getItem('refreshToken'),
  
  /**
   * Access Token 저장
   */
  setAccessToken: (token: string): void => localStorage.setItem('accessToken', token),
  
  /**
   * Refresh Token 저장
   */
  setRefreshToken: (token: string): void => localStorage.setItem('refreshToken', token),
  
  /**
   * 모든 토큰 삭제 (로그아웃 시 사용)
   */
  clearTokens: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

// ============================================
// ⚠️ API 에러 클래스
// ============================================
/**
 * API 요청 실패 시 발생하는 커스텀 에러
 */
export class ApiError extends Error {
  status: number;
  message: string;
  data?: any;

  /**
   * @param status - HTTP 상태 코드 (예: 404, 500)
   * @param message - 에러 메시지
   * @param data - 추가 에러 데이터
   */
  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.message = message;
    this.data = data;
    this.name = 'ApiError';
  }
}

// ============================================
// 🌐 API 클라이언트
// ============================================
/**
 * 백엔드 API와 통신하는 HTTP 클라이언트
 * 
 * 기능:
 * - 자동 토큰 첨부 (Authorization 헤더)
 * - 토큰 만료 시 자동 갱신 및 재시도
 * - 통일된 에러 처리
 */
class ApiClient {
  private baseURL: string;

  /**
   * @param baseURL - API 서버 기본 URL
   */
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * 🔌 HTTP 요청 처리 (내부 메서드)
   * 
   * @param endpoint - API 엔드포인트 (예: '/user/login')
   * @param options - Fetch API 옵션
   * @returns 응답 데이터
   * @throws {ApiError} API 요청 실패 시
   */
  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const accessToken = tokenManager.getAccessToken();

    // HTTP 헤더 설정
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Access Token이 있으면 Authorization 헤더에 추가
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // 401 Unauthorized: 토큰 만료 처리
        if (response.status === 401) {
          // Refresh Token으로 Access Token 재발급 시도
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // 재발급 성공 시 원래 요청 재시도
            return this.request(endpoint, options);
          } else {
            // 재발급 실패 시 토큰 삭제 및 에러 발생
            tokenManager.clearTokens();
            throw new ApiError(401, '인증이 만료되었습니다. 다시 로그인해주세요.');
          }
        }

        // 기타 HTTP 에러 처리
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.message || '요청 처리 중 오류가 발생했습니다.',
          errorData
        );
      }

      // 204 No Content: 응답 본문 없음
      if (response.status === 204) {
        return {};
      }

      // 정상 응답: JSON 파싱 후 반환
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // 네트워크 에러
      throw new ApiError(0, '네트워크 오류가 발생했습니다.');
    }
  }

  /**
   * 🔄 토큰 재발급 (내부 메서드)
   * 
   * @method POST /auth/refresh
   * @returns 재발급 성공 여부
   */
  async refreshToken(): Promise<boolean> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      // ✅ 토큰 재발급 - POST /auth/refresh
      // 🔌 외부 API 호출 - 백엔드에서 새로운 액세스 토큰 발급
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        // 새로운 Access Token 저장
        tokenManager.setAccessToken(data.accessToken);
        // 새로운 Refresh Token이 있으면 갱신
        if (data.refreshToken) {
          tokenManager.setRefreshToken(data.refreshToken);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * 📥 GET 요청
   */
  async get(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * 📤 POST 요청
   */
  async post(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * 🔄 PUT 요청 (전체 리소스 수정)
   */
  async put(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * 🔧 PATCH 요청 (부분 리소스 수정)
   */
  async patch(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * 🗑️ DELETE 요청
   */
  async delete(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// ============================================
// Export
// ============================================
/**
 * API 클라이언트 인스턴스 (전역 사용)
 * 
 * 사용 예시:
 * ```typescript
 * const books = await apiClient.get('/book');
 * const newBook = await apiClient.post('/book', { title: '제목' });
 * ```
 */
export const apiClient = new ApiClient(API_BASE_URL);

/**
 * Mock API 사용 여부 플래그
 * 
 * true: Mock API 사용 (개발 환경)
 * false: Real API 사용 (프로덕션 환경)
 */
export { USE_MOCK_API };
