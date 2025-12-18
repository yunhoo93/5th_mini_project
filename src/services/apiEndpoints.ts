/**
 * ============================================
 * API 엔드포인트 상수 정의
 * ============================================
 * 
 * 📋 백엔드 API 명세서 기반 (100% 일치)
 * 📊 총 24개 엔드포인트 정의
 * 
 * 도메인별 분류:
 * - User: 6개 (회원 인증, 조회)
 * - Book: 7개 (도서 CRUD, AI 표지 생성)
 * - Comment: 2개 (리뷰/댓글 등록, 삭제)
 * - Order: 4개 (주문 생성, 결제, 취소, 조회)
 * - CartItem: 5개 (장바구니 담기, 조회, 수량 변경, 항목 삭제, 전체 삭제)
 * 
 * ⚠️ 주의사항:
 * - 모든 엔드포인트는 실제 백엔드 API 명세서와 동일해야 함
 * - HTTP 메서드(GET, POST, PUT, DELETE, PATCH) 주석 참고
 * - URL 파라미터는 함수로 정의 (예: (userId) => `/user/${userId}`)
 */

// ============================================
// 📌 User 도메인 API (6개)
// ============================================
// 회원 인증 및 사용자 데이터 관리
export const USER_ENDPOINTS = {
  /**
   * 🔹 회원가입
   * @method POST
   * @endpoint /user/signup
   * @description 새로운 사용자 계정 생성
   * @request { id: string, password: string, role?: 'admin' | 'user' }
   * @response void
   */
  SIGNUP: '/user/signup',
  
  /**
   * 🔹 로그인
   * @method POST
   * @endpoint /user/login
   * @description 사용자 인증 및 토큰 발급
   * @request { id: string, password: string }
   * @response { accessToken: string, refreshToken: string, user: {...} }
   */
  LOGIN: '/user/login',
  
  /**
   * 🔹 로그아웃
   * @method POST
   * @endpoint /user/logout
   * @description 사용자 로그아웃 및 토큰 무효화
   * @request void
   * @response void
   */
  LOGOUT: '/user/logout',
  
  /**
   * 🔹 토큰 재발급
   * @method POST
   * @endpoint /auth/refresh
   * @description 만료된 액세스 토큰을 리프레시 토큰으로 재발급
   * @request { refreshToken: string }
   * @response { accessToken: string }
   */
  REFRESH: '/auth/refresh',
  
  /**
   * 🔹 본인 도서 조회
   * @method GET
   * @endpoint /user/book/{userId}
   * @description 특정 사용자가 구매한 도서 목록 조회
   * @param {string} userId - 사용자 ID
   * @response Book[]
   */
  GET_USER_BOOKS: (userId: string) => `/user/book/${userId}`,
  
  /**
   * 🔹 본인 주문 목록 조회
   * @method GET
   * @endpoint /user/order/{userId}
   * @description 특정 사용자의 주문 내역 조회
   * @param {string} userId - 사용자 ID
   * @response Order[]
   */
  GET_USER_ORDERS: (userId: string) => `/user/order/${userId}`,
} as const;

// ============================================
// 📌 Book 도메인 API (7개)
// ============================================
// 도서 CRUD 및 AI 표지 생성
export const BOOK_ENDPOINTS = {
  /**
   * 🔹 도서 전체 조회
   * @method GET
   * @endpoint /book/all
   * @description 등록된 모든 도서 목록 조회 (필터링 없음)
   * @response Book[]
   */
  GET_ALL_BOOKS: '/book/all',
  
  /**
   * 🔹 신규 도서 등록
   * @method POST
   * @endpoint /book
   * @description 새로운 도서를 시스템에 등록 (AI가 자동으로 표지 생성)
   * @request { title: string, author: string, genre: string, description: string, publishedYear: number, price: number, stock?: number }
   * @response Book
   */
  CREATE_BOOK: '/book',
  
  /**
   * 🔹 도서 상세정보 조회
   * @method GET
   * @endpoint /book/{bookId}
   * @description 특정 도서의 상세 정보 조회
   * @param {string} bookId - 도서 ID
   * @response Book
   */
  GET_BOOK_BY_ID: (bookId: string) => `/book/${bookId}`,
  
  /**
   * 🔹 도서 수정
   * @method PUT
   * @endpoint /book/{bookId}
   * @description 기존 도서 정보 수정 (제목, 저자, 가격 등)
   * @param {string} bookId - 도서 ID
   * @request { title?: string, author?: string, genre?: string, description?: string, publishedYear?: number, price?: number }
   * @response Book
   */
  UPDATE_BOOK: (bookId: string) => `/book/${bookId}`,
  
  /**
   * 🔹 도서 삭제
   * @method DELETE
   * @endpoint /book/{bookId}
   * @description 시스템에서 도서를 완전히 삭제
   * @param {string} bookId - 도서 ID
   * @response void
   */
  DELETE_BOOK: (bookId: string) => `/book/${bookId}`,
  
  /**
   * 🔹 AI 표지 재생성
   * @method PATCH
   * @endpoint /book/{bookId}
   * @description AI를 사용하여 도서 표지 이미지를 새로 생성
   * @param {string} bookId - 도서 ID
   * @response Book (새로운 coverImage URL 포함)
   */
  REGENERATE_COVER: (bookId: string) => `/book/${bookId}`,
  
  /**
   * 🔹 도서 재고 업데이트 (ADMIN 전용)
   * @method PUT
   * @endpoint /book/{bookId}/stock
   * @description 도서의 재고 수량을 직접 변경 (관리자 권한 필요)
   * @param {string} bookId - 도서 ID
   * @request { stock: number }
   * @response Book
   */
  UPDATE_STOCK: (bookId: string) => `/book/${bookId}/stock`,
} as const;

