import { apiClient, USE_MOCK_API } from '../utils/api';
import { BOOK_ENDPOINTS } from './apiEndpoints';

// ============================================
// 📋 타입 정의
// ============================================

/**
 * 신규 도서 등록 요청 데이터 타입
 */
export interface CreateBookRequest {
  title: string;
  author: string;
  genre: string;
  description: string;
  publishedYear: number;
  price: number;
  stock?: number;
}

/**
 * 도서 정보 수정 요청 데이터 타입
 */
export interface UpdateBookRequest {
  title?: string;
  author?: string;
  genre?: string;
  description?: string;
  publishedYear?: number;
  price?: number;
}

/**
 * 도서 재고 업데이트 요청 데이터 타입 (ADMIN 전용)
 */
export interface UpdateStockRequest {
  stock: number;
}

/**
 * 도서 객체 타입
 */
export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  publishedYear: number;
  price: number;
  stock: number;
  coverImage: string;
  createdBy: string;
  createdAt: Date;
  ratings: number[];
  reviews: any[];
  wishlistedBy: string[];
}

// ============================================
// Mock API Implementation (개발용)
// ============================================
// 실제 백엔드 연동 전까지 사용하는 Mock 데이터
// USE_MOCK_API 환경변수로 제어

const mockBookService = {
  /**
   * 도서 전체 조회 - GET /book/all
   */
  getAllBooks: async (): Promise<Book[]> => {
    // TODO: 실제 API 연동 시 제거
    const books = JSON.parse(localStorage.getItem('books') || '[]');
    return books;
  },

  /**
   * 도서 상세정보 조회 - GET /book/{bookId}
   */
  getBookById: async (bookId: string): Promise<Book> => {
    // TODO: 실제 API 연동 시 제거
    const books: Book[] = JSON.parse(localStorage.getItem('books') || '[]');
    const book = books.find((b) => b.id === bookId);
    if (!book) {
      throw new Error('도서를 찾을 수 없습니다.');
    }
    return book;
  },

  /**
   * 신규 도서 등록 - POST /book
   */
  createBook: async (data: CreateBookRequest): Promise<Book> => {
    // TODO: 실제 API 연동 시 제거
    const books: Book[] = JSON.parse(localStorage.getItem('books') || '[]');
    const newBook: Book = {
      id: `book_${Date.now()}`,
      ...data,
      coverImage: `https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop`,
      createdBy: 'current_user',
      createdAt: new Date(),
      ratings: [],
      reviews: [],
      stock: data.stock || 10,
      wishlistedBy: []
    };
    books.push(newBook);
    localStorage.setItem('books', JSON.stringify(books));
    return newBook;
  },

  /**
   * 도서 수정 - PUT /book/{bookId}
   */
  updateBook: async (bookId: string, data: UpdateBookRequest): Promise<Book> => {
    // TODO: 실제 API 연동 시 제거
    const books: Book[] = JSON.parse(localStorage.getItem('books') || '[]');
    const index = books.findIndex((b) => b.id === bookId);
    if (index === -1) {
      throw new Error('도서를 찾을 수 없습니다.');
    }
    books[index] = { ...books[index], ...data };
    localStorage.setItem('books', JSON.stringify(books));
    return books[index];
  },

  /**
   * 도서 삭제 - DELETE /book/{bookId}
   */
  deleteBook: async (bookId: string): Promise<void> => {
    // TODO: 실제 API 연동 시 제거
    const books: Book[] = JSON.parse(localStorage.getItem('books') || '[]');
    const filtered = books.filter((b) => b.id !== bookId);
    localStorage.setItem('books', JSON.stringify(filtered));
  },

  /**
   * AI 표지 재생성 - PATCH /book/{bookId}
   */
  regenerateCover: async (bookId: string): Promise<Book> => {
    // TODO: 실제 API 연동 시 제거
    const books: Book[] = JSON.parse(localStorage.getItem('books') || '[]');
    const index = books.findIndex((b) => b.id === bookId);
    if (index === -1) {
      throw new Error('도서를 찾을 수 없습니다.');
    }
    // Mock: Generate new random cover
    books[index].coverImage = `https://images.unsplash.com/photo-${Date.now()}?w=300&h=400&fit=crop`;
    localStorage.setItem('books', JSON.stringify(books));
    return books[index];
  },

  /**
   * 도서 재고 업데이트 (ADMIN) - PUT /book/{bookId}/stock
   */
  updateStock: async (bookId: string, data: UpdateStockRequest): Promise<Book> => {
    // TODO: 실제 API 연동 시 제거
    const books: Book[] = JSON.parse(localStorage.getItem('books') || '[]');
    const index = books.findIndex((b) => b.id === bookId);
    if (index === -1) {
      throw new Error('도서를 찾을 수 없습니다.');
    }
    books[index].stock = data.stock;
    localStorage.setItem('books', JSON.stringify(books));
    return books[index];
  }
};

