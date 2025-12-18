# 📡 API 연동 가이드

백엔드 API 명세서에 정의된 **24개 엔드포인트**가 모두 구현되어 있습니다.

## 📋 API 명세서 참조

이 구현은 다음 API 명세서를 기반으로 작성되었습니다:

**API 명세서 구조:**
```
User 도메인 (6개)
├─ POST   /user/signup              # 회원가입
├─ POST   /user/login               # 로그인
├─ POST   /user/logout              # 로그아웃
├─ POST   /auth/refresh             # 토큰 재발급
├─ GET    /user/book/{userId}       # 본인 도서 조회
└─ GET    /user/order/{userId}      # 본인 주문 목록 조회

Book 도메인 (7개)
├─ GET    /book/all                 # 도서 전체 조회
├─ POST   /book                     # 신규 도서 등록
├─ GET    /book/{bookId}            # 도서 상세정보 조회
├─ PUT    /book/{bookId}            # 도서 수정
├─ DELETE /book/{bookId}            # 도서 삭제
├─ PATCH  /book/{bookId}            # AI 표지 재생성
└─ PUT    /book/{bookId}/stock      # 도서 재고 업데이트 (ADMIN)

Comment 도메인 (2개)
├─ POST   /comment/{bookId}         # 댓글 등록
└─ DELETE /comment/{commentId}      # 댓글 삭제

Order 도메인 (4개)
├─ POST   /order                    # 주문 생성
├─ POST   /order/{orderId}/pay      # 주문 결제 처리
├─ POST   /order/{orderId}/cancel   # 주문 취소
└─ GET    /order/{orderId}          # 주문 상세 조회

CartItem 도메인 (5개)
├─ POST   /cart                     # 장바구니에 담기
├─ GET    /cart                     # 장바구니 조회
├─ PATCH  /cart/{cartItemId}        # 장바구니에서 수량 변경
├─ DELETE /cart/{cartItemId}        # 항목 삭제
└─ DELETE /cart                     # 전체 삭제
```

## 🎯 API 구현 현황

### ✅ User 도메인 (6개)
| API 이름 | Method | Endpoint | 파일 | 상태 |
|---------|--------|----------|------|------|
| 회원가입 | POST | `/user/signup` | userService.ts | ✅ 구현완료 |
| 로그인 | POST | `/user/login` | userService.ts | ✅ 구현완료 |
| 로그아웃 | POST | `/user/logout` | userService.ts | ✅ 구현완료 |
| 토큰 재발급 | POST | `/auth/refresh` | api.ts | ✅ 구현완료 |
| 본인 도서 조회 | GET | `/user/book/{userId}` | userService.ts | ✅ 구현완료 |
| 본인 주문 목록 조회 | GET | `/user/order/{userId}` | userService.ts | ✅ 구현완료 |

### ✅ Book 도메인 (7개)
| API 이름 | Method | Endpoint | 파일 | 상태 |
|---------|--------|----------|------|------|
| 도서 전체 조회 | GET | `/book/all` | bookService.ts | ✅ 구현완료 |
| 신규 도서 등록 | POST | `/book` | bookService.ts | ✅ 구현완료 |
| 도서 상세정보 조회 | GET | `/book/{bookId}` | bookService.ts | ✅ 구현완료 |
| 도서 수정 | PUT | `/book/{bookId}` | bookService.ts | ✅ 구현완료 |
| 도서 삭제 | DELETE | `/book/{bookId}` | bookService.ts | ✅ 구현완료 |
| AI 표지 재생성 | PATCH | `/book/{bookId}` | bookService.ts | ✅ 구현완료 |
| 도서 재고 업데이트 | PUT | `/book/{bookId}/stock` | bookService.ts | ✅ 구현완료 |

### ✅ Comment 도메인 (2개)
| API 이름 | Method | Endpoint | 파일 | 상태 |
|---------|--------|----------|------|------|
| 댓글 등록 | POST | `/comment/{bookId}` | commentService.ts | ✅ 구현완료 |
| 댓글 삭제 | DELETE | `/comment/{commentId}` | commentService.ts | ✅ 구현완료 |

