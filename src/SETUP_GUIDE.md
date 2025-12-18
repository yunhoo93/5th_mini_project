# 🚀 AI 도서 관리 시스템 - 설치 및 실행 가이드

## 📋 시스템 요구사항

- **Node.js**: 18.0 이상
- **npm**: 9.0 이상 (또는 yarn, pnpm)

## 🛠 설치 방법

### 1️⃣ 프로젝트 다운로드

Figma Make에서 현재 코드를 다운로드합니다.

### 2️⃣ 의존성 설치

터미널을 열고 프로젝트 폴더로 이동한 후:

```bash
npm install
```

또는 yarn 사용시:

```bash
yarn install
```

### 3️⃣ 환경 변수 설정 (선택사항)

Supabase 백엔드를 사용하려면:

```bash
cp .env.example .env
```

`.env` 파일을 열고 Supabase 정보 입력:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**참고**: 현재는 프론트엔드만으로 작동합니다 (Mock 데이터 사용). Supabase는 선택사항입니다.

### 4️⃣ 개발 서버 실행

```bash
npm run dev
```

브라우저가 자동으로 열리고 `http://localhost:3000` 에서 앱이 실행됩니다.

## 🔑 테스트 계정

### 관리자

- **아이디**: `ADMIN`
- **비밀번호**: `1234`

### 일반 사용자

- **아이디**: `KT`
- **비밀번호**: `1234`

## 📦 빌드 (프로덕션)

```bash
npm run build
```

빌드된 파일은 `/dist` 폴더에 생성됩니다.

빌드 결과 미리보기:

```bash
npm run preview
```

## 🚨 문제 해결

### 포트가 이미 사용 중인 경우

`vite.config.ts` 파일에서 포트 변경:

```ts
server: {
  port: 3001, // 다른 포트로 변경
  open: true,
}
```

### Node 버전 확인

```bash
node --version
# v18.0.0 이상이어야 함
```

### 캐시 삭제

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

## 🌐 배포

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

1. `npm run build` 실행
2. Netlify 대시보드에서 `/dist` 폴더 업로드

### GitHub Pages

`vite.config.ts`에 base 추가:

```ts
export default defineConfig({
  base: "/repository-name/",
  // ...
});
```

## 📚 주요 기능

✅ **도서 관리**: 100권의 도서 데이터
✅ **AI 이미지 생성**: DALL-E 3 통합
✅ **구매 시스템**: 장바구니, 주문 내역
✅ **리뷰 시스템**: 평점, 댓글, 좋아요
✅ **위시리스트**: 찜하기 기능
✅ **다크모드**: 테마 전환
✅ **권한 관리**: 관리자/일반 사용자

## 🔧 개발 명령어

```bash
npm run dev      # 개발 서버 시작
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 미리보기
npm run lint     # 코드 린트
```

## 📖 추가 문서

- **API 통합 가이드**: [API_INTEGRATION.md](./API_INTEGRATION.md)
- **백엔드 설정**: Supabase 사용시 추가 설정 필요

## 💡 팁

- **핫 리로딩**: 코드 수정시 자동으로 브라우저 새로고침
- **TypeScript**: 타입 에러는 IDE에서 실시간 확인
- **Tailwind CSS**: 클래스 자동완성 지원

---

문제가 발생하면 GitHub Issues에 등록해주세요! 🙏