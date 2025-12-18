# API 연동 가이드

## 📋 개요

이 프로젝트는 두 가지 모드로 동작합니다:

1. **Mock 모드** (기본값): 로컬 스토리지 기반으로 동작
2. **Real API 모드**: 실제 백엔드 API와 연동

## 🔧 설정 방법

### 1. Mock 모드 (개발/테스트)

`.env` 파일:
```env
VITE_USE_MOCK_API=true
VITE_API_BASE_URL=http://localhost:8000
```

이 모드에서는 모든 데이터가 localStorage에 저장되며, API 호출은 시뮬레이션됩니다.

### 2. Real API 모드 (프로덕션)

`.env` 파일:
```env
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=https://your-backend-api.com
```

이 모드에서는 실제 백엔드 API를 호출합니다.

## 📡 API 명세

### User (회원) API

#### 1. 회원가입
- **Method**: `POST`
- **Endpoint**: `/user/signup`
- **Request Body**:
  ```json
  {
    "id": "string",
    "password": "string",
    "role": "user" | "admin"
  }
  ```

#### 2. 로그인
- **Method**: `POST`
- **Endpoint**: `/user/login`
- **Request Body**:
  ```json
  {
    "id": "string",
    "password": "string"
  }
  ```
- **Response**:
  ```json
  {
    "accessToken": "string",
    "refreshToken": "string",
    "user": {
      "id": "string",
      "role": "user" | "admin"
    }
  }
  ```

#### 3. 로그아웃
- **Method**: `POST`
- **Endpoint**: `/user/logout`
- **Headers**: `Authorization: Bearer {accessToken}`

#### 4. 토큰 재발급
- **Method**: `POST`
- **Endpoint**: `/auth/refresh`
- **Request Body**:
  ```json
  {
    "refreshToken": "string"
  }
  ```

#### 5. 본인 도서 조회
- **Method**: `GET`
- **Endpoint**: `/user/book/{userId}`
- **Headers**: `Authorization: Bearer {accessToken}`

#### 6. 본인 주문 목록 조회
- **Method**: `GET`
- **Endpoint**: `/user/order/{userId}`
- **Headers**: `Authorization: Bearer {accessToken}`

### Book (도서) API

#### 1. 도서 전체 조회
- **Method**: `GET`
- **Endpoint**: `/book`

#### 2. 신규 도서 등록
- **Method**: `POST`
- **Endpoint**: `/book`
- **Headers**: `Authorization: Bearer {accessToken}` (ADMIN only)
- **Request Body**:
  ```json
  {
    "title": "string",
    "author": "string",
    "genre": "string",
    "description": "string",
    "publishedYear": number,
    "price": number,
    "stock": number
  }
  ```

#### 3. 도서 상세정보 조회
- **Method**: `GET`
- **Endpoint**: `/book/{bookId}`

#### 4. 도서 수정
- **Method**: `PUT`
- **Endpoint**: `/book/{bookId}`
- **Headers**: `Authorization: Bearer {accessToken}` (ADMIN only)
- **Request Body**:
  ```json
  {
    "title": "string",
    "author": "string",
    "genre": "string",
    "description": "string",
    "publishedYear": number,
    "price": number
  }
  ```

#### 5. 도서 삭제
- **Method**: `DELETE`
- **Endpoint**: `/book/{bookId}`
- **Headers**: `Authorization: Bearer {accessToken}` (ADMIN only)

#### 6. AI 표지 재생성
- **Method**: `PATCH`
- **Endpoint**: `/book/{bookId}`
- **Headers**: `Authorization: Bearer {accessToken}` (ADMIN only)

#### 7. 도서 재고 업데이트 (ADMIN)
- **Method**: `PUT`
- **Endpoint**: `/book/{bookId}/stock`
- **Headers**: `Authorization: Bearer {accessToken}` (ADMIN only)
- **Request Body**:
  ```json
  {
    "stock": number
  }
  ```

### Comment (댓글/리뷰) API

#### 1. 댓글 등록
- **Method**: `POST`
- **Endpoint**: `/comment/{bookId}`
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:
  ```json
  {
    "comment": "string",
    "rating": number
  }
  ```

