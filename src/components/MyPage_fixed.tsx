import { useState, useEffect } from 'react';
import { User, Book, Purchase } from '../App';
import { X, Key, BookOpen, Edit2, Trash2, CheckCircle, AlertCircle, Package, Calendar, ShoppingCart, Plus, Minus, Search, ArrowUpDown, ChevronDown, Star, Clock, BookMarked, FileText, Hash, Building2, Users, Mail, UserX } from 'lucide-react';

interface MyPageProps {
  user: User;
  books: Book[];
  purchases: Purchase[];
  allBooks: Book[];
  users: User[];
  onClose: () => void;
  onPasswordChange: (newPassword: string) => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onUpdateBook?: (book: Book) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onCancelPurchase?: (purchaseIds: string[]) => void;
  onReturnPurchase?: (purchaseIds: string[]) => void;
  isDarkMode?: boolean;
}

export function MyPage({ user, books, purchases, allBooks, users, onClose, onPasswordChange, onEditBook, onDeleteBook, onUpdateBook, onUpdateUser, onDeleteUser, onCancelPurchase, onReturnPurchase, isDarkMode }: MyPageProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'author' | 'year' | 'stock'>('stock');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [expandedBookIds, setExpandedBookIds] = useState<Set<string>>(new Set());
  const [selectedBuyer, setSelectedBuyer] = useState<{ userId: string; bookId: string } | null>(null);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<string>('');
  const [sortedBooks, setSortedBooks] = useState<Book[]>([]);

  // Update sorted books only when sort/filter parameters change
  useEffect(() => {
    const filtered = books
      .filter(book => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.genre.toLowerCase().includes(query)
        );
      })
      .filter(book => !showLowStockOnly || book.stock <= 3);

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'author':
          comparison = a.author.localeCompare(b.author);
          break;
        case 'year':
          comparison = a.publishedYear - b.publishedYear;
          break;
        case 'stock':
          comparison = a.stock - b.stock;
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setSortedBooks(sorted);
  }, [books, sortBy, sortOrder, searchQuery, showLowStockOnly]);

  const toggleBookExpand = (bookId: string) => {
    setExpandedBookIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookId)) {
        newSet.delete(bookId);
      } else {
        newSet.add(bookId);
      }
      return newSet;
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (currentPassword !== user.password) {
      setPasswordError('현재 비밀번호가 일치하지 않니다.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('새 비밀번호는 4자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    onPasswordChange(newPassword);
    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setTimeout(() => {
      setPasswordSuccess(false);
    }, 3000);
  };

  const handleDelete = (bookId: string, bookTitle: string) => {
    if (confirm(`"${bookTitle}"을(를) 삭제하시겠습니까?`)) {
      onDeleteBook(bookId);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get user's purchases
  const userPurchases = purchases.filter(p => p.userId === user.id);

  // Group purchases by bookId and get quantity
  const groupedPurchases = userPurchases.reduce((acc, purchase) => {
    if (!acc[purchase.bookId]) {
      acc[purchase.bookId] = {
        bookId: purchase.bookId,
        quantity: 0,
        latestPurchaseDate: purchase.purchaseDate
      };
    }
    acc[purchase.bookId].quantity += 1;
    if (new Date(purchase.purchaseDate) > new Date(acc[purchase.bookId].latestPurchaseDate)) {
      acc[purchase.bookId].latestPurchaseDate = purchase.purchaseDate;
    }
    return acc;
  }, {} as Record<string, { bookId: string; quantity: number; latestPurchaseDate: Date }>);

  // Get purchased books with details and quantity
  const purchasedBooksDetails = Object.values(groupedPurchases).map(({ bookId, quantity, latestPurchaseDate }) => {
    const book = allBooks.find(b => b.id === bookId);
    return {
      book,
      quantity,
      latestPurchaseDate
    };
  }).filter(item => item.book !== undefined)
    .sort((a, b) => new Date(b.latestPurchaseDate).getTime() - new Date(a.latestPurchaseDate).getTime());

  // Calculate unique book types sold (for admin)
  const uniqueBooksSold = user.role === 'admin' 
    ? new Set(purchases.map(p => p.bookId)).size 
    : 0;

  // Group admin sales by bookId for recent sales section
  const groupedSales = user.role === 'admin' ? purchases.reduce((acc, purchase) => {
    if (!acc[purchase.bookId]) {
      acc[purchase.bookId] = {
        bookId: purchase.bookId,
        count: 0,
        latestPurchaseDate: purchase.purchaseDate,
        buyerCounts: new Map<string, number>()
      };
    }
    acc[purchase.bookId].count += 1;
    
    // Count purchases per buyer
    const currentCount = acc[purchase.bookId].buyerCounts.get(purchase.userId) || 0;
    acc[purchase.bookId].buyerCounts.set(purchase.userId, currentCount + 1);
    
    if (new Date(purchase.purchaseDate) > new Date(acc[purchase.bookId].latestPurchaseDate)) {
      acc[purchase.bookId].latestPurchaseDate = purchase.purchaseDate;
    }
    return acc;
  }, {} as Record<string, { bookId: string; count: number; latestPurchaseDate: Date; buyerCounts: Map<string, number> }>) : {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col transition-colors ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between transition-colors ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isDarkMode ? 'bg-indigo-900' : 'bg-indigo-100'
            }`}>
              <BookOpen className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            </div>
            <div>
              <h2 className={isDarkMode ? 'text-white' : 'text-gray-900'}>마이페이지</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {user.role === 'admin' ? '관리자' : '일반 회원'} • {user.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Password Change Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Key className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <h3 className={isDarkMode ? 'text-white' : 'text-gray-900'}>비밀번호 변경</h3>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className={`space-y-4 p-4 rounded-lg transition-colors ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'border-gray-300'
                    }`}
                    required
                  />
                </div>
                
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'border-gray-300'
                    }`}
                    required
                  />
                </div>
                
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'border-gray-300'
                    }`}
                    required
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    비밀번호가 성공적으로 변경되었습니다.
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  비밀번호 변경
                </button>
              </form>
            </div>

            {/* Purchased Books Section - For non-admin users */}
            {user.role !== 'admin' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  <h3 className={isDarkMode ? 'text-white' : 'text-gray-900'}>구매한 도서</h3>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>({userPurchases.length}권)</span>
                </div>

                {purchasedBooksDetails.length === 0 ? (
                  <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <Package className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>구매한 도서가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {purchasedBooksDetails.map(({ book, quantity, latestPurchaseDate }) => {
                      if (!book) return null;
                      
                      // Get purchase IDs for this book
                      const bookPurchaseIds = userPurchases
                        .filter(p => p.bookId === book.id)
                        .map(p => p.id);
                      
                      return (
                        <div
                          key={book.id}
                          className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex gap-4">
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="w-16 h-20 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h4 className={`mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{book.title}</h4>
                              <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{book.author}</p>
                              <div className={`flex items-center gap-4 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  구매일: {formatDate(latestPurchaseDate)}
                                </div>
                                <span>수량: {quantity}권</span>
                                <span className={`${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                  가격: {(book.price * quantity).toLocaleString()}원
                                </span>
                              </div>
                              
                              {/* 구매 취소 & 반품 버튼 */}
                              <div className="flex gap-2 mt-3">
                                {onCancelPurchase && (
                                  <button
                                    onClick={() => {
                                      const count = prompt(`취소할 수량을 입력하세요 (1-${quantity}):`, '1');
                                      if (count) {
                                        const numCount = parseInt(count);
                                        if (numCount > 0 && numCount <= quantity) {
                                          const idsToCancel = bookPurchaseIds.slice(0, numCount);
                                          onCancelPurchase(idsToCancel);
                                        } else {
                                          alert('올바른 수량을 입력해주세요.');
                                        }
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors"
                                  >
                                    구매 취소
                                  </button>
                                )}
                                {onReturnPurchase && (
                                  <button
                                    onClick={() => {
                                      const count = prompt(`반품할 수량을 입력하세요 (1-${quantity}):\n반품 시 10% 수수료가 차감됩니다.`, '1');
                                      if (count) {
                                        const numCount = parseInt(count);
                                        if (numCount > 0 && numCount <= quantity) {
                                          const idsToReturn = bookPurchaseIds.slice(0, numCount);
                                          onReturnPurchase(idsToReturn);
                                        } else {
                                          alert('올바른 수량을 입력해주세요.');
                                        }
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                                  >
                                    반품하기
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center">
                              <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                구매 완료
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Sales Statistics - For admin users */}
            {user.role === 'admin' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  <h3 className={isDarkMode ? 'text-white' : 'text-gray-900'}>판매 현황</h3>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className={`p-4 rounded-lg border transition-colors ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-700' 
                      : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                  }`}>
                    <p className={`text-sm mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>총 판매</p>
                    <p className={`text-2xl ${isDarkMode ? 'text-blue-100' : 'text-blue-900'}`}>{purchases.length}건</p>
                  </div>
                  <div className={`p-4 rounded-lg border transition-colors ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-700' 
                      : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                  }`}>
                    <p className={`text-sm mb-1 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>판매된 책 종류</p>
                    <p className={`text-2xl ${isDarkMode ? 'text-green-100' : 'text-green-900'}`}>{uniqueBooksSold}종</p>
                  </div>
                  <div className={`p-4 rounded-lg border transition-colors ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-purple-900/50 to-purple-800/50 border-purple-700' 
                      : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
                  }`}>
                    <p className={`text-sm mb-1 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>총 재고</p>
                    <p className={`text-2xl ${isDarkMode ? 'text-purple-100' : 'text-purple-900'}`}>
                      {allBooks.reduce((sum, book) => sum + book.stock, 0)}권
                    </p>
                  </div>
                  <div className={`p-4 rounded-lg border transition-colors ${
                    isDarkMode 
                      ? 'bg-gradient-to-br from-orange-900/50 to-orange-800/50 border-orange-700' 
                      : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                  }`}>
                    <p className={`text-sm mb-1 ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>총 재고 종류</p>
                    <p className={`text-2xl ${isDarkMode ? 'text-orange-100' : 'text-orange-900'}`}>{allBooks.length}종</p>
                  </div>
                </div>

                {/* Recent Sales */}
                <div className="mb-4">
                  <h4 className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>최근 판매 내역</h4>
                  {purchases.length === 0 ? (
                    <div className={`p-8 rounded-lg text-center transition-colors ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <Package className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>판매 내역이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {Object.values(groupedSales)
                        .sort((a, b) => new Date(b.latestPurchaseDate).getTime() - new Date(a.latestPurchaseDate).getTime())
                        .slice(0, 10)
                        .map((sale) => {
                          const book = allBooks.find(b => b.id === sale.bookId);
                          if (!book) return null;
                          
                          // Get unique buyers
                          const uniqueBuyers = Array.from(sale.buyerCounts.keys());

                          return (
                            <div
                              key={sale.bookId}
                              className={`border rounded-lg p-3 text-sm transition-colors ${
                                isDarkMode 
                                  ? 'bg-gray-700 border-gray-600' 
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className={`mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{book.title}</p>
                                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    총 판매 수량: {sale.count}건
                                  </p>
                                </div>
                                <div className="text-right ml-3">
                                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {formatDate(sale.latestPurchaseDate)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {uniqueBuyers.slice(0, 10).map((buyer) => {
                                  const count = sale.buyerCounts.get(buyer) || 0;
                                  const isSelected = selectedBuyer?.userId === buyer && selectedBuyer?.bookId === sale.bookId;
                                  
                                  return (
                                    <button
                                      key={buyer}
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedBuyer(null);
                                        } else {
                                          setSelectedBuyer({ userId: buyer, bookId: sale.bookId });
                                        }
                                      }}
                                      className={`px-2 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                                        isSelected 
                                          ? 'bg-blue-600 text-white' 
                                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                      }`}
                                      title={`${buyer}: ${count}권 구매`}
                                    >
                                      {buyer}
                                      {isSelected && ` (${count}권)`}
                                    </button>
                                  );
                                })}{uniqueBuyers.length > 10 && (
                                  <span className={`px-2 py-0.5 rounded text-xs ${
                                    isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    +{uniqueBuyers.length - 10}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* User Management Section - For admin users */}
            {user.role === 'admin' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h3 className={isDarkMode ? 'text-white' : 'text-gray-900'}>회원 관리</h3>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>({users.length}명)</span>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* User Info */}
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div>
                            <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>아이디</p>
                            <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{u.id}</p>
                          </div>
                          <div>
                            <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>권한</p>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              u.role === 'admin' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {u.role === 'admin' ? '관리자' : '일반 회원'}
                            </span>
                          </div>
                          {u.email && (
                            <div>
                              <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>이메일</p>
                              <div className="flex items-center gap-1">
                                <Mail className={`w-3 h-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{u.email}</p>
                              </div>
                            </div>
                          )}
                          {u.name && (
                            <div>
                              <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>이름</p>
                              <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{u.name}</p>
                            </div>
                          )}
                          {u.gender && (
                            <div>
                              <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>성별</p>
                              <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {u.gender === 'male' ? '남성' : u.gender === 'female' ? '여성' : '기타'}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>비밀번호</p>
                            <p className={`text-sm font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{u.password}</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {u.id !== user.id && (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => {
                                const newPassword = prompt('새 비밀번호를 입력하세요 (4자 이상):', u.password);
                                if (newPassword && newPassword.length >= 4) {
                                  onUpdateUser({ ...u, password: newPassword });
                                } else if (newPassword) {
                                  alert('비밀번호는 4자 이상이어야 합니다.');
                                }
                              }}
                              className={`p-1.5 text-blue-600 rounded transition-colors ${
                                isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-blue-50'
                              }`}
                              title="비밀번호 변경"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`"${u.id}" 계정을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
                                  onDeleteUser(u.id);
                                }
                              }}
                              className={`p-1.5 text-red-600 rounded transition-colors ${
                                isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-red-50'
                              }`}
                              title="계정 삭제"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Managed Books Section - Only for regular users */}
            {user.role !== 'admin' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className={isDarkMode ? 'text-white' : 'text-gray-900'}>내가 등록한 도서</h3>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>({books.length}권)</span>
                </div>

                {books.length === 0 ? (
                  <div className={`p-8 rounded-lg text-center transition-colors ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <BookOpen className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>등록한 도서가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {books.map((book) => {
                      const avgRating = book.ratings.length > 0
                        ? book.ratings.reduce((sum, r) => sum + r.rating, 0) / book.ratings.length
                        : 0;

                      return (
                        <div
                          key={book.id}
                          className={`border rounded-lg p-4 hover:shadow-md transition-all ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Book Cover */}
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0"
                            />
                            
                            {/* Title */}
                            <div className="flex-1">
                              <h4 className={`text-sm line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{book.title}</h4>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{book.author}</p>
                            </div>
                            
                            {/* Genre */}
                            <span className={`px-2 py-1 rounded text-xs ${
                              isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {book.genre}
                            </span>
                            
                            {/* Stock */}
                            <div className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              <Package className="w-3 h-3" />
                              <span>{book.stock}권</span>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => onEditBook(book)}
                                className={`p-1.5 text-blue-600 rounded transition-colors ${
                                  isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-blue-50'
                                }`}
                                title="편집"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(book.id, book.title)}
                                className={`p-1.5 text-red-600 rounded transition-colors ${
                                  isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-red-50'
                                }`}
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
