import { useState } from 'react';
import { Book } from '../App';
import { X, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';

export interface CartItem {
  book: Book;
  quantity: number;
}

interface CartProps {
  cartItems: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (bookId: string, quantity: number) => void;
  onRemoveItem: (bookId: string) => void;
  onCheckout: () => void;
  isDarkMode?: boolean;
}

export function Cart({ cartItems, onClose, onUpdateQuantity, onRemoveItem, onCheckout, isDarkMode }: CartProps) {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.book.price * item.quantity), 0);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-end z-50"
      onClick={onClose}
    >
      <div 
        className={`fixed top-[65px] right-0 h-[calc(100vh-65px)] w-full max-w-md shadow-2xl flex flex-col transition-colors ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between text-white transition-colors ${
          isDarkMode ? 'bg-blue-700 border-gray-700' : 'bg-blue-600 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6" />
            <div>
              <h2>장바구니</h2>
              <p className="text-sm opacity-90">
                {totalItems}권의 도서
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-blue-800' : 'hover:bg-blue-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className={`w-20 h-20 mb-4 ${
                isDarkMode ? 'text-gray-600' : 'text-gray-300'
              }`} />
              <p className={isDarkMode ? 'text-gray-400 mb-2' : 'text-gray-600 mb-2'}>장바구니가 비어있습니다</p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>도서를 추가해주세요</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.book.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex gap-4">
                    <img
                      src={item.book.coverImage}
                      alt={item.book.title}
                      className="w-16 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className={`mb-1 line-clamp-2 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{item.book.title}</h3>
                      <p className={`text-sm mb-3 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>{item.book.author}</p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                onUpdateQuantity(item.book.id, item.quantity - 1);
                              }
                            }}
                            disabled={item.quantity <= 1}
                            className={`p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              isDarkMode 
                                ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className={`px-3 py-1 border rounded text-sm min-w-[3rem] text-center ${
                            isDarkMode 
                              ? 'bg-blue-900 border-blue-700 text-blue-200' 
                              : 'bg-blue-50 border-blue-200 text-blue-700'
                          }`}>
                            {item.quantity}권
                          </span>
                          <button
                            onClick={() => {
                              if (item.quantity < item.book.stock) {
                                onUpdateQuantity(item.book.id, item.quantity + 1);
                              } else {
                                alert(`최대 재고는 ${item.book.stock}권입니다.`);
                              }
                            }}
                            disabled={item.quantity >= item.book.stock}
                            className={`p-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              isDarkMode 
                                ? 'bg-gray-600 text-gray-200 hover:bg-gray-500' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => onRemoveItem(item.book.id)}
                          className={`p-2 text-red-600 rounded-lg transition-colors ${
                            isDarkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50'
                          }`}
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <p className={`text-xs mt-2 ${
                        isDarkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        재고: {item.book.stock}권
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className={`border-t p-6 transition-colors ${
            isDarkMode 
              ? 'border-gray-700 bg-gray-750' 
              : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="space-y-3 mb-4">
              <div className={`flex justify-between ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <span>총 수량</span>
                <span>{totalItems}권</span>
              </div>
              <div className={`flex justify-between ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <span>총 가격</span>
                <span>{totalPrice.toLocaleString()}원</span>
              </div>
            </div>
            <button
              onClick={onCheckout}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              구매하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}