// ============================================
// Real API Implementation (실제 백엔드 연동)
// ============================================
// 실제 백엔드 API와 통신하는 부분
// 모든 엔드포인트는 apiEndpoints.ts에서 관리

const realBookService = {
  /**
   * ✅ 도서 전체 조회 - GET /book/all
   */
  getAllBooks: async (): Promise<Book[]> => {
    // 🔌 외부 API 호출 - 백엔드에서 전체 도서 목록 조회
    return await apiClient.get(BOOK_ENDPOINTS.GET_ALL_BOOKS);
  },

  /**
   * ✅ 도서 상세정보 조회 - GET /book/{bookId}
   */
  getBookById: async (bookId: string): Promise<Book> => {
    // 🔌 외부 API 호출 - 백엔드에서 특정 도서의 상세 정보 조회
    return await apiClient.get(BOOK_ENDPOINTS.GET_BOOK_BY_ID(bookId));
  },

  /**
   * ✅ 신규 도서 등록 - POST /book
   */
  createBook: async (data: CreateBookRequest): Promise<Book> => {
    // 🔌 외부 API 호출 - 백엔드에서 새로운 도서 생성 (AI 표지 생성 포함)
    return await apiClient.post(BOOK_ENDPOINTS.CREATE_BOOK, data);
  },

  /**
   * ✅ 도서 수정 - PUT /book/{bookId}
   */
  updateBook: async (bookId: string, data: UpdateBookRequest): Promise<Book> => {
    // 🔌 외부 API 호출 - 백엔드에서 도서 정보 수정
    return await apiClient.put(BOOK_ENDPOINTS.UPDATE_BOOK(bookId), data);
  },

  /**
   * ✅ 도서 삭제 - DELETE /book/{bookId}
   */
  deleteBook: async (bookId: string): Promise<void> => {
    // 🔌 외부 API 호출 - 백엔드에서 도서 삭제
    await apiClient.delete(BOOK_ENDPOINTS.DELETE_BOOK(bookId));
  },

  /**
   * ✅ AI 표지 재생성 - PATCH /book/{bookId}
   */
  regenerateCover: async (bookId: string): Promise<Book> => {
    // 🔌 외부 API 호출 - 백엔드에서 AI를 사용하여 새로운 표지 이미지 생성
    return await apiClient.patch(BOOK_ENDPOINTS.REGENERATE_COVER(bookId));
  },

  /**
   * ✅ 도서 재고 업데이트 (ADMIN) - PUT /book/{bookId}/stock
   */
  updateStock: async (bookId: string, data: UpdateStockRequest): Promise<Book> => {
    // 🔌 외부 API 호출 - 백엔드에서 도서 재고 수량 업데이트 (관리자 전용)
    return await apiClient.put(BOOK_ENDPOINTS.UPDATE_STOCK(bookId), data);
  }
};

// Export based on mode
export const bookService = USE_MOCK_API ? mockBookService : realBookService;