### ✅ Order 도메인 (4개)
| API 이름 | Method | Endpoint | 파일 | 상태 |
|---------|--------|----------|------|------|
| 주문 생성 | POST | `/order` | orderService.ts | ✅ 구현완료 |
| 주문 결제 처리 | POST | `/order/{orderId}/pay` | orderService.ts | ✅ 구현완료 |
| 주문 취소 | POST | `/order/{orderId}/cancel` | orderService.ts | ✅ 구현완료 |
| 주문 상세 조회 | GET | `/order/{orderId}` | orderService.ts | ✅ 구현완료 |

### ✅ CartItem 도메인 (5개)
| API 이름 | Method | Endpoint | 파일 | 상태 |
|---------|--------|----------|------|------|
| 장바구니에 담기 | POST | `/cart` | cartService.ts | ✅ 구현완료 |
| 장바구니 조회 | GET | `/cart` | cartService.ts | ✅ 구현완료 |
| 장바구니에서 수량 변경 | PATCH | `/cart/{cartItemId}` | cartService.ts | ✅ 구현완료 |
| 항목 삭제 | DELETE | `/cart/{cartItemId}` | cartService.ts | ✅ 구현완료 |
| 전체 삭제 | DELETE | `/cart` | cartService.ts | ✅ 구현완료 |

---

## 🔧 실제 백엔드 연동 방법

### 1️⃣ 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 백엔드 서버 URL
VITE_API_BASE_URL=http://your-backend-server.com

# Mock API 사용 여부
VITE_USE_MOCK_API=false
```

**개발 환경 (Mock API 사용):**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK_API=true
```

**프로덕션 환경 (실제 API 사용):**
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_USE_MOCK_API=false
```

### 2️⃣ API 엔드포인트 관리

모든 API 엔드포인트는 `/services/apiEndpoints.ts`에서 중앙 관리됩니다:

```typescript
import { USER_ENDPOINTS, BOOK_ENDPOINTS, COMMENT_ENDPOINTS, ORDER_ENDPOINTS, CART_ENDPOINTS } from './apiEndpoints';

// 예시: 도서 목록 조회
const books = await apiClient.get(BOOK_ENDPOINTS.GET_ALL_BOOKS);

// 예시: 도서 상세 조회
const book = await apiClient.get(BOOK_ENDPOINTS.GET_BOOK_BY_ID('book123'));
```

### 3️⃣ Mock과 Real API 전환

각 서비스 파일의 마지막 줄에서 자동으로 전환됩니다:

```typescript
// USE_MOCK_API 환경변수에 따라 자동 선택
export const userService = USE_MOCK_API ? mockUserService : realUserService;
```

---

## 🔌 외부 API 호출이 필요한 부분

모든 **Real API Implementation** 함수는 `🔌` 이모지로 표시되어 있습니다.

### User 서비스 (/services/userService.ts)
```typescript
// ✅ 회원가입 - POST /user/signup
signup: async (data: SignupRequest): Promise<void> => {
  // 🔌 외부 API 호출 - 백엔드에서 회원 정보 생성
  await apiClient.post(USER_ENDPOINTS.SIGNUP, data);
}

// ✅ 로그인 - POST /user/login
login: async (data: LoginRequest): Promise<LoginResponse> => {
  // 🔌 외부 API 호출 - 백엔드에서 인증 처리
  const response = await apiClient.post<LoginResponse>(USER_ENDPOINTS.LOGIN, data);
  return response;
}
```

### Book 서비스 (/services/bookService.ts)
```typescript
// ✅ 도서 전체 조회 - GET /book/all
getAllBooks: async (): Promise<Book[]> => {
  // 🔌 외부 API 호출 - 백엔드에서 전체 도서 목록 조회
  return await apiClient.get<Book[]>(BOOK_ENDPOINTS.GET_ALL_BOOKS);
}

