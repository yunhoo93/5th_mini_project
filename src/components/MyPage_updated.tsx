import { useState, useEffect } from 'react';
import { User, Book, Purchase } from '../App';
import { X, Key, BookOpen, Edit2, Trash2, CheckCircle, AlertCircle, Package, Calendar, ShoppingCart, Plus, Minus, Search, ArrowUpDown, ChevronDown, ChevronUp, Star, Clock, BookMarked, FileText, Hash, Building2, Users, Mail, UserX, User as UserIcon, TrendingUp, XCircle, DollarSign, ShieldAlert, MessageSquare, Truck } from 'lucide-react';
import { OrderDetailDialog } from './OrderDetailDialog';

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
  onPurchaseUpdate?: () => void;
  isDarkMode?: boolean;
}

type TabType = 'profile' | 'purchases' | 'books' | 'users' | 'requests';
type SortField = 'title' | 'author' | 'genre' | 'stock' | 'year' | 'price';
type SortDirection = 'asc' | 'desc';

export function MyPage({ user, books, purchases, allBooks, users, onClose, onPasswordChange, onEditBook, onDeleteBook, onUpdateBook, onUpdateUser, onDeleteUser, onCancelPurchase, onReturnPurchase, onPurchaseUpdate, isDarkMode }: MyPageProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  
  // User profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState<User>(user);
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Inventory management states (for admin "도서 관리" tab)
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventorySortBy, setInventorySortBy] = useState<SortField>('stock');
  const [inventorySortDirection, setInventorySortDirection] = useState<SortDirection>('asc');
  const [inventoryShowLowStockOnly, setInventoryShowLowStockOnly] = useState(false);
  const [inventoryExpandedBookIds, setInventoryExpandedBookIds] = useState<Set<string>>(new Set());
  const [reviewExpandedBookIds, setReviewExpandedBookIds] = useState<Set<string>>(new Set());
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<string>('');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPriceValue, setTempPriceValue] = useState<string>('');
  const [selectedBuyer, setSelectedBuyer] = useState<{ userId: string; bookId: string } | null>(null);
  
  // Order detail dialog state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (currentPassword !== user.password) {
      setPasswordError('현재 비밀번호가 일치하지 않습니다.');
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

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return '날짜 정보 없음';
      }
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      return '날짜 정보 없음';
    }
  };

  // Get user's purchases - 취소된 구매 제외
  const userPurchases = purchases.filter(p => p.userId === user.id && p.status !== 'cancelled');
  
  // Get user's orders from localStorage (Mock API)
  const [userOrders, setUserOrders] = useState<any[]>([]);
  
  const loadOrders = () => {
    try {
      const ordersData = JSON.parse(localStorage.getItem(`orders_${user.id}`) || '[]');
      console.log('Loaded orders for user:', user.id, ordersData); // 디버깅용
      if (!Array.isArray(ordersData)) {
        console.warn('Orders data is not an array, resetting to empty array');
        setUserOrders([]);
        return;
      }
      setUserOrders(ordersData.sort((a: any, b: any) => {
        try {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } catch (e) {
          return 0;
        }
      }));
    } catch (error) {
      console.error('Error loading orders:', error);
      setUserOrders([]);
    }
  };
  
  useEffect(() => {
    loadOrders();
  }, [user.id]);

  // Group purchases by bookId and get quantity
  const groupedPurchases = userPurchases.reduce((acc, purchase) => {
    try {
      if (!purchase || !purchase.bookId) return acc;
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
    } catch (e) {
      console.error('Error processing purchase:', purchase, e);
    }
    return acc;
  }, {} as Record<string, { bookId: string; quantity: number; latestPurchaseDate: Date }>);

  // Get purchased books with details and quantity
  const purchasedBooksDetails = (() => {
    try {
      if (!allBooks || !Array.isArray(allBooks)) {
        console.warn('allBooks is not available for purchasedBooksDetails');
        return [];
      }
      return Object.values(groupedPurchases).map(({ bookId, quantity, latestPurchaseDate }) => {
        try {
          const book = allBooks.find(b => b.id === bookId);
          return {
            book,
            quantity,
            latestPurchaseDate
          };
        } catch (e) {
          console.error('Error mapping book details:', bookId, e);
          return { book: undefined, quantity: 0, latestPurchaseDate: new Date() };
        }
      }).filter(item => item.book !== undefined)
        .sort((a, b) => {
          try {
            return new Date(b.latestPurchaseDate).getTime() - new Date(a.latestPurchaseDate).getTime();
          } catch (e) {
            return 0;
          }
        });
    } catch (e) {
      console.error('Error in purchasedBooksDetails:', e);
      return [];
    }
  })();

  // Calculate unique book types sold (for admin)
  const uniqueBooksSold = user.role === 'admin' 
    ? new Set(purchases?.map(p => p.bookId) || []).size 
    : 0;

  // Group admin sales by bookId for recent sales section
  const groupedSales = user.role === 'admin' && purchases && Array.isArray(purchases) ? purchases.reduce((acc, purchase) => {
    try {
      if (!purchase || !purchase.bookId) return acc;
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
    } catch (e) {
      console.error('Error in groupedSales:', e);
    }
    return acc;
  }, {} as Record<string, { bookId: string; count: number; latestPurchaseDate: Date; buyerCounts: Map<string, number> }>) : {};

  // Inventory Tab: Calculate purchase stats for each book
  const getBooksWithStats = () => {
    if (!allBooks || !Array.isArray(allBooks)) {
      console.error('allBooks is not an array:', allBooks);
      return [];
    }
    if (!purchases || !Array.isArray(purchases)) {
      console.error('purchases is not an array:', purchases);
      return allBooks.map(book => ({ ...book, totalPurchased: 0 }));
    }
    
    try {
      return allBooks.map(book => {
        try {
          const bookPurchases = purchases.filter(p => p && p.bookId === book.id);
          const totalPurchased = bookPurchases.length;
          
          return {
            ...book,
            totalPurchased
          };
        } catch (e) {
          console.error('Error processing book stats:', book.id, e);
          return { ...book, totalPurchased: 0 };
        }
      });
    } catch (e) {
      console.error('Error in getBooksWithStats:', e);
      return [];
    }
  };

  // Inventory Tab: Filter books
  const inventoryFilteredBooks = (() => {
    try {
      return getBooksWithStats()
        .filter(book => {
          try {
            const query = inventorySearchQuery.toLowerCase();
            const matchesSearch = (
              book.title.toLowerCase().includes(query) ||
              book.author.toLowerCase().includes(query) ||
              book.genre.toLowerCase().includes(query)
            );
            const matchesStockFilter = !inventoryShowLowStockOnly || book.stock <= 3;
            return matchesSearch && matchesStockFilter;
          } catch (e) {
            console.error('Error filtering book:', book.id, e);
            return false;
          }
        });
    } catch (e) {
      console.error('Error in inventoryFilteredBooks:', e);
      return [];
    }
  })();

  // Inventory Tab: Sort books
  const inventorySortedBooks = (() => {
    try {
      return [...inventoryFilteredBooks].sort((a, b) => {
        try {
          let aValue: any = a[inventorySortBy] || '';
          let bValue: any = b[inventorySortBy] || '';

          if (inventorySortBy === 'year') {
            aValue = a.publishedYear;
            bValue = b.publishedYear;
          }

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return inventorySortDirection === 'asc' ? aValue - bValue : bValue - aValue;
          } else {
            const comparison = String(aValue).localeCompare(String(bValue));
            return inventorySortDirection === 'asc' ? comparison : -comparison;
          }
        } catch (e) {
          return 0;
        }
      });
    } catch (e) {
      console.error('Error in inventorySortedBooks:', e);
      return [];
    }
  })();

  // Inventory Tab: Calculate overall statistics
  const totalBooks = allBooks?.length || 0;
  const totalStock = allBooks?.reduce((sum, book) => sum + (book.stock || 0), 0) || 0;
  const totalPurchased = purchases?.length || 0;
  const booksInStock = allBooks?.filter(book => book.stock > 0).length || 0;
  const booksOutOfStock = allBooks?.filter(book => book.stock === 0).length || 0;
  const lowStockBooks = allBooks?.filter(book => book.stock > 0 && book.stock <= 3).length || 0;

  // Get stock status color
  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'text-red-600';
    if (stock <= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Toggle book expand (for inventory tab)
  const toggleInventoryBookExpand = (bookId: string) => {
    setInventoryExpandedBookIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookId)) {
        newSet.delete(bookId);
      } else {
        newSet.add(bookId);
      }
      return newSet;
    });
  };

  // Toggle review expand (for inventory tab)
  const toggleReviewExpand = (bookId: string) => {
    setReviewExpandedBookIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookId)) {
        newSet.delete(bookId);
      } else {
        newSet.add(bookId);
      }
      return newSet;
    });
  };

  // Tab configuration
  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'profile', label: '내 정보', icon: UserIcon },
    ...(user.role === 'admin' ? [{ id: 'requests' as TabType, label: '요청 관리', icon: FileText }] : [{ id: 'purchases' as TabType, label: '구매 내역', icon: ShoppingCart }]),
    ...(user.role === 'admin' ? [{ id: 'books' as TabType, label: '도서 관리', icon: BookOpen }] : [{ id: 'requests' as TabType, label: '요청 내역', icon: FileText }]),
    ...(user.role === 'admin' ? [{ id: 'users' as TabType, label: '회원 관리', icon: Users }] : [])
  ];

  // Render Profile Tab Content
  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* User Info Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>회원 정보</h3>
          {!isEditingProfile && (
            <button
              onClick={() => {
                setIsEditingProfile(true);
                setEditedUser(user);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              수정
            </button>
          )}
        </div>
        
        <div className={`space-y-4 p-4 rounded-lg transition-colors ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                아이디
              </label>
              <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {user.id}
              </p>
            </div>
            
            <div>
              <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                권한
              </label>
              <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {user.role === 'admin' ? '관리자' : '일반 회원'}
              </p>
            </div>
          </div>

          {isEditingProfile ? (
            <>
              {/* Editing Mode */}
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  이름
                </label>
                <input
                  type="text"
                  value={editedUser.name || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                      : 'border-gray-300'
                  }`}
                  placeholder="이름 입력"
                />
              </div>

              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Mail className="w-3 h-3 inline mr-1" />
                  이메일
                </label>
                <input
                  type="email"
                  value={editedUser.email || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                      : 'border-gray-300'
                  }`}
                  placeholder="이메일 입력"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    성별
                  </label>
                  <select
                    value={editedUser.gender || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, gender: e.target.value as 'male' | 'female' })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'border-gray-300'
                    }`}
                  >
                    <option value="">선택</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={editedUser.phone || ''}
                    onChange={(e) => setEditedUser({ ...editedUser, phone: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'border-gray-300'
                    }`}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  우편번호
                </label>
                <input
                  type="text"
                  value={editedUser.zipCode || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, zipCode: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                      : 'border-gray-300'
                  }`}
                  placeholder="우편번호"
                />
              </div>

              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  주소
                </label>
                <input
                  type="text"
                  value={editedUser.address || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, address: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                      : 'border-gray-300'
                  }`}
                  placeholder="주소"
                />
              </div>

              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  상세주소
                </label>
                <input
                  type="text"
                  value={editedUser.detailAddress || ''}
                  onChange={(e) => setEditedUser({ ...editedUser, detailAddress: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                      : 'border-gray-300'
                  }`}
                  placeholder="상세주소"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    onUpdateUser(editedUser);
                    setIsEditingProfile(false);
                    alert('회원 정보가 수정되었습니다.');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={() => {
                    setIsEditingProfile(false);
                    setEditedUser(user);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-600 text-white hover:bg-gray-500' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  취소
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Display Mode */}
              {user.name && (
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    이름
                  </label>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.name}
                  </p>
                </div>
              )}

              {user.email && (
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Mail className="w-3 h-3 inline mr-1" />
                    이메일
                  </label>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.email}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {user.gender && (
                  <div>
                    <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      성별
                    </label>
                    <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.gender === 'male' ? '남성' : '여성'}
                    </p>
                  </div>
                )}

                {user.phone && (
                  <div>
                    <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      전화번호
                    </label>
                    <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {user.phone}
                    </p>
                  </div>
                )}
              </div>

              {user.address && (
                <div>
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    주소
                  </label>
                  <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.zipCode && `[${user.zipCode}] `}
                    {user.address}
                    {user.detailAddress && ` ${user.detailAddress}`}
                  </p>
                </div>
              )}

              {!user.name && !user.email && !user.phone && !user.address && (
                <div className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p className="text-sm">추가 회원 정보가 등록되지 않았습니다.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Password Change Section */}
      <div>
        <h3 className={`text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>비밀번호 변경</h3>
        
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
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
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
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
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
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                isDarkMode 
                  ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                  : 'border-gray-300'
              }`}
              required
            />
          </div>

          {passwordError && (
            <div className={`flex items-center gap-2 text-red-600 text-sm p-3 rounded-lg ${
              isDarkMode ? 'bg-red-900/30' : 'bg-red-50'
            }`}>
              <AlertCircle className="w-4 h-4" />
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className={`flex items-center gap-2 text-green-600 text-sm p-3 rounded-lg ${
              isDarkMode ? 'bg-green-900/30' : 'bg-green-50'
            }`}>
              <CheckCircle className="w-4 h-4" />
              비밀번호가 성공적으로 변경되었습니다.
            </div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            변경하기
          </button>
        </form>
      </div>
    </div>
  );

  // Render Purchases Tab Content
  const renderPurchasesTab = () => {
    // 안전성 체크
    if (!userOrders || !Array.isArray(userOrders)) {
      console.error('userOrders is undefined or not an array:', userOrders);
      return (
        <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>데이터를 불러오는 중입니다...</p>
        </div>
      );
    }

    if (!allBooks || !Array.isArray(allBooks)) {
      console.error('allBooks is undefined or not an array in renderPurchasesTab:', allBooks);
      return (
        <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>도서 데이터를 불러오는 중입니다...</p>
        </div>
      );
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
        case 'paid': return isDarkMode ? 'text-green-400' : 'text-green-600';
        case 'shipped': return isDarkMode ? 'text-blue-400' : 'text-blue-600';
        case 'delivered': return isDarkMode ? 'text-purple-400' : 'text-purple-600';
        case 'cancelled': return isDarkMode ? 'text-red-400' : 'text-red-600';
        default: return isDarkMode ? 'text-gray-400' : 'text-gray-600';
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'pending': return '결제 대기';
        case 'paid': return '결제 완료';
        case 'shipped': return '배송 중';
        case 'delivered': return '배송 완료';
        case 'cancelled': return '주문 취소';
        default: return status;
      }
    };

    return (
      <div className="space-y-8">
        {/* Order History Section */}
        <div>
          <h3 className={`text-lg mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <FileText className="w-5 h-5" />
            주문 내역 ({userOrders.length}건)
          </h3>

          {userOrders.length === 0 ? (
            <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <Package className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>주문 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userOrders.map((order: any) => (
                <div
                  key={order.orderId}
                  onClick={() => setSelectedOrderId(order.orderId)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 hover:border-blue-500 hover:shadow-lg' 
                      : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-lg'
                  }`}

                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          주문번호
                        </p>
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {order.orderId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                        {order.status === 'pending' && <Clock className="w-3 h-3" />}
                        {order.status === 'paid' && <CheckCircle className="w-3 h-3" />}
                        {order.status === 'shipped' && <Truck className="w-3 h-3" />}
                        {order.status === 'delivered' && <Package className="w-3 h-3" />}
                        {order.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>총 결제금액</p>
                      <p className="text-blue-600">
                        {order.totalAmount.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                  <div className={`mt-2 pt-2 border-t text-xs ${isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                    <p>총 {order.items?.length || 0}개 상품 • 클릭하여 상세 정보 보기</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Purchased Books Section */}
        <div>
          <h3 className={`text-lg mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <BookOpen className="w-5 h-5" />
            구매한 도서 ({userPurchases.length}권)
          </h3>

          {!purchasedBooksDetails || purchasedBooksDetails.length === 0 ? (
            <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <Package className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>구매한 도서가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
          {purchasedBooksDetails.map(({ book, quantity, latestPurchaseDate }) => {
            try {
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
                  </div>
                  <div className="flex items-center">
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      구매 완료
                    </div>
                  </div>
                </div>
              </div>
            );
            } catch (e) {
              console.error('Error rendering purchased book:', book?.id, e);
              return null;
            }
          })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Books Tab Content (Admin) - 완전히 새로운 도서 관리 탭
  const renderBooksTab = () => {
    // 안전성 체크
    if (!allBooks || !Array.isArray(allBooks)) {
      console.error('allBooks is not available in renderBooksTab');
      return (
        <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>도서 데이터를 불러오는 중입니다...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
      {/* Statistics Summary */}
      <div className={`py-4 px-4 rounded-lg transition-colors ${
        isDarkMode 
          ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50' 
          : 'bg-gradient-to-r from-purple-50 to-blue-50'
      }`}>
        <div className="grid grid-cols-6 gap-4">
          <div className={`rounded-lg p-3 shadow-sm transition-colors ${
            isDarkMode ? 'bg-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>전체 도서</p>
            </div>
            <p className={`text-2xl text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalBooks}</p>
          </div>
          <div className={`rounded-lg p-3 shadow-sm transition-colors ${
            isDarkMode ? 'bg-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Package className="w-4 h-4 text-green-600" />
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>총 재고</p>
            </div>
            <p className={`text-2xl text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalStock}</p>
          </div>
          <div className={`rounded-lg p-3 shadow-sm transition-colors ${
            isDarkMode ? 'bg-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>판매량</p>
            </div>
            <p className={`text-2xl text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalPurchased}</p>
          </div>
          <div className={`rounded-lg p-3 shadow-sm transition-colors ${
            isDarkMode ? 'bg-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>재고 있음</p>
            </div>
            <p className="text-2xl text-center text-green-600">{booksInStock}</p>
          </div>
          <div className={`rounded-lg p-3 shadow-sm transition-colors ${
            isDarkMode ? 'bg-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>재고 부족</p>
            </div>
            <p className="text-2xl text-center text-yellow-600">{lowStockBooks}</p>
          </div>
          <div className={`rounded-lg p-3 shadow-sm transition-colors ${
            isDarkMode ? 'bg-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-600" />
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>품절</p>
            </div>
            <p className="text-2xl text-center text-red-600">{booksOutOfStock}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`} />
          <input
            type="text"
            value={inventorySearchQuery}
            onChange={(e) => setInventorySearchQuery(e.target.value)}
            placeholder="제목, 저자, 장르로 검색..."
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'border-gray-300'
            }`}
          />
        </div>

        {/* Sort Dropdown */}
        <div className={`flex items-center gap-1 border rounded-lg overflow-hidden transition-colors ${
          isDarkMode ? 'border-gray-600' : 'border-gray-300'
        }`}>
          <select
            value={inventorySortBy}
            onChange={(e) => setInventorySortBy(e.target.value as SortField)}
            className={`pl-3 pr-2 py-2 focus:outline-none text-sm appearance-none cursor-pointer border-none transition-colors ${
              isDarkMode ? 'bg-gray-700 text-white' : 'bg-white'
            }`}
          >
            <option value="title">제목순</option>
            <option value="author">저자순</option>
            <option value="year">출판연도순</option>
            <option value="stock">재고순</option>
            <option value="genre">장르순</option>
            <option value="price">가격순</option>
          </select>
          <button
            onClick={() => setInventorySortDirection(inventorySortDirection === 'asc' ? 'desc' : 'asc')}
            className={`px-2 py-2 transition-colors border-l ${
              isDarkMode 
                ? 'bg-gray-600 hover:bg-gray-500 border-gray-600' 
                : 'bg-gray-50 hover:bg-gray-100 border-gray-300'
            }`}
            title={inventorySortDirection === 'asc' ? '오름차순 (클릭: 내림차순으로 변경)' : '내림차순 (클릭: 오름차순으로 변경)'}
          >
            {inventorySortDirection === 'asc' ? (
              <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            ) : (
              <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            )}
          </button>
        </div>

        {/* Low Stock Only Toggle */}
        <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors border ${
          isDarkMode 
            ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
            : 'bg-gray-50 hover:bg-gray-100 border-gray-300'
        }`}>
          <input
            type="checkbox"
            checked={inventoryShowLowStockOnly}
            onChange={(e) => setInventoryShowLowStockOnly(e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
          />
          <span className={`text-sm whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>재고 부족만</span>
        </label>
      </div>

      {/* Book List */}
      <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
        {inventorySortedBooks.length === 0 ? (
          <div className={`p-8 rounded-lg text-center transition-colors ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <Search className={`w-12 h-12 mx-auto mb-3 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {inventoryShowLowStockOnly && !inventorySearchQuery.trim() 
                ? '재고 부족 도서가 없습니다.'
                : inventoryShowLowStockOnly && inventorySearchQuery.trim()
                ? '검색 조건에 맞는 재고 부족 도서가 없습니다.'
                : '검색 결과가 없습니다.'}
            </p>
            {(inventorySearchQuery.trim() || inventoryShowLowStockOnly) && (
              <button
                onClick={() => {
                  setInventorySearchQuery('');
                  setInventoryShowLowStockOnly(false);
                }}
                className="mt-3 text-sm text-purple-600 hover:underline"
              >
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {inventorySortedBooks.map((book) => {
              const isExpanded = inventoryExpandedBookIds.has(book.id);
              const avgRating = book.ratings.length > 0
                ? book.ratings.reduce((sum, r) => sum + r.rating, 0) / book.ratings.length
                : 0;

              return (
                <div
                  key={book.id}
                  className={`border rounded-lg overflow-hidden hover:shadow-md transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Main Book Info - Clean Simple Layout */}
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Book Cover */}
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-14 h-20 object-cover rounded shadow flex-shrink-0"
                      />
                      
                      {/* Title & Author + Tags */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`mb-0.5 line-clamp-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {book.title}
                        </h4>
                        <p className={`text-xs mb-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {book.author}
                        </p>
                        <div className="flex gap-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            {book.genre}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                            {book.publishedYear}
                          </span>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="flex flex-col items-center justify-center min-w-[90px]">
                        <span className={`text-[10px] mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>가격</span>
                        {editingPriceId === book.id ? (
                          <input
                            type="number"
                            value={tempPriceValue}
                            onChange={(e) => setTempPriceValue(e.target.value)}
                            onBlur={() => {
                              const newPrice = parseInt(tempPriceValue);
                              if (!isNaN(newPrice) && newPrice >= 0 && onUpdateBook) {
                                onUpdateBook({ ...book, price: newPrice });
                              }
                              setEditingPriceId(null);
                              setTempPriceValue('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const newPrice = parseInt(tempPriceValue);
                                if (!isNaN(newPrice) && newPrice >= 0 && onUpdateBook) {
                                  onUpdateBook({ ...book, price: newPrice });
                                }
                                setEditingPriceId(null);
                                setTempPriceValue('');
                              } else if (e.key === 'Escape') {
                                setEditingPriceId(null);
                                setTempPriceValue('');
                              }
                            }}
                            autoFocus
                            className={`px-2 py-1 border rounded text-xs w-full text-right focus:outline-none focus:ring-1 ${
                              isDarkMode 
                                ? 'bg-gray-700 border-green-600 text-green-400 focus:ring-green-500' 
                                : 'bg-white border-green-500 text-green-700 focus:ring-green-500'
                            }`}
                          />
                        ) : (
                          <div
                            onClick={() => {
                              setEditingPriceId(book.id);
                              setTempPriceValue(book.price.toString());
                            }}
                            className={`text-sm font-medium cursor-pointer ${
                              isDarkMode 
                                ? 'text-green-400 hover:text-green-300' 
                                : 'text-green-700 hover:text-green-600'
                            }`}
                            title="클릭하여 수정"
                          >
                            {book.price.toLocaleString()}원
                          </div>
                        )}
                      </div>
                      
                      {/* Stock */}
                      <div className="flex flex-col items-center justify-center min-w-[80px]">
                        <span className={`text-[10px] mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>재고</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              if (book.stock > 0 && onUpdateBook) {
                                onUpdateBook({ ...book, stock: book.stock - 1 });
                              }
                            }}
                            disabled={book.stock <= 0}
                            className={`p-0.5 rounded disabled:opacity-30 ${
                              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            }`}
                            title="-"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          {editingStockId === book.id ? (
                            <input
                              type="number"
                              value={tempStockValue}
                              onChange={(e) => setTempStockValue(e.target.value)}
                              onBlur={() => {
                                const newStock = parseInt(tempStockValue);
                                if (!isNaN(newStock) && newStock >= 0 && onUpdateBook) {
                                  onUpdateBook({ ...book, stock: newStock });
                                }
                                setEditingStockId(null);
                                setTempStockValue('');
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const newStock = parseInt(tempStockValue);
                                  if (!isNaN(newStock) && newStock >= 0 && onUpdateBook) {
                                    onUpdateBook({ ...book, stock: newStock });
                                  }
                                  setEditingStockId(null);
                                  setTempStockValue('');
                                } else if (e.key === 'Escape') {
                                  setEditingStockId(null);
                                  setTempStockValue('');
                                }
                              }}
                              autoFocus
                              className={`px-1 py-0.5 border rounded text-xs w-12 text-center focus:outline-none focus:ring-1 ${
                                isDarkMode ? 'bg-gray-700 border-gray-500 text-white focus:ring-gray-500' : 'bg-white border-gray-400 text-gray-700 focus:ring-gray-500'
                              }`}
                            />
                          ) : (
                            <div
                              onClick={() => {
                                setEditingStockId(book.id);
                                setTempStockValue(book.stock.toString());
                              }}
                              className={`px-2 py-0.5 rounded text-xs font-medium min-w-[2rem] text-center cursor-pointer ${getStockStatusColor(book.stock)}`}
                              title="클릭하여 수정"
                            >
                              {book.stock}
                            </div>
                          )}
                          <button
                            onClick={() => onUpdateBook && onUpdateBook({ ...book, stock: book.stock + 1 })}
                            className={`p-0.5 rounded ${
                              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                            }`}
                            title="+"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Sales */}
                      <div className="flex flex-col items-center justify-center min-w-[60px]">
                        <span className={`text-[10px] mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>판매</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {book.totalPurchased}
                        </span>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-1 items-center border-l pl-3" style={{borderColor: isDarkMode ? '#374151' : '#e5e7eb'}}>
                        <button
                          onClick={() => toggleInventoryBookExpand(book.id)}
                          className={`p-1.5 rounded transition-colors ${
                            isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
                          }`}
                          title={isExpanded ? "접기" : "상세"}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                          onClick={() => {
                            onEditBook(book);
                            onClose();
                          }}
                          className={`p-1.5 rounded transition-colors ${
                            isDarkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-600 hover:bg-blue-50'
                          }`}
                          title="편집"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`"${book.title}"을(를) 삭제하시겠습니까?`)) {
                              onDeleteBook(book.id);
                            }
                          }}
                          className={`p-1.5 rounded transition-colors ${
                            isDarkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-red-50'
                          }`}
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className={`px-4 pb-4 pt-2 border-t transition-colors ${
                      isDarkMode ? 'border-gray-600 bg-gray-750' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <p className={`mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <strong>설명:</strong> {book.description || '없음'}
                          </p>
                          <p className={`mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <Star className="w-3 h-3 inline mr-1" />
                            평점: {avgRating > 0 ? `${avgRating.toFixed(1)} (${book.ratings.length})` : '없음'}
                          </p>
                        </div>
                        <div>
                          <p className={`mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            등록자: {book.createdBy}
                          </p>
                          <p className={`mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            등록일: {formatDate(book.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Reviews Section */}
                      {book.reviews.length > 0 && (
                        <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                          <button
                            onClick={() => toggleReviewExpand(book.id)}
                            className={`w-full text-sm mb-3 flex items-center justify-between hover:opacity-80 transition-opacity ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-blue-500" />
                              리뷰 목록 ({book.reviews.length}개)
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform ${reviewExpandedBookIds.has(book.id) ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {reviewExpandedBookIds.has(book.id) && (
                            <div 
                              className="space-y-2 max-h-64 overflow-x-auto cursor-grab active:cursor-grabbing"
                              style={{
                                overscrollBehavior: 'contain',
                                scrollbarWidth: 'thin'
                              }}
                              onMouseDown={(e) => {
                                const ele = e.currentTarget;
                                const startY = e.pageY;
                                const startScrollTop = ele.scrollTop;
                                
                                const handleMouseMove = (e: MouseEvent) => {
                                  const dy = e.pageY - startY;
                                  ele.scrollTop = startScrollTop - dy;
                                };
                                
                                const handleMouseUp = () => {
                                  document.removeEventListener('mousemove', handleMouseMove);
                                  document.removeEventListener('mouseup', handleMouseUp);
                                };
                                
                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                              }}
                            >
                              {book.reviews.map((review) => (
                                <div
                                  key={review.id}
                                  className={`p-3 rounded-lg text-xs select-none ${
                                    isDarkMode ? 'bg-gray-700' : 'bg-white'
                                  } ${review.isHidden ? 'opacity-50' : ''}`}
                                >
                                  <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {review.userId}
                                      </span>
                                      <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {new Date(review.timestamp).toLocaleDateString('ko-KR')}
                                      </span>
                                      {review.isHidden && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700">
                                          숨김
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px]">
                                      {review.likes && review.likes.length > 0 && (
                                        <span className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                          👍 {review.likes.length}
                                        </span>
                                      )}
                                      {review.reports && review.reports.length > 0 && (
                                        <span className={`${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                                          🚨 신고 {review.reports.length}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {review.comment}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    );
  };

  // Render Requests Tab Content
  const renderRequestsTab = () => {
    if (user.role === 'admin') {
      // 안전성 체크
      if (!allBooks || !Array.isArray(allBooks)) {
        console.error('allBooks is not available in renderRequestsTab');
        return (
          <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <AlertCircle className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>도서 데이터를 불러오는 중입니다...</p>
          </div>
        );
      }

      // Admin: Show all pending book requests with requester info
      const pendingRequests = allBooks.filter(book => book.status === 'pending');

      return (
        <div>
          <h3 className={`text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            도서 요청 관리 ({pendingRequests.length}건)
          </h3>

          {pendingRequests.length === 0 ? (
            <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'
            }`}>
              <FileText className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>요청된 도서가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((book) => {
                const requester = users.find(u => u.id === book.createdBy);
                return (
                  <div
                    key={book.id}
                    className={`rounded-lg border p-4 transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={book.coverImage}
                        alt={book.title}
                        className="w-20 h-28 object-cover rounded shadow-sm"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {book.title}
                            </h4>
                            <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {book.author} · {book.genre}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                              {book.publishedYear}년 · {book.price.toLocaleString()}원
                            </p>
                          </div>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                            대기중
                          </span>
                        </div>
                        
                        {/* Requester Info */}
                        <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div className="flex items-center gap-2 text-sm">
                            <UserIcon className="w-4 h-4" />
                            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                              요청자: {requester?.name || book.createdBy}
                            </span>
                            {requester?.email && (
                              <>
                                <span className={isDarkMode ? 'text-gray-600' : 'text-gray-400'}>·</span>
                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                  {requester.email}
                                </span>
                              </>
                            )}
                            <span className={isDarkMode ? 'text-gray-600' : 'text-gray-400'}>·</span>
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                              {formatDate(book.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {book.description}
                        </p>

                        {/* Action Buttons */}
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => {
                              if (onUpdateBook && confirm(`"${book.title}"을(를) 승인하시겠습니까?`)) {
                                onUpdateBook({ ...book, status: 'approved' });
                              }
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => onEditBook(book)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(book.id, book.title)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            거절
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    } else {
      // User: Show their own book requests
      const myRequests = books.filter(book => book.status === 'pending');

      return (
        <div>
          <h3 className={`text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            도서 요청 내역 ({myRequests.length}건)
          </h3>

          {myRequests.length === 0 ? (
            <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-gray-50'
            }`}>
              <FileText className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>요청한 도서가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((book) => (
                <div
                  key={book.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-20 h-28 object-cover rounded shadow-sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {book.title}
                          </h4>
                          <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {book.author} · {book.genre}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {book.publishedYear}년 · {book.price.toLocaleString()}원
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                          승인 대기중
                        </span>
                      </div>
                      
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                        요청일: {formatDate(book.createdAt)}
                      </div>

                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {book.description}
                      </p>

                      {/* Action Buttons */}
                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => onEditBook(book)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(book.id, book.title)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
  };

  // Render Users Tab Content (Admin)
  const renderUsersTab = () => (
    <div>
      <h3 className={`text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        회원 관리 ({users.length}명)
      </h3>

      <div className="space-y-3">
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
                {u.phone && (
                  <div>
                    <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>전화번호</p>
                    <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{u.phone}</p>
                  </div>
                )}
                {u.gender && (
                  <div>
                    <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>성별</p>
                    <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {u.gender === 'male' ? '남성' : '여성'}
                    </p>
                  </div>
                )}
                {/* Suspension Status */}
                {u.role !== 'admin' && (
                  <div className="col-span-2">
                    <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>활동 정지 상태</p>
                    {u.suspensionUntil && new Date(u.suspensionUntil) > new Date() ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                          정지됨 ({Math.ceil((new Date(u.suspensionUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일 남음)
                        </span>
                        <span className="text-xs text-gray-500">
                          해제일: {new Date(u.suspensionUntil).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                        정상
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {u.id !== user.id && (
                <div className="flex flex-col gap-1">
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => {
                        const currentSuspension = u.suspensionUntil && new Date(u.suspensionUntil) > new Date() 
                          ? new Date(u.suspensionUntil).toISOString().split('T')[0]
                          : '';
                        
                        const days = prompt(
                          u.suspensionUntil && new Date(u.suspensionUntil) > new Date()
                            ? `현재 활동 정지 상태입니다 (${Math.ceil((new Date(u.suspensionUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}일 남음).\n\n정지 일수를 입력하세요 (0 입력 시 즉시 해제):`
                            : '활동 정지 일수를 입력하세요 (0 입력 시 해제):',
                          u.suspensionUntil && new Date(u.suspensionUntil) > new Date()
                            ? Math.ceil((new Date(u.suspensionUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)).toString()
                            : ''
                        );
                        
                        if (days !== null) {
                          const daysNum = parseInt(days);
                          if (isNaN(daysNum) || daysNum < 0) {
                            alert('올바른 숫자를 입력해주세요.');
                            return;
                          }
                          
                          if (daysNum === 0) {
                            // Remove suspension
                            onUpdateUser({ ...u, suspensionUntil: undefined });
                            alert('활동 정지가 해제되었습니다.');
                          } else {
                            // Set suspension
                            const suspensionDate = new Date();
                            suspensionDate.setDate(suspensionDate.getDate() + daysNum);
                            onUpdateUser({ ...u, suspensionUntil: suspensionDate });
                            alert(`${daysNum}일 활동 정지가 설정되었습니다.\n해제일: ${suspensionDate.toLocaleDateString('ko-KR')}`);
                          }
                        }
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        u.suspensionUntil && new Date(u.suspensionUntil) > new Date()
                          ? 'text-green-600'
                          : 'text-orange-600'
                      } ${isDarkMode ? 'hover:bg-gray-600' : u.suspensionUntil && new Date(u.suspensionUntil) > new Date() ? 'hover:bg-green-50' : 'hover:bg-orange-50'}`}
                      title={u.suspensionUntil && new Date(u.suspensionUntil) > new Date() ? '활동 정지 관리' : '활동 정지 설정'}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                  )}
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
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex transition-colors ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Left Sidebar Navigation */}
        <div className={`w-48 border-r flex flex-col transition-colors ${
          isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
        }`}>
          {/* Header */}
          <div className={`p-6 border-b transition-colors ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className={`mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>마이페이지</h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {user.id}님 환영합니다
            </p>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? isDarkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-600 text-white'
                        : isDarkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header with close button */}
          <div className={`px-6 py-4 border-b flex items-center justify-end transition-colors ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
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
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'purchases' && (
              <div>
                {renderPurchasesTab()}
              </div>
            )}
            {activeTab === 'requests' && renderRequestsTab()}
            {activeTab === 'books' && (
              <div>
                {renderBooksTab()}
              </div>
            )}
            {activeTab === 'users' && renderUsersTab()}
          </div>
        </div>
      </div>
      
      {/* Order Detail Dialog */}
      {selectedOrderId && (
        <OrderDetailDialog
          orderId={selectedOrderId}
          onClose={() => {
            setSelectedOrderId(null);
            loadOrders(); // Refresh orders when dialog closes
            if (onPurchaseUpdate) onPurchaseUpdate(); // Refresh purchases
          }}
          allBooks={allBooks}
          isDarkMode={isDarkMode}
          onPurchaseUpdate={onPurchaseUpdate}
        />
      )}
    </div>
  );
}
