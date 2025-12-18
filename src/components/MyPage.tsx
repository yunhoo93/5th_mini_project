import { X, Key, BookOpen, Edit2, Trash2, CheckCircle, AlertCircle, Package, Calendar, ShoppingCart, Plus, Minus, Search, ArrowUpDown, ChevronDown, Star, Clock, BookMarked, FileText, Hash, Building2, Users, Mail, UserX, User as UserIcon } from 'lucide-react';

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

type TabType = 'profile' | 'purchases' | 'books' | 'users';

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
  
  // User profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedUser, setEditedUser] = useState<User>(user);
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState<TabType>('profile');

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

  // Tab configuration
  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'profile', label: '내 정보 관리', icon: UserIcon },
    { id: 'purchases', label: '구매 내역', icon: ShoppingCart },
    ...(user.role === 'admin' ? [{ id: 'books' as TabType, label: '도서 관리', icon: BookOpen }] : []),
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
  const renderPurchasesTab = () => (
    <div>
      <h3 className={`text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        구매한 도서 ({userPurchases.length}권)
      </h3>

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
  );

  // Render Books Tab Content (Admin)
  const renderBooksTab = () => (
    <div className="space-y-6">
      {/* Sales Statistics */}
      <div>
        <h3 className={`text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>판매 현황</h3>

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
        <div>
          <h4 className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>최근 판매 내역</h4>
          {purchases.length === 0 ? (
            <div className={`p-8 rounded-lg text-center transition-colors ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <Package className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>판매 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
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
                                  : isDarkMode
                                  ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              }`}
                              title={`${buyer}: ${count}권 구매`}
                            >
                              {buyer}
                              {isSelected && ` (${count}권)`}
                            </button>
                          );
                        })}
                        {uniqueBuyers.length > 10 && (
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
    </div>
  );

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
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex transition-colors ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Left Sidebar Navigation */}
        <div className={`w-64 border-r flex flex-col transition-colors ${
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
            {activeTab === 'purchases' && renderPurchasesTab()}
            {activeTab === 'books' && renderBooksTab()}
            {activeTab === 'users' && renderUsersTab()}
          </div>
        </div>
      </div>
    </div>
  );
}