#### 2. 댓글 삭제
- **Method**: `DELETE`
- **Endpoint**: `/comment/{commentId}`
- **Headers**: `Authorization: Bearer {accessToken}`

### Order (주문) API

#### 1. 주문 생성
- **Method**: `POST`
- **Endpoint**: `/order`
- **Headers**: `Authorization: Bearer {accessToken}`
- **Request Body**:
  ```json
  {
    "items": [
      {
        "bookId": "string",
        "quantity": number
      }
    ]
  }
  ```

#### 2. 주문 결제 처리
- **Method**: `POST`
- **Endpoint**: `/order/{orderId}/pay`
- **Headers**: `Authorization: Bearer {accessToken}`

#### 3. 주문 취소
- **Method**: `POST`
- **Endpoint**: `/order/{orderId}/cancel`
- **Headers**: `Authorization: Bearer {accessToken}`

#### 4. 주문 상세 조회
- **Method**: `GET`
- **Endpoint**: `/order/{orderId}`
- **Headers**: `Authorization: Bearer {accessToken}`

## 🔐 인증 (Authentication)

### JWT 토큰 관리

1. **로그인 시**: `accessToken`과 `refreshToken`을 받아 localStorage에 저장
2. **API 요청 시**: `Authorization: Bearer {accessToken}` 헤더 추가
3. **토큰 만료 시**: 자동으로 `/auth/refresh`를 호출하여 토큰 갱신
4. **리프레시 실패 시**: 사용자를 로그아웃 처리

### 토큰 저장 위치
- `localStorage.accessToken`: 액세스 토큰
- `localStorage.refreshToken`: 리프레시 토큰

## 🛠️ 코드 사용 예시

### 서비스 import
```typescript
import { userService } from './services/userService';
import { bookService } from './services/bookService';
import { commentService } from './services/commentService';
import { orderService } from './services/orderService';
```

### 로그인
```typescript
try {
  const response = await userService.login({
    id: 'username',
    password: 'password'
  });
  
  console.log('로그인 성공:', response.user);
  // 토큰은 자동으로 저장됨
} catch (error) {
  console.error('로그인 실패:', error.message);
}
```

### 도서 목록 조회
```typescript
try {
  const books = await bookService.getAllBooks();
  console.log('도서 목록:', books);
} catch (error) {
  console.error('조회 실패:', error.message);
}
```

### 주문 생성
```typescript
try {
  const order = await orderService.createOrder({
    items: [
      { bookId: 'book123', quantity: 2 },
      { bookId: 'book456', quantity: 1 }
    ]
  });
  
  console.log('주문 생성:', order);
} catch (error) {
  console.error('주문 실패:', error.message);
}
```

## 🔄 모드 전환

### Mock → Real API로 전환

1. `.env` 파일 수정:
   ```env
   VITE_USE_MOCK_API=false
   VITE_API_BASE_URL=https://your-backend-api.com
   ```

2. 개발 서버 재시작:
   ```bash
   npm run dev
   ```

3. 백엔드 API가 정상 동작하는지 확인

### Real API → Mock으로 전환

1. `.env` 파일 수정:
   ```env
   VITE_USE_MOCK_API=true
   ```

2. 개발 서버 재시작

## 📝 주의사항

1. **CORS 설정**: 백엔드에서 CORS를 허용해야 합니다
2. **토큰 만료 시간**: 백엔드의 토큰 만료 시간과 맞춰야 합니다
3. **에러 처리**: 모든 API 호출은 try-catch로 감싸야 합니다
4. **환경변수**: `.env` 파일은 git에 커밋하지 마세요 (`.env.example`만 커밋)

## 🐛 디버깅

### API 호출 확인
브라우저 개발자 도구 → Network 탭에서 API 호출 확인

### 토큰 확인
```javascript
console.log('Access Token:', localStorage.getItem('accessToken'));
console.log('Refresh Token:', localStorage.getItem('refreshToken'));
```

### 에러 로깅
모든 API 에러는 콘솔에 자동으로 로깅됩니다.

## 📞 지원

API 연동 관련 문제가 있으면:
1. Mock 모드로 전환하여 프론트엔드 로직 확인
2. Network 탭에서 실제 API 응답 확인
3. 백엔드 팀과 API 명세 재확인
