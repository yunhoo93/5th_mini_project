import { useState } from 'react';
import { Book } from '../App';
import { X, Heart, Trash2, ShoppingCart, CheckSquare, Square } from 'lucide-react';

interface WishlistDialogProps {
  wishlist: string[];
  books: Book[];
  onClose: () => void;
  onRemoveFromWishlist: (bookId: string) => void;
  onRemoveFromWishlistBulk?: (bookIds: string[]) => void;
  onAddToCart?: (book: Book, quantity: number, silent?: boolean) => boolean;
  onPurchaseBook?: (bookId: string, quantity: number, silent?: boolean) => void;
  isDarkMode?: boolean;
}

export function WishlistDialog({ 
  wishlist, 
  books, 
  onClose, 
  onRemoveFromWishlist,
  onRemoveFromWishlistBulk,
  onAddToCart,
  onPurchaseBook,
  isDarkMode 
}: WishlistDialogProps) {
  // Get unique books from wishlist (no duplicates, quantity always 1)
  const uniqueBookIds = Array.from(new Set(wishlist));
  const wishlistBooks = uniqueBookIds
    .map(bookId => books.find(b => b.id === bookId))
    .filter((book): book is Book => book !== undefined);

  // Store selected books
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());

  // Calculate total price of selected books
  const calculateSelectedTotal = () => {
    let total = 0;
    selectedBooks.forEach((bookId) => {
      const book = books.find(b => b.id === bookId);
      if (book) {
        total += book.price;
      }
    });
    return total;
  };

  // Toggle book selection
  const toggleBookSelection = (bookId: string) => {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(bookId)) {
      newSelected.delete(bookId);
    } else {
      newSelected.add(bookId);
    }
    setSelectedBooks(newSelected);
  };

  // Select/Deselect all
  const toggleSelectAll = () => {
    if (selectedBooks.size === wishlistBooks.length) {
      setSelectedBooks(new Set());
    } else {
      const newSelected = new Set<string>();
      wishlistBooks.forEach(item => {
        newSelected.add(item.id);
      });
      setSelectedBooks(newSelected);
    }
  };

  // Add selected books to cart
  const handleAddToCart = () => {
    if (!onAddToCart || selectedBooks.size === 0) return;
    
    let addedCount = 0;
    let failedCount = 0;
    const successfulBookIds: string[] = [];
    
    selectedBooks.forEach((bookId) => {
      const book = books.find(b => b.id === bookId);
      if (book) {
        const success = onAddToCart(book, 1, true);
        if (success) {
          addedCount++;
        } else {
          failedCount++;
        }
        if (book.stock > 0) {
          // Mark for removal from wishlist
          successfulBookIds.push(bookId);
        }
      }
    });
    
    if (addedCount > 0) {
      alert(`${addedCount}권의 도서를 장바구니에 담았습니다.${failedCount > 0 ? `\n(${failedCount}권은 재고 부족으로 담지 못했습니다)` : ''}`);
      
      if (onRemoveFromWishlistBulk && successfulBookIds.length > 0) {
        onRemoveFromWishlistBulk(successfulBookIds);
      }
      
      setSelectedBooks(new Set());
    } else if (failedCount > 0) {
      alert('재고 부족으로 장바구니에 담을 수 없습니다.');
    }
  };

  // Purchase selected books
  const handlePurchase = () => {
    if (!onPurchaseBook || selectedBooks.size === 0) return;
    
    let purchasedCount = 0;
    const booksToPurchase: string[] = [];
    
    selectedBooks.forEach((bookId) => {
      const book = books.find(b => b.id === bookId);
      if (book) {
        
        if (book.stock >= 1) {
          onPurchaseBook(bookId, 1, true);
          purchasedCount += 1;
          
          booksToPurchase.push(bookId);
        }
      }
    });
    
    if (purchasedCount > 0) {
      alert(`${purchasedCount}권의 도서를 구매했습니다.`);
      
      if (onRemoveFromWishlistBulk) {
        onRemoveFromWishlistBulk(booksToPurchase);
      }
      
      setSelectedBooks(new Set());
    } else {
      alert('재고가 부족하여 구매할 수 없습니다.');
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
      onClick={onClose}
    >
      <div 
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4 flex items-center justify-between z-10`}>
          <h2 className={`${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
            <Heart className="w-6 h-6 text-pink-600 fill-pink-600" />
            찜 목록 ({wishlistBooks.length}권)
          </h2>
          <button
            onClick={onClose}
            className={`p-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
          >
            <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {wishlistBooks.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                찜한 도서가 없습니다.
              </p>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className={`flex items-center justify-between mb-4 p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  {selectedBooks.size === wishlistBooks.length ? (
                    <CheckSquare className="w-5 h-5 text-pink-600" />
                  ) : (
                    <Square className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  )}
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    전체 선택
                  </span>
                </button>
                
                {selectedBooks.size > 0 && (
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {selectedBooks.size}개 도서 선택됨
                  </span>
                )}
              </div>

              {/* Book List */}
              <div className="space-y-3 mb-6">
                {wishlistBooks.map((item) => {
                  const isSelected = selectedBooks.has(item.id);
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-4 ${
                        isDarkMode 
                          ? isSelected ? 'bg-pink-900 bg-opacity-20 border-pink-600' : 'bg-gray-700 border-gray-600'
                          : isSelected ? 'bg-pink-50 border-pink-300' : 'bg-white border-gray-200'
                      } border rounded-lg transition-all`}
                    >
                      <div className="flex gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleBookSelection(item.id)}
                          className="flex-shrink-0 mt-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-pink-600" />
                          ) : (
                            <Square className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                          )}
                        </button>

                        {/* Book Cover */}
                        <img
                          src={item.coverImage}
                          alt={item.title}
                          className="w-20 h-28 object-cover rounded shadow-sm flex-shrink-0"
                        />

                        {/* Book Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1 truncate`}>
                            {item.title}
                          </h3>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                            {item.author}
                          </p>
                          <p className={`${isDarkMode ? 'text-pink-400' : 'text-pink-600'} mb-3`}>
                            {item.price.toLocaleString()}원
                          </p>

                          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                            재고: {item.stock}권
                          </p>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => onRemoveFromWishlist(item.id)}
                          className={`flex-shrink-0 p-2 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'} rounded-lg transition-colors h-fit`}
                        >
                          <Trash2 className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              {selectedBooks.size > 0 && (
                <div className={`sticky bottom-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t pt-4 mt-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        선택한 도서 {selectedBooks.size}권
                      </p>
                      <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        총 {calculateSelectedTotal().toLocaleString()}원
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    {onAddToCart && (
                      <button
                        onClick={handleAddToCart}
                        className="flex-1 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        장바구니 담기
                      </button>
                    )}
                    {onPurchaseBook && (
                      <button
                        onClick={handlePurchase}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        바로 구매하기
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}