// ✅ AI 표지 재생성 - PATCH /book/{bookId}
regenerateCover: async (bookId: string): Promise<Book> => {
  // 🔌 외부 API 호출 - 백엔드에서 AI를 사용하여 새로운 표지 이미지 생성
  return await apiClient.patch<Book>(BOOK_ENDPOINTS.REGENERATE_COVER(bookId));
}
```

### Comment 서비스 (/services/commentService.ts)
```typescript
// ✅ 댓글 등록 - POST /comment/{bookId}
createComment: async (bookId: string, data: CreateCommentRequest): Promise<Review> => {
  // 🔌 외부 API 호출 - 백엔드에서 새로운 리뷰/댓글 생성
  return await apiClient.post<Review>(COMMENT_ENDPOINTS.CREATE_COMMENT(bookId), data);
}
```

### Order 서비스 (/services/orderService.ts)
```typescript
// ✅ 주문 결제 처리 - POST /order/{orderId}/pay
payOrder: async (orderId: string): Promise<OrderResponse> => {
  // 🔌 외부 API 호출 - 백엔드에서 주문 결제 처리 (재고 차감 포함)
  return await apiClient.post<OrderResponse>(ORDER_ENDPOINTS.PAY_ORDER(orderId));
}
```

### CartItem 서비스 (/services/cartService.ts)
```typescript
// ✅ 장바구니에 담기 - POST /cart
addToCart: async (data: AddToCartRequest): Promise<CartItem> => {
  // 🔌 외부 API 호출 - 백엔드에서 장바구니에 항목 추가
  return await apiClient.post<CartItem>(CART_ENDPOINTS.ADD_TO_CART, data);
}

// ✅ 장바구니 조회 - GET /cart
getCartItems: async (): Promise<CartItem[]> => {
  // 🔌 외부 API 호출 - 백엔드에서 장바구니 항목 조회
  return await apiClient.get<CartItem[]>(CART_ENDPOINTS.GET_CART_ITEMS);
}

// ✅ 장바구니에서 수량 변경 - PATCH /cart/{cartItemId}
updateCartItemQuantity: async (cartItemId: string, data: UpdateCartItemQuantityRequest): Promise<CartItem> => {
  // 🔌 외부 API 호출 - 백엔드에서 장바구니 항목 수량 변경
  return await apiClient.patch<CartItem>(CART_ENDPOINTS.UPDATE_CART_ITEM_QUANTITY(cartItemId), data);
}

// ✅ 항목 삭제 - DELETE /cart/{cartItemId}
removeCartItem: async (cartItemId: string): Promise<void> => {
  // 🔌 외부 API 호출 - 백엔드에서 장바구니 항목 삭제
  await apiClient.delete(CART_ENDPOINTS.REMOVE_CART_ITEM(cartItemId));
}

// ✅ 전체 삭제 - DELETE /cart
clearCart: async (): Promise<void> => {
  // 🔌 외부 API 호출 - 백엔드에서 장바구니 전체 삭제
  await apiClient.delete(CART_ENDPOINTS.CLEAR_CART);
}
```

---

## 📝 API 요청/응답 타입

모든 API 요청/응답 타입이 각 서비스 파일 상단에 정의되어 있습니다.

### User 타입 (userService.ts)
```typescript
export interface SignupRequest {
  id: string;
  password: string;
  role?: 'admin' | 'user';
}

export interface LoginRequest {
  id: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    role: 'admin' | 'user';
  };
}
```

### Book 타입 (bookService.ts)
```typescript
export interface CreateBookRequest {
  title: string;
  author: string;
  genre: string;
  description: string;
  publishedYear: number;
  price: number;
  stock?: number;
}

export interface UpdateBookRequest {
  title?: string;
  author?: string;
  genre?: string;
  description?: string;
  publishedYear?: number;
  price?: number;
}

export interface UpdateStockRequest {
  stock: number;
}
```

### Order 타입 (orderService.ts)
```typescript
export interface CreateOrderRequest {
  items: {
    bookId: string;
    quantity: number;
  }[];
}

