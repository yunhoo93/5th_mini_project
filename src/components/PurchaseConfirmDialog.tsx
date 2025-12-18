import { ShoppingCart, CreditCard } from 'lucide-react';
import { Book } from '../App';

interface PurchaseConfirmDialogProps {
  book: Book;
  quantity: number;
  onAddToCart: () => void;
  onGoToCheckout: () => void;
  onClose: () => void;
  isDarkMode?: boolean;
}

export function PurchaseConfirmDialog({
  book,
  quantity,
  onAddToCart,
  onGoToCheckout,
  onClose,
  isDarkMode = false
}: PurchaseConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className={`relative w-full max-w-md rounded-lg shadow-xl p-6 ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className="text-center mb-6">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            isDarkMode ? 'bg-blue-500/20' : 'bg-blue-50'
          }`}>
            <ShoppingCart className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-xl mb-2">추가 구매하실 도서가 있나요?</h3>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            선택하신 도서: <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{book.title}</span>
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            수량: {quantity}권 / 금액: {(book.price * quantity).toLocaleString()}원
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onGoToCheckout}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            아니오, 바로 결제하기
          </button>
          
          <button
            onClick={onAddToCart}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            예, 장바구니에 담기
          </button>
          
          <button
            onClick={onClose}
            className={`w-full px-6 py-2 text-sm transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