// ============================================
// 📌 Comment 도메인 API (2개)
// ============================================
// 리뷰 및 댓글 관리
export const COMMENT_ENDPOINTS = {
  /**
   * 🔹 댓글 등록
   * @method POST
   * @endpoint /comment/{bookId}
   * @description 특정 도서에 리뷰/댓글 작성
   * @param {string} bookId - 도서 ID
   * @request { comment: string, rating?: number }
   * @response Review
   */
  CREATE_COMMENT: (bookId: string) => `/comment/${bookId}`,
  
  /**
   * 🔹 댓글 삭제
   * @method DELETE
   * @endpoint /comment/{commentId}
   * @description 작성한 리뷰/댓글 삭제
   * @param {string} commentId - 댓글 ID
   * @response void
   */
  DELETE_COMMENT: (commentId: string) => `/comment/${commentId}`,
} as const;

// ============================================
// 📌 Order 도메인 API (4개)
// ============================================
// 주문 및 결제 처리
export const ORDER_ENDPOINTS = {
  /**
   * 🔹 주문 생성
   * @method POST
   * @endpoint /order
   * @description 새로운 주문 생성 (아직 결제 전 상태)
   * @request { items: [{ bookId: string, quantity: number }] }
   * @response { orderId: string, status: string, totalAmount: number, items: [...], createdAt: Date }
   */
  CREATE_ORDER: '/order',
  
  /**
   * 🔹 주문 결제 처리
   * @method POST
   * @endpoint /order/{orderId}/pay
   * @description 주문을 결제 완료 상태로 변경 (재고 차감 처리)
   * @param {string} orderId - 주문 ID
   * @response OrderResponse
   */
  PAY_ORDER: (orderId: string) => `/order/${orderId}/pay`,
  
  /**
   * 🔹 주문 취소
   * @method POST
   * @endpoint /order/{orderId}/cancel
   * @description 주문을 취소하고 재고 복구 처리
   * @param {string} orderId - 주문 ID
   * @response OrderResponse
   */
  CANCEL_ORDER: (orderId: string) => `/order/${orderId}/cancel`,
  
  /**
   * 🔹 주문 상세 조회
   * @method GET
   * @endpoint /order/{orderId}
   * @description 특정 주문의 상세 정보 조회
   * @param {string} orderId - 주문 ID
   * @response OrderResponse
   */
  GET_ORDER: (orderId: string) => `/order/${orderId}`,
} as const;

// ============================================
// 📌 CartItem 도메인 API (5개)
// ============================================
// 장바구니 관리
export const CARTITEM_ENDPOINTS = {
  /**
   * 🔹 장바구니에 담기
   * @method POST
   * @endpoint /cart
   * @description 장바구니에 새로운 도서 추가
   * @request { bookId: string, quantity: number }
   * @response CartItem
   */
  ADD_TO_CART: '/cart',
  
  /**
   * 🔹 장바구니 조회
   * @method GET
   * @endpoint /cart
   * @description 현재 사용자의 장바구니 목록 조회
   * @response CartItem[]
   */
  GET_CART: '/cart',
  
  /**
   * 🔹 장바구니에서 수량 변경
   * @method PATCH
   * @endpoint /cart/{cartItemId}
   * @description 장바구니 항목의 수량 변경
   * @param {string} cartItemId - 장바구니 항목 ID
   * @request { quantity: number }
   * @response CartItem
   */
  UPDATE_CART_ITEM: (cartItemId: string) => `/cart/${cartItemId}`,
  
  /**
   * 🔹 항목 삭제
   * @method DELETE
   * @endpoint /cart/{cartItemId}
   * @description 장바구니에서 특정 항목 삭제
   * @param {string} cartItemId - 장바구니 항목 ID
   * @response void
   */
  DELETE_CART_ITEM: (cartItemId: string) => `/cart/${cartItemId}`,
  
  /**
   * 🔹 전체 삭제
   * @method DELETE
   * @endpoint /cart
   * @description 장바구니 전체 비우기
   * @response void
   */
  CLEAR_CART: '/cart',
} as const;

/**
 * ============================================
 * 📊 API 엔드포인트 통계
 * ============================================
 * 
 * 전체: 24개
 * ├─ User: 6개 (회원가입, 로그인, 로그아웃, 토큰재발급, 도서조회, 주문조회)
 * ├─ Book: 7개 (전체조회, 등록, 상세조회, 수정, 삭제, AI표지생성, 재고업데이트)
 * ├─ Comment: 2개 (등록, 삭제)
 * ├─ Order: 4개 (생성, 결제, 취소, 조회)
 * └─ CartItem: 5개 (담기, 조회, 수량변경, 항목삭제, 전체삭제)
 * 
 * 📝 작성자: API 명세서 기반 자동 생성
 * 🔄 최종 업데이트: 2024년 12월
 */