import { apiClient, USE_MOCK_API } from '../utils/api';
import { CARTITEM_ENDPOINTS } from './apiEndpoints';

// ============================================
// 📋 타입 정의
// ============================================

/**
 * 장바구니에 담기 요청 데이터 타입
 */
export interface AddToCartRequest {
  bookId: string;
  quantity: number;
}

/**
 * 장바구니 수량 변경 요청 데이터 타입
 */
export interface UpdateCartItemRequest {
  quantity: number;
}

/**
 * 장바구니 항목 객체 타입
 */
export interface CartItem {
  id: string;
  bookId: string;
  quantity: number;
  userId: string;
  createdAt: Date;
}

// ============================================
// Mock API Implementation (개발용)
// ============================================
// 실제 백엔드 연동 전까지 사용하는 Mock 데이터
// USE_MOCK_API 환경변수로 제어

const mockCartService = {
  /**
   * 장바구니에 담기 - POST /cart
   */
  addToCart: async (data: AddToCartRequest): Promise<CartItem> => {
    // TODO: 실제 API 연동 시 제거
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const cart: CartItem[] = JSON.parse(localStorage.getItem(`cart_${currentUser.id}`) || '[]');
    
    // Check if item already exists
    const existingItem = cart.find(item => item.bookId === data.bookId);
    
    if (existingItem) {
      // Update quantity
      existingItem.quantity += data.quantity;
      localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
      return existingItem;
    } else {
      // Add new item
      const newItem: CartItem = {
        id: `cart_${Date.now()}`,
        bookId: data.bookId,
        quantity: data.quantity,
        userId: currentUser.id,
        createdAt: new Date()
      };
      cart.push(newItem);
      localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
      return newItem;
    }
  },

  /**
   * 장바구니 조회 - GET /cart
   */
  getCart: async (): Promise<CartItem[]> => {
    // TODO: 실제 API 연동 시 제거
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const cart = JSON.parse(localStorage.getItem(`cart_${currentUser.id}`) || '[]');
    return cart;
  },

  /**
   * 장바구니에서 수량 변경 - PATCH /cart/{cartItemId}
   */
  updateCartItem: async (cartItemId: string, data: UpdateCartItemRequest): Promise<CartItem> => {
    // TODO: 실제 API 연동 시 제거
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const cart: CartItem[] = JSON.parse(localStorage.getItem(`cart_${currentUser.id}`) || '[]');
    
    const itemIndex = cart.findIndex(item => item.id === cartItemId);
    if (itemIndex === -1) {
      throw new Error('장바구니 항목을 찾을 수 없습니다.');
    }
    
    cart[itemIndex].quantity = data.quantity;
    localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cart));
    return cart[itemIndex];
  },

  /**
   * 항목 삭제 - DELETE /cart/{cartItemId}
   */
  deleteCartItem: async (cartItemId: string): Promise<void> => {
    // TODO: 실제 API 연동 시 제거
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const cart: CartItem[] = JSON.parse(localStorage.getItem(`cart_${currentUser.id}`) || '[]');
    
    const filtered = cart.filter(item => item.id !== cartItemId);
    localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(filtered));
  },

  /**
   * 전체 삭제 - DELETE /cart
   */
  clearCart: async (): Promise<void> => {
    // TODO: 실제 API 연동 시 제거
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify([]));
  }
};

// ============================================
// Real API Implementation (실제 백엔드 연동)
// ============================================
// 실제 백엔드 API와 통신하는 부분
// 모든 엔드포인트는 apiEndpoints.ts에서 관리

const realCartService = {
  /**
   * ✅ 장바구니에 담기 - POST /cart
   */
  addToCart: async (data: AddToCartRequest): Promise<CartItem> => {
    // 🔌 외부 API 호출 - 백엔드에서 장바구니에 도서 추가
    return await apiClient.post(CARTITEM_ENDPOINTS.ADD_TO_CART, data);
  },

  /**
   * ✅ 장바구니 조회 - GET /cart
   */
  getCart: async (): Promise<CartItem[]> => {
    // 🔌 외부 API 호출 - 백엔드에서 현재 사용자의 장바구니 목록 조회
    return await apiClient.get(CARTITEM_ENDPOINTS.GET_CART);
  },

  /**
   * ✅ 장바구니에서 수량 변경 - PATCH /cart/{cartItemId}
   */
  updateCartItem: async (cartItemId: string, data: UpdateCartItemRequest): Promise<CartItem> => {
    // 🔌 외부 API 호출 - 백엔드에서 장바구니 항목의 수량 변경
    return await apiClient.patch(CARTITEM_ENDPOINTS.UPDATE_CART_ITEM(cartItemId), data);
  },

  /**
   * ✅ 항목 삭제 - DELETE /cart/{cartItemId}
   */
  deleteCartItem: async (cartItemId: string): Promise<void> => {
    // 🔌 외부 API 호출 - 백엔드에서 장바구니 항목 삭제
    await apiClient.delete(CARTITEM_ENDPOINTS.DELETE_CART_ITEM(cartItemId));
  },

  /**
   * ✅ 전체 삭제 - DELETE /cart
   */
  clearCart: async (): Promise<void> => {
    // 🔌 외부 API 호출 - 백엔드에서 장바구니 전체 비우기
    await apiClient.delete(CARTITEM_ENDPOINTS.CLEAR_CART);
  }
};

// Export based on mode
export const cartService = USE_MOCK_API ? mockCartService : realCartService;