export interface OrderResponse {
  orderId: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: {
    bookId: string;
    quantity: number;
    price: number;
  }[];
  createdAt: Date;
}
```

### CartItem 타입 (cartService.ts)
```typescript
export interface AddToCartRequest {
  bookId: string;
  quantity: number;
}

export interface UpdateCartItemQuantityRequest {
  quantity: number;
}

export interface CartItem {
  cartItemId: string;
  bookId: string;
  quantity: number;
  price: number;
}
```

---

## 🔐 인증 처리

### 토큰 관리
모든 인증 토큰은 `/utils/api.ts`의 `tokenManager`가 자동으로 관리합니다:

```typescript
// 로그인 시 자동 저장
tokenManager.setAccessToken(response.accessToken);
tokenManager.setRefreshToken(response.refreshToken);

// API 요청 시 자동으로 헤더에 포함
headers['Authorization'] = `Bearer ${accessToken}`;

// 토큰 만료 시 자동 갱신
if (response.status === 401) {
  const refreshed = await this.refreshToken();
  // 성공 시 원래 요청 재시도
}
```

### 자동 토큰 갱신
401 에러 발생 시 `/auth/refresh` API를 자동으로 호출하여 새로운 토큰을 발급받습니다.

---

## 🚀 사용 예시

### 1. 회원가입
```typescript
import { userService } from './services/userService';

await userService.signup({
  id: 'newuser',
  password: 'password123',
  role: 'user'
});
```

### 2. 로그인
```typescript
const loginResponse = await userService.login({
  id: 'user123',
  password: 'password123'
});
// 토큰은 자동으로 저장됨
```

### 3. 도서 생성 (AI 표지 자동 생성)
```typescript
import { bookService } from './services/bookService';

const newBook = await bookService.createBook({
  title: '새로운 책',
  author: '작가 이름',
  genre: '소설',
  description: '책 설명',
  publishedYear: 2024,
  price: 15000,
  stock: 50
});
// 백엔드에서 AI가 자동으로 표지 이미지 생성
```

### 4. 주문 생성 및 결제
```typescript
import { orderService } from './services/orderService';

// 주문 생성
const order = await orderService.createOrder({
  items: [
    { bookId: 'book123', quantity: 2 },
    { bookId: 'book456', quantity: 1 }
  ]
});

// 결제 처리
const paidOrder = await orderService.payOrder(order.orderId);
```

### 5. 장바구니에 담기
```typescript
import { cartService } from './services/cartService';

await cartService.addToCart({
  bookId: 'book123',
  quantity: 1
});
```

---

## ⚠️ 주의사항

1. **Mock API 제거**: 실제 배포 시 `VITE_USE_MOCK_API=false`로 설정하세요
2. **TODO 주석**: Mock API 함수의 `// TODO: 실제 API 연동 시 제거` 주석 확인
3. **에러 처리**: 모든 API 호출은 try-catch로 감싸야 합니다
4. **타입 검증**: TypeScript 타입을 백엔드 응답과 일치시켜야 합니다

---

## 📂 파일 구조

```
/services/
├── apiEndpoints.ts      # 모든 API 엔드포인트 상수 정의 (24개)
├── userService.ts       # User 도메인 API (6개)
├─ bookService.ts       # Book 도메인 API (7개)
├── commentService.ts    # Comment 도메인 API (2개)
├── orderService.ts      # Order 도메인 API (4개)
├── cartService.ts       # CartItem 도메인 API (5개)
└── README_API.md        # 이 문서

/utils/
└── api.ts              # API 클라이언트 및 토큰 관리
```

---

## 🎉 결론

- **24개 API 엔드포인트 100% 구현 완료**
- **Mock/Real API 자동 전환 시스템**
- **외부 API 호출 부분 명확히 표시 (🔌 이모지)**
- **중앙 집중식 엔드포인트 관리**
- **자동 토큰 관리 및 갱신**
- **완벽한 TypeScript 타입 지원**

환경 변수만 설정하면 바로 백엔드 API와 연동할 수 있습니다! 🚀