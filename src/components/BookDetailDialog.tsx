import { useState } from 'react';
import { Book, Rating, Review, User, Purchase } from '../App';
import { X, BookOpen, User as UserIcon, Calendar, Hash, Tag, Star, MessageSquare, Send, Edit2, Trash2, Check, XCircle, Package, Plus, Minus, ShoppingCart, Heart, ThumbsUp, Flag } from 'lucide-react';

interface BookDetailDialogProps {
  book: Book;
  currentUser: User;
  purchases: Purchase[];
  onClose: () => void;
  onUpdateBook: (book: Book) => void;
  onPurchaseBook?: (bookId: string, quantity: number) => void;
  onCancelPurchase?: (purchaseIds: string[]) => void; // 마이페이지에서만 사용
  onAddToCart?: (book: Book, quantity: number) => void;
  onToggleWishlist?: (bookId: string) => void;
  onLikeReview?: (bookId: string, reviewId: string) => void;
  onReportReview?: (bookId: string, reviewId: string, reason: string) => void;
  onToggleReviewHidden?: (bookId: string, reviewId: string) => void;
  isDarkMode?: boolean;
}

export function BookDetailDialog({ book, currentUser, purchases, onClose, onUpdateBook, onPurchaseBook, onCancelPurchase, onAddToCart, onToggleWishlist, onLikeReview, onReportReview, onToggleReviewHidden, isDarkMode }: BookDetailDialogProps) {
  const [reviewText, setReviewText] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewText, setEditingReviewText] = useState('');
  // 수량은 항상 1로 고정
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  // 활동 정지 확인 함수
  const checkSuspensionStatus = () => {
    if (currentUser.suspendedUntil) {
      const suspendedDate = new Date(currentUser.suspendedUntil);
      const now = new Date();
      
      if (suspendedDate > now) {
        const daysLeft = Math.ceil((suspendedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          isSuspended: true,
          daysLeft
        };
      }
    }
    return { isSuspended: false, daysLeft: 0 };
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

  // Calculate average rating
  const calculateAverageRating = () => {
    if (book.ratings.length === 0) return 0;
    const sum = book.ratings.reduce((acc, r) => acc + r.rating, 0);
    return sum / book.ratings.length;
  };

  // Check if current user has already rated
  const userRating = book.ratings.find(r => r.userId === currentUser.id);
  const currentRating = userRating?.rating || 0;

  // Handle rating
  const handleRating = (rating: number) => {
    // 활동 정지 확인
    const { isSuspended, daysLeft } = checkSuspensionStatus();
    if (isSuspended) {
      alert(`활동 정지 상태입니다. 평점을 남길 수 없습니다.\n남은 정지 기간: ${daysLeft}일`);
      return;
    }
    
    const existingRatingIndex = book.ratings.findIndex(r => r.userId === currentUser.id);
    
    let newRatings: Rating[];
    if (existingRatingIndex >= 0) {
      // Update existing rating
      newRatings = [...book.ratings];
      newRatings[existingRatingIndex] = {
        userId: currentUser.id,
        rating,
        timestamp: new Date()
      };
    } else {
      // Add new rating
      newRatings = [
        ...book.ratings,
        {
          userId: currentUser.id,
          rating,
          timestamp: new Date()
        }
      ];
    }

    onUpdateBook({
      ...book,
      ratings: newRatings
    });
  };

  // Handle review submission
  const handleSubmitReview = () => {
    if (!reviewText.trim()) return;

    // 활동 정지 확인
    const { isSuspended, daysLeft } = checkSuspensionStatus();
    if (isSuspended) {
      alert(`활동 정지 상태입니다. 리뷰를 작성할 수 없습니다.\n남은 정지 기간: ${daysLeft}일`);
      return;
    }

    const newReview: Review = {
      id: Date.now().toString(),
      userId: currentUser.id,
      comment: reviewText.trim(),
      timestamp: new Date()
    };

    onUpdateBook({
      ...book,
      reviews: [newReview, ...book.reviews]
    });

    setReviewText('');
  };

  // Handle review editing
  const handleEditReview = (reviewId: string) => {
    const review = book.reviews.find(r => r.id === reviewId);
    if (review) {
      setEditingReviewId(reviewId);
      setEditingReviewText(review.comment);
    }
  };

  // Handle review update
  const handleUpdateReview = (reviewId: string) => {
    if (!editingReviewText.trim()) return;

    const updatedReviews = book.reviews.map(r =>
      r.id === reviewId
        ? { ...r, comment: editingReviewText.trim(), timestamp: new Date() }
        : r
    );

    onUpdateBook({
      ...book,
      reviews: updatedReviews
    });

    setEditingReviewId(null);
    setEditingReviewText('');
  };

  // Handle review deletion
  const handleDeleteReview = (reviewId: string) => {
    if (confirm('이 리뷰를 삭제하시겠습니까?')) {
      onUpdateBook({
        ...book,
        reviews: book.reviews.filter(r => r.id !== reviewId)
      });
    }
  };

  // Cancel review editing
  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditingReviewText('');
  };

  // Handle stock increase (Admin only)
  const handleIncreaseStock = () => {
    if (currentUser.role !== 'admin') return;
    
    onUpdateBook({
      ...book,
      stock: book.stock + 1
    });
  };

  // Handle stock decrease (Admin only)
  const handleDecreaseStock = () => {
    if (currentUser.role !== 'admin') return;
    
    if (book.stock <= 0) {
      alert('재고가 0권입니다.');
      return;
    }
    
    onUpdateBook({
      ...book,
      stock: book.stock - 1
    });
  };

  // Check if user has purchased this book
  const userPurchases = purchases.filter(p => p.bookId === book.id && p.userId === currentUser.id);
  
  // Filter cancellable purchases (ONLY 'pending' status can be cancelled)
  // 'shipped' and 'delivered' status, or purchases without explicit 'pending' status, cannot be cancelled
  const cancellablePurchases = userPurchases.filter(p => p.status === 'pending');
  const hasPurchased = userPurchases.length > 0;

  // Handle purchase
  const handlePurchase = () => {
    if (onPurchaseBook && purchaseQuantity > 0 && book.stock >= purchaseQuantity) {
      onPurchaseBook(book.id, purchaseQuantity);
      // 수량은 항상 1로 고정되므로 리셋 불필요
    } else if (book.stock < purchaseQuantity) {
      alert(`재고가 부족합니다. (현재 재고: ${book.stock}권)`);
    }
  };

  const averageRating = calculateAverageRating();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            도서 상세 정보
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Book Cover */}
            <div className="md:col-span-1">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-full rounded-lg shadow-md"
              />
            </div>

            {/* Book Details */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <h3 className="text-gray-900 mb-2">{book.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-4 h-4" />
                    {book.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {book.publishedYear}년
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {book.genre}
                  </div>
                </div>
              </div>

              {book.isbn && (
                <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                  <Hash className="w-4 h-4" />
                  <span>ISBN: {book.isbn}</span>
                </div>
              )}

              <div className={`mb-4 flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <Hash className="w-4 h-4" />
                <span>가격: {book.price?.toLocaleString()}원</span>
              </div>

              <div className="mb-6">
                <h4 className="text-sm text-gray-700 mb-2">책 소개</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{book.description}</p>
              </div>
            </div>
          </div>

          {/* Centered Ratings and Purchase Section */}
          <div className="space-y-4">
            {/* Average Rating Display */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="text-sm text-gray-700 mb-3 text-center">평균 평점</h4>
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.round(averageRating)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl text-gray-900">
                    {averageRating > 0 ? averageRating.toFixed(1) : '평점 없음'}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({book.ratings.length}명 평가)
                  </span>
                </div>
              </div>
            </div>

            {/* User Rating Section */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm text-gray-700 mb-3 text-center">내 평점</h4>
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || currentRating)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {currentRating > 0 && (
                  <span className="text-sm text-gray-600">
                    {currentRating}점
                  </span>
                )}
              </div>
            </div>

            {/* Purchase Section - For non-admin users */}
            {onPurchaseBook && currentUser.role !== 'admin' && (
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="text-gray-900 mb-4 flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  구매하기
                </h4>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">재고</p>
                    <p className={`text-2xl ${book.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {book.stock}권
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">내 구매</p>
                    <p className="text-2xl text-green-600">{userPurchases.length}권</p>
                  </div>
                </div>

                {/* 수량 조절 */}
                <div className="mb-4 flex items-center justify-center gap-4 p-3 bg-blue-50 rounded-lg">
                  <button
                    onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                    className="p-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-blue-600" />
                  </button>
                  <div className="text-center min-w-[80px]">
                    <p className="text-2xl text-blue-600">{purchaseQuantity}</p>
                    <p className="text-xs text-gray-600">수량</p>
                  </div>
                  <button
                    onClick={() => setPurchaseQuantity(Math.min(book.stock, purchaseQuantity + 1))}
                    disabled={purchaseQuantity >= book.stock}
                    className="p-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* 구매하기 & 장바구니 버튼 */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handlePurchase}
                      disabled={book.stock <= 0 || purchaseQuantity > book.stock}
                      className={`w-full py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        book.stock > 0 && purchaseQuantity <= book.stock
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {book.stock > 0 ? '구매하기' : '재고 없음'}
                    </button>
                    {/* Add to Cart Button */}
                    {onAddToCart && (
                      <button
                        onClick={() => {
                          onAddToCart(book, purchaseQuantity);
                        }}
                        disabled={book.stock <= 0}
                        className={`w-full py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                          book.stock > 0
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart className="w-5 h-5" />
                        장바구니 담기
                      </button>
                    )}
                  </div>

                  {/* Wishlist Button */}
                  {onToggleWishlist && (
                    <button
                      onClick={() => onToggleWishlist(book.id)}
                      className="w-full py-3 rounded-lg transition-colors flex items-center justify-center gap-2 bg-pink-100 text-pink-600 hover:bg-pink-200"
                    >
                      <Heart className="w-5 h-5" />
                      찜하기
                    </button>
                  )}
                </div>

                {hasPurchased && (
                  <p className="text-sm text-green-600 text-center mt-3">
                    ✓ 이미 구매한 도서입니다 ({userPurchases.length}권)
                  </p>
                )}
              </div>
            )}

            {/* Stock Management Section - For admin users */}
            {currentUser.role === 'admin' && (
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <h4 className="text-gray-900 mb-4 flex items-center justify-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  재고 관리
                </h4>

                <div className="flex items-center justify-center gap-6 p-4 bg-purple-50 rounded-lg">
                  <button
                    onClick={handleDecreaseStock}
                    className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={book.stock <= 0}
                  >
                    <Minus className="w-6 h-6" />
                  </button>
                  <div className="text-center min-w-[120px]">
                    <p className="text-4xl text-gray-900">{book.stock}</p>
                    <p className="text-sm text-gray-600 mt-1">현재 재고</p>
                  </div>
                  <button
                    onClick={handleIncreaseStock}
                    className="p-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h4 className="text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              한줄평 ({book.reviews.length})
            </h4>

            {/* Review Input */}
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitReview();
                    }
                  }}
                  placeholder="한줄평을 작성해주세요..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSubmitReview}
                  disabled={!reviewText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  작성
                </button>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-3">
              {book.reviews.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  아직 작성된 한줄평이 없습니다.
                </p>
              ) : (
                book.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">{review.userId}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(review.timestamp)}
                          </p>
                        </div>
                      </div>
                      {review.userId === currentUser.id && editingReviewId !== review.id && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditReview(review.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {editingReviewId === review.id ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={editingReviewText}
                          onChange={(e) => setEditingReviewText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleUpdateReview(review.id);
                            } else if (e.key === 'Escape') {
                              handleCancelEdit();
                            }
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateReview(review.id)}
                          className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-700 mb-3">{review.comment}</p>
                        
                        {/* Like and Report buttons */}
                        <div className="flex items-center gap-3 text-xs">
                          {/* Like button */}
                          {onLikeReview && (
                            <button
                              onClick={() => onLikeReview(book.id, review.id)}
                              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                                review.likes?.includes(currentUser.id)
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              <ThumbsUp className={`w-3 h-3 ${review.likes?.includes(currentUser.id) ? 'fill-current' : ''}`} />
                              <span>도움됨 {review.likes?.length || 0}</span>
                            </button>
                          )}
                          
                          {/* Report button - Only for non-admin users, cannot report own comment or admin comments */}
                          {onReportReview && 
                           currentUser.role !== 'admin' && 
                           review.userId !== currentUser.id && 
                           review.userId !== 'ADMIN' && (
                            <button
                              onClick={() => {
                                const reason = prompt('신고 사유를 입력해주세요:');
                                if (reason && reason.trim()) {
                                  onReportReview(book.id, review.id, reason.trim());
                                }
                              }}
                              disabled={review.reports?.some(r => r.userId === currentUser.id)}
                              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                                review.reports?.some(r => r.userId === currentUser.id)
                                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-100 text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <Flag className="w-3 h-3" />
                              <span>{review.reports?.some(r => r.userId === currentUser.id) ? '신고됨' : '신고'}</span>
                            </button>
                          )}
                          
                          {/* Admin: Hide/Show button */}
                          {onToggleReviewHidden && currentUser.role === 'admin' && (
                            <button
                              onClick={() => onToggleReviewHidden(book.id, review.id)}
                              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                                review.isHidden
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              <Flag className="w-3 h-3" />
                              <span>{review.isHidden ? '숨김 해제' : '숨기기'}</span>
                              {review.reports && review.reports.length > 0 && (
                                <span className="text-xs">({review.reports.length})</span>
                              )}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}