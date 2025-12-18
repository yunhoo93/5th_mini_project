import { useState, useEffect } from 'react';
import { Book, Purchase } from '../App';
import { X, Search, Package, BookOpen, TrendingUp, ChevronUp, ChevronDown, Plus, Minus, Edit2, Trash2, Star, Calendar, Hash, Building2, FileText, BookMarked } from 'lucide-react';

interface BookInventoryDialogProps {
  books: Book[];
  purchases: Purchase[];
  onClose: () => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onUpdateBook: (book: Book) => void;
  isDarkMode?: boolean;
}

type SortField = 'title' | 'author' | 'genre' | 'isbn' | 'stock' | 'year' | 'price';
type SortDirection = 'asc' | 'desc';

export function BookInventoryDialog({ books, purchases, onClose, onEditBook, onDeleteBook, onUpdateBook, isDarkMode }: BookInventoryDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('stock');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [expandedBookIds, setExpandedBookIds] = useState<Set<string>>(new Set());
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [tempStockValue, setTempStockValue] = useState<string>('');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPriceValue, setTempPriceValue] = useState<string>('');

  // Calculate purchase stats for each book
  const getBooksWithStats = () => {
    return books.map(book => {
      const bookPurchases = purchases.filter(p => p.bookId === book.id);
      const totalPurchased = bookPurchases.length;
      
      return {
        ...book,
        totalPurchased
      };
    });
  };

  // Filter books based on search and low stock filter
  const filteredBooks = getBooksWithStats()
    .filter(book => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.genre.toLowerCase().includes(query) ||
        book.isbn?.toLowerCase().includes(query)
      );
      const matchesStockFilter = !showLowStockOnly || book.stock <= 3;
      return matchesSearch && matchesStockFilter;
    });

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Sort books based on selected field and direction
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    let aValue: any = a[sortBy] || '';
    let bValue: any = b[sortBy] || '';

    if (sortBy === 'year') {
      aValue = a.publishedYear;
      bValue = b.publishedYear;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    } else {
      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === 'asc' ? comparison : -comparison;
    }
  });

  // Calculate overall statistics
  const totalBooks = books.length;
  const totalStock = books.reduce((sum, book) => sum + book.stock, 0);
  const totalPurchased = purchases.length;
  const booksInStock = books.filter(book => book.stock > 0).length;
  const booksOutOfStock = books.filter(book => book.stock === 0).length;
  const lowStockBooks = books.filter(book => book.stock > 0 && book.stock <= 3).length;

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  // Get stock status color
  const getStockStatusColor = (stock: number) => {
    if (stock === 0) return 'text-red-600';
    if (stock <= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Toggle book expand
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

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col transition-colors ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b flex items-center justify-between transition-colors ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isDarkMode ? 'bg-purple-900' : 'bg-purple-100'
              }`}>
                <Package className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div>
                <h2 className={isDarkMode ? 'text-white' : 'text-gray-900'}>도서 관리 및 재고 현황</h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  전체 도서를 관리하고 재고 현황을 확인하세요
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

          {/* Statistics Summary */}
          <div className={`px-6 py-4 border-b transition-colors ${
            isDarkMode 
              ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-gray-700' 
              : 'bg-gradient-to-r from-purple-50 to-blue-50 border-gray-200'
          }`}>
            <div className="grid grid-cols-6 gap-4">
              <div className={`rounded-lg p-3 shadow-sm transition-colors ${
                isDarkMode ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>전체 도서</p>
                </div>
                <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalBooks}</p>
              </div>
              <div className={`rounded-lg p-3 shadow-sm transition-colors ${
                isDarkMode ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-green-600" />
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>총 재고</p>
                </div>
                <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalStock}</p>
              </div>
              <div className={`rounded-lg p-3 shadow-sm transition-colors ${
                isDarkMode ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>판매량</p>
                </div>
                <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{totalPurchased}</p>
              </div>
              <div className={`rounded-lg p-3 shadow-sm transition-colors ${
                isDarkMode ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>재고 있음</p>
                </div>
                <p className="text-2xl text-green-600">{booksInStock}</p>
              </div>
              <div className={`rounded-lg p-3 shadow-sm transition-colors ${
                isDarkMode ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>재고 부족</p>
                </div>
                <p className="text-2xl text-yellow-600">{lowStockBooks}</p>
              </div>
              <div className={`rounded-lg p-3 shadow-sm transition-colors ${
                isDarkMode ? 'bg-gray-700' : 'bg-white'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>품절</p>
                </div>
                <p className="text-2xl text-red-600">{booksOutOfStock}</p>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className={`px-6 py-4 border-b transition-colors ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex gap-3">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="제목, 저자, 장르, ISBN으로 검색..."
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
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortField)}
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
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  className={`px-2 py-2 transition-colors border-l ${
                    isDarkMode 
                      ? 'bg-gray-600 hover:bg-gray-500 border-gray-600' 
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-300'
                  }`}
                  title={sortDirection === 'asc' ? '오름차순 (클릭: 내림차순으로 변경)' : '내림차순 (클릭: 오름차순으로 변경)'}
                >
                  {sortDirection === 'asc' ? (
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
                  checked={showLowStockOnly}
                  onChange={(e) => setShowLowStockOnly(e.target.checked)}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                />
                <span className={`text-sm whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>재고 부족만</span>
              </label>
            </div>
          </div>

          {/* Book List */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {sortedBooks.length === 0 ? (
              <div className={`p-8 rounded-lg text-center transition-colors ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <Search className={`w-12 h-12 mx-auto mb-3 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {showLowStockOnly && !searchQuery.trim() 
                    ? '재고 부족 도서가 없습니다.'
                    : showLowStockOnly && searchQuery.trim()
                    ? '검색 조건에 맞는 재고 부족 도서가 없습니다.'
                    : '검색 결과가 없습니다.'}
                </p>
                {(searchQuery.trim() || showLowStockOnly) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowLowStockOnly(false);
                    }}
                    className="mt-3 text-sm text-purple-600 hover:underline"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedBooks.map((book) => {
                  const isExpanded = expandedBookIds.has(book.id);
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
                      {/* Main Book Info */}
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Book Cover */}
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-12 h-16 object-cover rounded shadow-sm flex-shrink-0"
                          />
                          
                          {/* Title */}
                          <div className="w-40 flex-shrink-0">
                            <h4 className={`text-sm line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{book.title}</h4>
                          </div>
                          
                          {/* Author */}
                          <div className="w-28 flex-shrink-0">
                            <p className={`text-sm line-clamp-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{book.author}</p>
                          </div>
                          
                          {/* Genre */}
                          <div className="w-20 flex-shrink-0">
                            <span className={`px-2 py-1 rounded text-xs inline-block ${
                              isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {book.genre}
                            </span>
                          </div>
                          
                          {/* Year */}
                          <div className="w-16 flex-shrink-0">
                            <span className={`px-2 py-1 rounded text-xs inline-block ${
                              isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {book.publishedYear}
                            </span>
                          </div>
                          
                          {/* Price Controls */}
                          <div className="w-24 flex-shrink-0">
                            {editingPriceId === book.id ? (
                              <input
                                type="number"
                                value={tempPriceValue}
                                onChange={(e) => setTempPriceValue(e.target.value)}
                                onBlur={() => {
                                  const newPrice = parseInt(tempPriceValue);
                                  if (!isNaN(newPrice) && newPrice >= 0) {
                                    onUpdateBook({ ...book, price: newPrice });
                                  }
                                  setEditingPriceId(null);
                                  setTempPriceValue('');
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const newPrice = parseInt(tempPriceValue);
                                    if (!isNaN(newPrice) && newPrice >= 0) {
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
                                className={`px-2 py-0.5 border-2 rounded text-xs font-medium w-full text-center focus:outline-none focus:ring-2 transition-colors ${
                                  isDarkMode 
                                    ? 'bg-gray-600 border-green-500 text-white focus:ring-green-500' 
                                    : 'bg-green-50 border-green-400 text-green-700 focus:ring-green-500'
                                }`}
                              />
                            ) : (
                              <div
                                onClick={() => {
                                  setEditingPriceId(book.id);
                                  setTempPriceValue(book.price.toString());
                                }}
                                className={`px-2 py-0.5 rounded text-xs font-medium text-center cursor-pointer transition-colors border ${
                                  isDarkMode 
                                    ? 'bg-gray-600 border-gray-500 text-green-400 hover:bg-gray-500' 
                                    : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                }`}
                                title="클릭하여 가격 수정"
                              >
                                {book.price.toLocaleString()}원
                              </div>
                            )}
                          </div>
                          
                          {/* Stock Controls */}
                          <div className="w-32 flex-shrink-0">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  if (book.stock > 0) {
                                    onUpdateBook({ ...book, stock: book.stock - 1 });
                                  }
                                }}
                                disabled={book.stock <= 0}
                                className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title="재고 감소"
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
                                    if (!isNaN(newStock) && newStock >= 0) {
                                      onUpdateBook({ ...book, stock: newStock });
                                    }
                                    setEditingStockId(null);
                                    setTempStockValue('');
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const newStock = parseInt(tempStockValue);
                                      if (!isNaN(newStock) && newStock >= 0) {
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
                                  className="px-2 py-0.5 bg-purple-50 border-2 border-purple-400 rounded text-xs text-purple-700 font-medium w-14 text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              ) : (
                                <div
                                  onClick={() => {
                                    setEditingStockId(book.id);
                                    setTempStockValue(book.stock.toString());
                                  }}
                                  className={`px-2 py-0.5 bg-purple-50 border border-purple-200 rounded text-xs font-medium min-w-[2.5rem] text-center cursor-pointer hover:bg-purple-100 transition-colors ${getStockStatusColor(book.stock)}`}
                                  title="클릭하여 직접 입력"
                                >
                                  {book.stock}
                                </div>
                              )}
                              <button
                                onClick={() => onUpdateBook({ ...book, stock: book.stock + 1 })}
                                className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                                title="재고 증가"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Purchased Count */}
                          <div className="w-20 flex-shrink-0">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <TrendingUp className="w-3 h-3" />
                              <span>{book.totalPurchased}권</span>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                            <button
                              onClick={() => toggleBookExpand(book.id)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title={isExpanded ? "접기" : "상세정보"}
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            <button
                              onClick={() => {
                                onEditBook(book);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
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
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            {/* Basic Info */}
                            <div className="space-y-3">
                              <div className="flex items-start gap-2">
                                <Building2 className="w-4 h-4 text-blue-600 mt-0.5" />
                                <div>
                                  <p className="text-xs text-gray-500">저자</p>
                                  <p className="text-sm text-gray-900">{book.author}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
                                <div>
                                  <p className="text-xs text-gray-500">출판연도</p>
                                  <p className="text-sm text-gray-900">{book.publishedYear}년</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Hash className="w-4 h-4 text-blue-600 mt-0.5" />
                                <div>
                                  <p className="text-xs text-gray-500">ISBN</p>
                                  <p className="text-sm text-gray-900 font-mono">{book.isbn || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2">
                                <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                                <div>
                                  <p className="text-xs text-gray-500">평점</p>
                                  <p className="text-sm text-gray-900">
                                    {avgRating > 0 ? `${avgRating.toFixed(1)}점` : '평가 없음'} 
                                    {book.ratings.length > 0 && (
                                      <span className="text-xs text-gray-500 ml-1">
                                        ({book.ratings.length}개)
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">설명</p>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {book.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Reviews Section */}
                          {book.ratings.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center gap-2 mb-3">
                                <BookMarked className="w-4 h-4 text-purple-600" />
                                <h5 className="text-sm text-gray-900">리뷰 ({book.ratings.length})</h5>
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {book.ratings.map((rating, idx) => {
                                  const review = book.reviews?.find(r => r.userId === rating.userId);
                                  return (
                                    <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="flex">
                                          {[...Array(5)].map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-3 h-3 ${
                                                i < rating.rating
                                                  ? 'fill-yellow-400 text-yellow-400'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {rating.userId}
                                        </span>
                                      </div>
                                      {review && (
                                        <p className="text-sm text-gray-700">{review.comment}</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
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

          {/* Footer */}
          <div className={`px-6 py-4 border-t transition-colors ${
            isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center justify-between">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {filteredBooks.length !== totalBooks && (
                  <span>{filteredBooks.length}권 필터링됨 / </span>
                )}
                총 {totalBooks}권의 도서
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Missing imports
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';