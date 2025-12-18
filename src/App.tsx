import { useState, useEffect } from 'react';
import { BookList } from './components/BookList';
import { AddBookDialog } from './components/AddBookDialog';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { MyPage } from './components/MyPage_updated';
import { BookDetailDialog } from './components/BookDetailDialog';
import { Cart, CartItem } from './components/Cart';
import { WishlistDialog } from './components/WishlistDialog';
import { CheckoutDialog, CheckoutItem, PaymentInfo } from './components/CheckoutDialog';
import { PurchaseConfirmDialog } from './components/PurchaseConfirmDialog';
import { Plus, Menu, X, Edit2, Trash2, Search, LogOut, User as UserIcon, Package, ShoppingCart, Moon, Sun, Heart } from 'lucide-react';
import ktAivleLogo from 'figma:asset/e5ac75b360c5f16e2a9a70e851e77229ca22f463.png';
import { initialBooks } from './data/initialBooks';

export interface Rating {
  userId: string;
  rating: number;
  timestamp: Date;
}

export interface Review {
  id: string;
  userId: string;
  comment: string;
  timestamp: Date;
  likes?: string[]; // User IDs who liked this review
  reports?: { userId: string; reason: string; timestamp: Date }[]; // Review reports
  isHidden?: boolean; // If reported and hidden by admin
}

export interface Purchase {
  id: string;
  bookId: string;
  userId: string;
  purchaseDate: Date;
  status?: 'pending' | 'shipped' | 'delivered' | 'cancelled'; // Purchase status - cancelled 추가
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  coverImage: string;
  publishedYear: number;
  price: number; // Book price in KRW
  createdBy: string; // User ID who created this book
  createdAt: Date;
  ratings: Rating[]; // Array of ratings
  reviews: Review[]; // Array of reviews
  stock: number; // Total stock count
  status?: 'approved' | 'pending'; // Book approval status - 'approved' by admin, 'pending' for user requests
}

export interface EditRecord {
  id: string;
  bookId: string;
  timestamp: Date;
  before: Book;
  after: Book;
  changes: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
}

export interface DeleteRecord {
  id: string;
  book: Book;
  timestamp: Date;
}

export interface User {
  id: string;
  password: string;
  role: 'admin' | 'user';
  email?: string;
  name?: string;
  gender?: 'male' | 'female';
  phone?: string; // Phone number
  address?: string; // Address
  detailAddress?: string; // Detail address
  zipCode?: string; // Zip code
  wishlist?: string[]; // Book IDs in wishlist
  suspensionUntil?: Date; // Suspension end date - user is suspended until this date
}

export default function App() {
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        
        // Migrate existing KT user with new information if it doesn't have email
        const migratedUsers = parsedUsers.map((u: User) => {
          if (u.id === 'KT' && !u.email) {
            return {
              ...u,
              email: 'kt@aivle.com',
              name: '김아무개',
              gender: 'male' as const,
              phone: '010-1234-5678',
              zipCode: '06236',
              address: '서울특별시 강남구 테헤란로 152',
              detailAddress: 'KT타워 15층',
              wishlist: u.wishlist || []
            };
          }
          return u;
        });
        
        return migratedUsers;
      } catch (e) {
        console.error('Error parsing saved users:', e);
      }
    }
    return [
      { id: 'ADMIN', password: '1234', role: 'admin' },
      { 
        id: 'KT', 
        password: '1234', 
        role: 'user',
        email: 'kt@aivle.com',
        name: '김아무개',
        gender: 'male',
        phone: '010-1234-5678',
        zipCode: '06236',
        address: '서울특별시 강남구 테헤란로 152',
        detailAddress: 'KT타워 15층',
        wishlist: []
      }
    ];
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Always start with login screen (localStorage auto-login disabled)
    return null;
  });
  
  // Initialize purchases from localStorage or use empty array
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const savedPurchases = localStorage.getItem('purchases');
    if (savedPurchases) {
      try {
        const parsed = JSON.parse(savedPurchases);
        return parsed.map((purchase: any) => ({
          ...purchase,
          purchaseDate: new Date(purchase.purchaseDate),
          status: purchase.status || 'shipped' // Migrate old purchases to 'shipped' status
        }));
      } catch (e) {
        console.error('Error parsing saved purchases:', e);
      }
    }
    return [];
  });
  
  // Initialize books from localStorage or use default data
  const [books, setBooks] = useState<Book[]>(() => {
    const savedBooks = localStorage.getItem('books');
    if (savedBooks) {
      try {
        const parsed = JSON.parse(savedBooks);
        // Convert date strings back to Date objects
        return parsed.map((book: any) => ({
          ...book,
          createdAt: new Date(book.createdAt),
          ratings: book.ratings?.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) })) || [],
          reviews: book.reviews?.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) })) || [],
          stock: book.stock || 0
        }));
      } catch (e) {
        console.error('Error parsing saved books:', e);
      }
    }
    
    // Default initial data - Load from initialBooks
    return initialBooks.map(book => ({
      ...book,
      ratings: [],
      reviews: [],
      status: 'approved' as const // All initial books are approved
    }));
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectionType, setSelectionType] = useState<'edit' | 'delete' | null>(null);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Load cart items for current user from localStorage
    if (currentUser) {
      const savedCart = localStorage.getItem(`cart_${currentUser.id}`);
      if (savedCart) {
        try {
          return JSON.parse(savedCart);
        } catch (e) {
          console.error('Error parsing saved cart:', e);
        }
      }
    }
    return [];
  });
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  
  // Checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [isPurchaseConfirmOpen, setIsPurchaseConfirmOpen] = useState(false);
  const [pendingPurchaseBook, setPendingPurchaseBook] = useState<{ book: Book; quantity: number } | null>(null);
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`cart_${currentUser.id}`, JSON.stringify(cartItems));
    }
  }, [cartItems, currentUser]);
  
  // Load cart when user changes
  useEffect(() => {
    if (currentUser) {
      const savedCart = localStorage.getItem(`cart_${currentUser.id}`);
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (e) {
          console.error('Error parsing saved cart:', e);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    } else {
      setCartItems([]);
    }
  }, [currentUser?.id]);
  
  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // Get the current selected book from books array (always fresh data)
  const selectedBook = selectedBookId ? books.find(b => b.id === selectedBookId) || null : null;
  
  // History
  const [editHistory, setEditHistory] = useState<EditRecord[]>([]);
  const [deleteHistory, setDeleteHistory] = useState<DeleteRecord[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('전체');
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'author' | 'stock'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10; // 2 rows x 5 columns

  const isAdmin = currentUser?.role === 'admin';

  // Save books to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('books', JSON.stringify(books));
  }, [books]);

  // Save purchases to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('purchases', JSON.stringify(purchases));
  }, [purchases]);

  // Save users to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  // Sync currentUser with users array when users change
  useEffect(() => {
    if (currentUser) {
      // Find the updated user from users array
      const updatedUser = users.find(u => u.id === currentUser.id);
      if (updatedUser) {
        // Check if the user data has changed
        if (JSON.stringify(updatedUser) !== JSON.stringify(currentUser)) {
          setCurrentUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }
    }
  }, [users]);

  const handleLogin = (user: User) => {
    // Always fetch the latest user data from users array
    const latestUser = users.find(u => u.id === user.id);
    const userToLogin = latestUser || user;
    
    setCurrentUser(userToLogin);
    localStorage.setItem('currentUser', JSON.stringify(userToLogin));
  };

  const handleRegister = (newUser: Omit<User, 'role'>) => {
    // Check if user already exists
    if (users.some(u => u.id === newUser.id)) {
      throw new Error('이미 존재하는 아이디입니다.');
    }
    
    // Check if email already exists
    if (newUser.email && users.some(u => u.email === newUser.email)) {
      throw new Error('이미 사용 중인 이메일입니다.');
    }

    const userWithRole: User = {
      ...newUser,
      role: 'user' // Always create as regular user
    };

    setUsers([...users, userWithRole]);
    return userWithRole;
  };

  const handleFindId = (email: string, name: string): User[] => {
    return users.filter(u => u.email === email && u.name === name);
  };

  const handleFindPassword = (id: string, email: string, name: string): User | null => {
    return users.find(u => u.id === id && u.email === email && u.name === name) || null;
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
  };
  
  // Reload purchases from localStorage
  const reloadPurchases = () => {
    const savedPurchases = localStorage.getItem('purchases');
    if (savedPurchases) {
      try {
        const parsed = JSON.parse(savedPurchases);
        const reloadedPurchases = parsed.map((purchase: any) => ({
          ...purchase,
          purchaseDate: new Date(purchase.purchaseDate),
          status: purchase.status || 'shipped'
        }));
        setPurchases(reloadedPurchases);
      } catch (e) {
        console.error('Error reloading purchases:', e);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setIsSelectionMode(false);
    setSelectedBookIds([]);
  };

  const handlePasswordChange = (newPassword: string) => {
    if (currentUser) {
      setUsers(users.map(u => 
        u.id === currentUser.id ? { ...u, password: newPassword } : u
      ));
      setCurrentUser({ ...currentUser, password: newPassword });
      localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, password: newPassword }));
    }
  };

  const handleAddBook = (book: Omit<Book, 'id' | 'createdBy' | 'createdAt'>) => {
    if (!currentUser) return;
    
    const newBook: Book = {
      ...book,
      id: Date.now().toString(),
      createdBy: currentUser.id,
      createdAt: new Date(),
      ratings: [],
      reviews: [],
      stock: 0,
      status: currentUser.role === 'admin' ? 'approved' : 'pending' // Admin: approved, User: pending
    };
    setBooks([...books, newBook]);
    setIsDialogOpen(false);
    
    // Show appropriate message
    if (currentUser.role === 'user') {
      alert('도서 요청이 완료되었습니다.\n마이페이지에서 요청 내역을 확인하실 수 있습니다.');
    }
  };

  const handleEditBook = (book: Book) => {
    const oldBook = books.find(b => b.id === book.id);
    if (oldBook) {
      // Track changes
      const changes: { field: string; oldValue: string; newValue: string }[] = [];
      
      if (oldBook.title !== book.title) {
        changes.push({ field: '제목', oldValue: oldBook.title, newValue: book.title });
      }
      if (oldBook.author !== book.author) {
        changes.push({ field: '저자', oldValue: oldBook.author, newValue: book.author });
      }
      if (oldBook.genre !== book.genre) {
        changes.push({ field: '장르', oldValue: oldBook.genre, newValue: book.genre });
      }
      if (oldBook.description !== book.description) {
        changes.push({ field: '설명', oldValue: oldBook.description, newValue: book.description });
      }
      if (oldBook.publishedYear !== book.publishedYear) {
        changes.push({ field: '출판연도', oldValue: oldBook.publishedYear.toString(), newValue: book.publishedYear.toString() });
      }
      if (oldBook.price !== book.price) {
        changes.push({ field: '가격', oldValue: oldBook.price.toString(), newValue: book.price.toString() });
      }

      if (changes.length > 0) {
        const editRecord: EditRecord = {
          id: Date.now().toString(),
          bookId: book.id,
          timestamp: new Date(),
          before: oldBook,
          after: book,
          changes
        };
        setEditHistory([editRecord, ...editHistory]);
      }
    }

    setBooks(books.map(b => b.id === book.id ? book : b));
    setEditingBook(null);
    setIsDialogOpen(false);
    setSelectedBookIds([]);
    setIsSelectionMode(false);
    setSelectionType(null);
  };

  const handleDeleteBook = (id: string) => {
    const book = books.find(b => b.id === id);
    if (book) {
      const deleteRecord: DeleteRecord = {
        id: Date.now().toString() + id,
        book,
        timestamp: new Date()
      };
      setDeleteHistory([deleteRecord, ...deleteHistory]);
      setBooks(books.filter(b => b.id !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedBookIds.length === 0) return;
    if (confirm(`선택한 ${selectedBookIds.length}권의 도서를 삭제하시겠습니까?`)) {
      const deletedBooks = books.filter(b => selectedBookIds.includes(b.id));
      const deleteRecords: DeleteRecord[] = deletedBooks.map(book => ({
        id: Date.now().toString() + book.id,
        book,
        timestamp: new Date()
      }));
      
      setDeleteHistory([...deleteRecords, ...deleteHistory]);
      setBooks(books.filter(b => !selectedBookIds.includes(b.id)));
      setSelectedBookIds([]);
      setIsSelectionMode(false);
      setSelectionType(null);
    }
  };

  const handleBulkEdit = () => {
    if (selectedBookIds.length === 0) return;
    if (selectedBookIds.length === 1) {
      const book = books.find(b => b.id === selectedBookIds[0]);
      if (book) {
        setEditingBook(book);
        setIsDialogOpen(true);
      }
    } else {
      alert('집은 한 번에 하나의 도서만 선택해주세요.');
    }
  };

  const handleSelectBook = (id: string) => {
    setSelectedBookIds(prev => 
      prev.includes(id) ? prev.filter(bookId => bookId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentBooks = getCurrentPageBooks();
    const currentBookIds = currentBooks.map(b => b.id);
    
    if (currentBookIds.every(id => selectedBookIds.includes(id))) {
      setSelectedBookIds(selectedBookIds.filter(id => !currentBookIds.includes(id)));
    } else {
      const newSelections = [...selectedBookIds];
      currentBookIds.forEach(id => {
        if (!newSelections.includes(id)) {
          newSelections.push(id);
        }
      });
      setSelectedBookIds(newSelections);
    }
  };

  const handleRestoreBook = (deleteRecord: DeleteRecord) => {
    setBooks([...books, deleteRecord.book]);
    setDeleteHistory(deleteHistory.filter(d => d.id !== deleteRecord.id));
  };

  const handleBookClick = (book: Book) => {
    if (!isSelectionMode) {
      setSelectedBookId(book.id);
    }
  };

  const openAddDialog = () => {
    setEditingBook(null);
    setIsDialogOpen(true);
  };

  const enterSelectionMode = (mode: 'edit' | 'delete') => {
    setIsSelectionMode(true);
    setSelectionType(mode);
    setSelectedBookIds([]);
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectionType(null);
    setSelectedBookIds([]);
  };

  // Filter and sort books
  const filteredBooks = books
    .filter(book => {
      // Only show approved books in main screen (hide pending requests)
      // Treat books without status field as approved (for backward compatibility)
      // Allow books without status OR with status 'approved'
      const isApproved = !book.status || book.status === 'approved';
      if (!isApproved) {
        return false;
      }
      
      // Genre filter
      const matchesGenre = selectedGenre === '전체' || book.genre === selectedGenre;
      
      // If no search query, just check genre
      if (!searchQuery || searchQuery.trim() === '') {
        return matchesGenre;
      }
      
      // With search query, check all text fields (with null safety)
      const searchLower = searchQuery.toLowerCase().trim();
      const title = (book.title || '').toLowerCase();
      const author = (book.author || '').toLowerCase();
      const description = (book.description || '').toLowerCase();
      
      const matchesSearch = 
        title.includes(searchLower) ||
        author.includes(searchLower) ||
        description.includes(searchLower);
      
      return matchesSearch && matchesGenre;
    })
    .filter(book => !showLowStockOnly || book.stock <= 3) // Add low stock filter
    .sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'year') {
        return b.publishedYear - a.publishedYear;
      } else if (sortBy === 'author') {
        return a.author.localeCompare(b.author);
      } else if (sortBy === 'stock') {
        return sortOrder === 'asc' ? a.stock - b.stock : b.stock - a.stock;
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const getCurrentPageBooks = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBooks.slice(startIndex, endIndex);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle refresh to home
  const handleRefreshToHome = () => {
    // Reset all UI states to initial values (like a soft refresh)
    setSearchQuery('');
    setSelectedGenre('전체');
    setSortBy('title');
    setSortOrder('asc');
    setShowLowStockOnly(false);
    setCurrentPage(1);
    setIsDialogOpen(false);
    setEditingBook(null);
    setIsSidebarOpen(false);
    setSelectedBookIds([]);
    setIsSelectionMode(false);
    setSelectionType(null);
    setIsMyPageOpen(false);
    setSelectedBookId(null);
    setIsCartOpen(false);
    setIsWishlistOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle individual book purchase
  const handlePurchaseBookWithConfirm = (bookId: string, quantity: number) => {
    if (!currentUser) return false;

    // Check if user is suspended
    if (currentUser.role === 'user' && currentUser.suspensionUntil) {
      const now = new Date();
      const suspensionDate = new Date(currentUser.suspensionUntil);
      if (suspensionDate > now) {
        const daysLeft = Math.ceil((suspensionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        alert(`활동 정지 상태입니다. 구매할 수 없습니다.\n남은 정지 기간: ${daysLeft}일`);
        return false;
      }
    }

    const book = books.find(b => b.id === bookId);
    if (!book) return false;

    if (book.stock < quantity) {
      alert(`재고가 부족합니다. (현재 재고: ${book.stock}권)`);
      return false;
    }

    // Show purchase confirmation dialog
    setPendingPurchaseBook({ book, quantity });
    setIsPurchaseConfirmOpen(true);
    return true;
  };

  // Handle "Go to Checkout" from purchase confirm dialog
  const handleGoToCheckoutFromConfirm = () => {
    if (!pendingPurchaseBook) return;

    // Prepare checkout items
    const items: CheckoutItem[] = [{
      book: pendingPurchaseBook.book,
      quantity: pendingPurchaseBook.quantity
    }];

    setCheckoutItems(items);
    setIsPurchaseConfirmOpen(false);
    setPendingPurchaseBook(null);
    setIsCheckoutOpen(true);
    setSelectedBookId(null); // Close book detail
  };

  // Handle "Add to Cart" from purchase confirm dialog
  const handleAddToCartFromConfirm = () => {
    if (!pendingPurchaseBook) return;

    const success = handleAddToCart(pendingPurchaseBook.book, pendingPurchaseBook.quantity, false);
    
    if (success) {
      setIsPurchaseConfirmOpen(false);
      setPendingPurchaseBook(null);
    }
  };

  // Cart functions
  const handleAddToCart = (book: Book, quantity: number = 1, silent: boolean = false): boolean => {
    if (!currentUser) return false;
    
    // Check conditions BEFORE setState (synchronous)
    const existingItem = cartItems.find(item => item.book.id === book.id);
    let wasSuccessful = false;
    
    if (existingItem) {
      // Increase quantity if possible
      if (existingItem.quantity + quantity <= book.stock) {
        wasSuccessful = true;
        // Update using functional update for concurrent calls
        setCartItems(prevCartItems => 
          prevCartItems.map(item =>
            item.book.id === book.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        );
        if (!silent) {
          alert(`장바구니에 ${quantity}권이 추가되었습니다.`);
        }
      } else {
        wasSuccessful = false;
        if (!silent) {
          alert(`최대 재고는 ${book.stock}권입니다.`);
        }
      }
    } else {
      // Add new item to cart
      if (book.stock >= quantity) {
        wasSuccessful = true;
        // Update using functional update for concurrent calls
        setCartItems(prevCartItems => [...prevCartItems, { book, quantity }]);
        if (!silent) {
          alert(`장바구니에 ${quantity}권이 추가되었습니다.`);
        }
      } else {
        wasSuccessful = false;
        if (!silent) {
          alert('재고가 부족합니다.');
        }
      }
    }
    
    return wasSuccessful;
  };

  const handleUpdateCartQuantity = (bookId: string, quantity: number) => {
    setCartItems(cartItems.map(item =>
      item.book.id === bookId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveCartItem = (bookId: string) => {
    setCartItems(cartItems.filter(item => item.book.id !== bookId));
  };

  // Open checkout from cart
  const handleCartCheckout = () => {
    if (!currentUser) return;
    if (cartItems.length === 0) return;

    // Check if user is suspended
    if (currentUser.role === 'user' && currentUser.suspensionUntil) {
      const now = new Date();
      const suspensionDate = new Date(currentUser.suspensionUntil);
      if (suspensionDate > now) {
        const daysLeft = Math.ceil((suspensionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        alert(`활동 정지 상태입니다. 구매할 수 없습니다.\n남은 정지 기간: ${daysLeft}일`);
        return;
      }
    }

    // Check if all items have sufficient stock
    for (const item of cartItems) {
      const currentBook = books.find(b => b.id === item.book.id);
      if (!currentBook || currentBook.stock < item.quantity) {
        alert(`${item.book.title}의 재고가 부족합니다.`);
        return;
      }
    }

    // Prepare checkout items
    const items: CheckoutItem[] = cartItems.map(item => ({
      book: item.book,
      quantity: item.quantity
    }));

    setCheckoutItems(items);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Complete checkout and create purchases
  const handleCheckoutComplete = (paymentInfo: PaymentInfo) => {
    if (!currentUser) return;
    if (checkoutItems.length === 0) return;

    // Create purchases for all checkout items
    const newPurchases: Purchase[] = [];
    const updatedBooks = [...books];

    checkoutItems.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        newPurchases.push({
          id: `${Date.now()}_${item.book.id}_${i}_${Math.random()}`,
          bookId: item.book.id,
          userId: currentUser.id,
          purchaseDate: new Date(),
          status: 'shipped' // Automatically set to shipped
        });
      }

      // Decrease stock
      const bookIndex = updatedBooks.findIndex(b => b.id === item.book.id);
      if (bookIndex !== -1) {
        updatedBooks[bookIndex] = {
          ...updatedBooks[bookIndex],
          stock: updatedBooks[bookIndex].stock - item.quantity
        };
      }
    });

    // Update state
    const updatedPurchases = [...purchases, ...newPurchases];
    setPurchases(updatedPurchases);
    setBooks(updatedBooks);
    localStorage.setItem('purchases', JSON.stringify(updatedPurchases));

    const totalQuantity = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = checkoutItems.reduce((sum, item) => sum + item.book.price * item.quantity, 0);

    // Create Order object and save to localStorage
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const deliveryFee = totalAmount >= 30000 ? 0 : 3000;
    const newOrder = {
      orderId,
      userId: currentUser.id,
      items: checkoutItems.map(item => ({
        bookId: item.book.id,
        title: item.book.title,
        author: item.book.author,
        coverImage: item.book.coverImage,
        price: item.book.price,
        quantity: item.quantity
      })),
      totalAmount,
      deliveryFee,
      finalAmount: totalAmount + deliveryFee,
      paymentMethod: paymentInfo.paymentMethod,
      recipient: paymentInfo.recipient,
      phone: paymentInfo.phone,
      address: paymentInfo.address,
      detailAddress: paymentInfo.detailAddress,
      zipCode: paymentInfo.zipCode,
      deliveryRequest: paymentInfo.deliveryRequest || '',
      status: 'paid', // Initial status after payment
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save order to localStorage
    try {
      const existingOrders = JSON.parse(localStorage.getItem(`orders_${currentUser.id}`) || '[]');
      existingOrders.push(newOrder);
      localStorage.setItem(`orders_${currentUser.id}`, JSON.stringify(existingOrders));
    } catch (error) {
      console.error('Error saving order:', error);
    }

    alert(`결제가 완료되었습니다!\n주문번호: ${orderId}\n- 수량: ${totalQuantity}권\n- 금액: ${totalAmount.toLocaleString()}원\n- 배송지: ${paymentInfo.address} ${paymentInfo.detailAddress}`);
    
    // Clear checkout items and remove from cart
    const checkoutBookIds = checkoutItems.map(item => item.book.id);
    setCartItems(cartItems.filter(item => !checkoutBookIds.includes(item.book.id)));
    setCheckoutItems([]);
    setIsCheckoutOpen(false);
  };

  // Cancel purchase (for admin - returns stock)
  const handleCancelPurchase = (purchaseIds: string[]) => {
    if (!currentUser || purchaseIds.length === 0) return;

    // Only admin or the user who made the purchase can cancel
    const firstPurchase = purchases.find(p => p.id === purchaseIds[0]);
    if (!firstPurchase) return;

    if (currentUser.role !== 'admin' && currentUser.id !== firstPurchase.userId) {
      alert('구매 취소 권한이 없습니다.');
      return;
    }

    // Remove purchases
    const updatedPurchases = purchases.filter(p => !purchaseIds.includes(p.id));
    setPurchases(updatedPurchases);

    // Increase stock back
    const updatedBooks = books.map(b =>
      b.id === firstPurchase.bookId ? { ...b, stock: b.stock + purchaseIds.length } : b
    );
    setBooks(updatedBooks);

    alert(`${purchaseIds.length}권 구매가 취소되었습니다. 재고가 복구되었습니다.`);
  };

  // Return purchase (for users - returns stock with 10% penalty)
  const handleReturnPurchase = (purchaseIds: string[]) => {
    if (!currentUser || purchaseIds.length === 0) return;

    // Only the user who made the purchase can return
    const firstPurchase = purchases.find(p => p.id === purchaseIds[0]);
    if (!firstPurchase) return;

    if (currentUser.id !== firstPurchase.userId) {
      alert('반품 권한이 없습니다.');
      return;
    }

    const book = books.find(b => b.id === firstPurchase.bookId);
    if (!book) return;

    // Calculate refund amount (90% of the original price)
    const returnQuantity = purchaseIds.length;
    const refundAmount = Math.floor(book.price * returnQuantity * 0.9);

    if (confirm(`${returnQuantity}권을 반품하시겠습니까?\n환불 금액: ${refundAmount.toLocaleString()}원 (10% 수수료 차감)`)) {
      // Remove purchases
      const updatedPurchases = purchases.filter(p => !purchaseIds.includes(p.id));
      setPurchases(updatedPurchases);

      // Increase stock back
      const updatedBooks = books.map(b =>
        b.id === firstPurchase.bookId ? { ...b, stock: b.stock + returnQuantity } : b
      );
      setBooks(updatedBooks);

      alert(`반품이 완료되었습니다.\n환불 금액: ${refundAmount.toLocaleString()}원\n재고가 복구되었습니다.`);
    }
  };

  // Feature 1: Wishlist / 찜하기
  const handleToggleWishlist = (bookId: string) => {
    if (!currentUser) return;
    
    const wishlist = currentUser.wishlist || [];
    const isInWishlist = wishlist.includes(bookId);
    
    // Toggle wishlist (add or remove - no duplicates)
    const updatedWishlist = isInWishlist
      ? wishlist.filter(id => id !== bookId)
      : [...wishlist, bookId];
    
    const updatedUser = { ...currentUser, wishlist: updatedWishlist };
    handleUpdateUser(updatedUser);
    
    // Show notification based on stock
    if (!isInWishlist) {
      const book = books.find(b => b.id === bookId);
      if (book && book.stock === 0) {
        alert('찜 목록에 추가했습니다.\n(현재 재고가 없습니다)');
      } else {
        alert('찜 목록에 추가했습니다.');
      }
    }
  };

  // Remove book from wishlist
  const handleRemoveFromWishlist = (bookId: string) => {
    if (!currentUser) return;
    
    const wishlist = currentUser.wishlist || [];
    const updatedWishlist = wishlist.filter(id => id !== bookId);
    
    const updatedUser = { ...currentUser, wishlist: updatedWishlist };
    handleUpdateUser(updatedUser);
  };

  // Remove multiple books from wishlist at once
  const handleRemoveFromWishlistBulk = (bookIds: string[]) => {
    if (!currentUser || bookIds.length === 0) return;
    
    const wishlist = currentUser.wishlist || [];
    const uniqueBookIds = Array.from(new Set(bookIds));
    const updatedWishlist = wishlist.filter(id => !uniqueBookIds.includes(id));
    
    const updatedUser = { ...currentUser, wishlist: updatedWishlist };
    handleUpdateUser(updatedUser);
  };

  // Feature 3: Review Like / 리뷰 좋아요
  const handleLikeReview = (bookId: string, reviewId: string) => {
    if (!currentUser) return;
    
    setBooks(books.map(book => {
      if (book.id !== bookId) return book;
      
      return {
        ...book,
        reviews: book.reviews.map(review => {
          if (review.id !== reviewId) return review;
          
          const likes = review.likes || [];
          const hasLiked = likes.includes(currentUser.id);
          
          return {
            ...review,
            likes: hasLiked
              ? likes.filter(id => id !== currentUser.id)
              : [...likes, currentUser.id]
          };
        })
      };
    }));
  };

  // Feature 4: Review Report / 리뷰 신고
  const handleReportReview = (bookId: string, reviewId: string, reason: string) => {
    if (!currentUser) return;
    
    setBooks(books.map(book => {
      if (book.id !== bookId) return book;
      
      return {
        ...book,
        reviews: book.reviews.map(review => {
          if (review.id !== reviewId) return review;
          
          const reports = review.reports || [];
          
          // Check if already reported by this user
          if (reports.some(r => r.userId === currentUser.id)) {
            alert('이미 신고한 리뷰입니다.');
            return review;
          }
          
          const newReports = [
            ...reports,
            { userId: currentUser.id, reason, timestamp: new Date() }
          ];
          
          // Auto hide if reported 3 or more times
          const isHidden = newReports.length >= 3;
          
          return {
            ...review,
            reports: newReports,
            isHidden
          };
        })
      };
    }));
    
    alert('리뷰가 신고되었습니다.');
  };

  // Admin: Hide/Unhide Review
  const handleToggleReviewHidden = (bookId: string, reviewId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    setBooks(books.map(book => {
      if (book.id !== bookId) return book;
      
      return {
        ...book,
        reviews: book.reviews.map(review => {
          if (review.id !== reviewId) return review;
          
          return {
            ...review,
            isHidden: !review.isHidden
          };
        })
      };
    }));
  };

  // Feature 2: Dark Mode Toggle
  const handleToggleDarkMode = (value: boolean) => {
    setIsDarkMode(value);
  };

  // Show login screen if not logged in
  if (!currentUser) {
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        users={users}
        onRegister={handleRegister}
        onFindId={handleFindId}
        onFindPassword={handleFindPassword}
        isDarkMode={isDarkMode}
        onToggleDarkMode={setIsDarkMode}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* App Bar */}
      <header className={`shadow-md sticky top-0 z-40 border-b h-[65px] transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full gap-4">
            {/* Left Section - Logo and Menu */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2">
                <button onClick={handleRefreshToHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <img src={ktAivleLogo} alt="KT Aivle School Logo" className="h-8 cursor-pointer" />
                </button>
                <div>
                  <h1 className={`whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AI 도서 관리</h1>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    ID : {currentUser.id} ({currentUser.role === 'admin' ? '관리자 계정' : '일반 계정'})
                    {currentUser.role === 'user' && currentUser.suspensionUntil && (() => {
                      const now = new Date();
                      const suspensionDate = new Date(currentUser.suspensionUntil);
                      if (suspensionDate > now) {
                        const daysLeft = Math.ceil((suspensionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        return <span className="ml-2 text-red-600 font-semibold">⛔ 활동 정지 {daysLeft}일</span>;
                      }
                      return null;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Center Section - Search */}
            <div className="flex-1 max-w-2xl mx-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="도서 검색 (제목, 저자, 내용)"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
                      isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Section - Action Buttons */}
            <div className="flex items-center gap-2">
              {isSelectionMode ? (
                <>
                  <button
                    onClick={exitSelectionMode}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span className="hidden sm:inline">취소</span>
                  </button>
                  {selectedBookIds.length > 0 && (
                    <>
                      {selectionType === 'edit' && (
                        <button
                          onClick={handleBulkEdit}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>편집 ({selectedBookIds.length})</span>
                        </button>
                      )}
                      {selectionType === 'delete' && (
                        <button
                          onClick={handleBulkDelete}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>삭제 ({selectedBookIds.length})</span>
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {!isAdmin && (
                    <div className="relative group">
                      <button
                        onClick={() => setIsCartOpen(true)}
                        className="w-10 h-10 flex items-center justify-center bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-300 shadow-sm hover:scale-110 relative"
                      >
                        <ShoppingCart className="w-5 h-5" />
                        {cartItems.length > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {cartItems.length}
                          </span>
                        )}
                      </button>
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        장바구니
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  )}
                  {!isAdmin && (
                    <div className="relative group">
                      <button
                        onClick={() => setIsWishlistOpen(true)}
                        className="w-10 h-10 flex items-center justify-center bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all duration-300 shadow-sm hover:scale-110 relative"
                      >
                        <Heart className="w-5 h-5" />
                        {(currentUser.wishlist && currentUser.wishlist.length > 0) && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {currentUser.wishlist.length}
                          </span>
                        )}
                      </button>
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        찜 목록
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                  )}
                  <div className="relative group">
                    <button
                      onClick={openAddDialog}
                      className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-sm hover:scale-110"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {isAdmin ? '도서 추가' : '도서 요청'}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                  <div className="relative group">
                    <button
                      onClick={() => setIsMyPageOpen(true)}
                      className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-sm hover:scale-110"
                    >
                      <UserIcon className="w-5 h-5" />
                    </button>
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      마이페이지
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                  <div className="relative group">
                    <button
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="w-10 h-10 flex items-center justify-center bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all duration-300 shadow-sm hover:scale-110"
                    >
                      {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {isDarkMode ? '라이트 모드' : '다크 모드'}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                  <div className="relative group">
                    <button
                      onClick={handleLogout}
                      className="w-10 h-10 flex items-center justify-center bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 shadow-sm hover:scale-110"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      로그아웃
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar - Overlay when opened */}
      <Sidebar
        books={books}
        purchases={purchases}
        currentUser={currentUser}
        isOpen={isSidebarOpen}
        selectedGenre={selectedGenre}
        sortBy={sortBy}
        onGenreChange={setSelectedGenre}
        onSortChange={setSortBy}
        onClose={() => setIsSidebarOpen(false)}
        isDarkMode={isDarkMode}
      />

      {/* Main Content */}
      <main className={`px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 ${isSidebarOpen ? 'ml-80' : 'ml-0'}`}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className={`mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {selectedGenre === '전체' ? '전체 도서' : `${selectedGenre} 도서`}
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {filteredBooks.length}권의 도서
                {isSelectionMode && selectedBookIds.length > 0 && ` (${selectedBookIds.length}권 선택됨)`}
              </p>
            </div>
            
            {/* Sort Options */}
            <div className="flex items-center gap-2 ml-4">
              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>정렬:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'title' | 'year' | 'author' | 'stock')}
                className={`px-3 py-1.5 border rounded-lg text-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="title">제목순</option>
                <option value="year">최신순</option>
                <option value="author">저자명순</option>
                {isAdmin && <option value="stock">재고순</option>}
              </select>
              {sortBy === 'stock' && isAdmin && (
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className={`px-3 py-1.5 border rounded-lg text-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="asc">오름차순</option>
                  <option value="desc">내림차순</option>
                </select>
              )}
              {isAdmin && (
                <label className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors border ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={showLowStockOnly}
                    onChange={(e) => setShowLowStockOnly(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className={`text-sm whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>재고 부족</span>
                </label>
              )}
            </div>
          </div>
          {isSelectionMode && getCurrentPageBooks().length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {getCurrentPageBooks().every(b => selectedBookIds.includes(b.id)) ? '전체 해제' : '전체 선택'}
            </button>
          )}
        </div>
        
        <BookList 
          books={getCurrentPageBooks()} 
          purchases={purchases}
          selectedBookIds={selectedBookIds}
          onSelectBook={handleSelectBook}
          onBookClick={handleBookClick}
          isSelectionMode={isSelectionMode}
          isDarkMode={isDarkMode}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              이전
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : isDarkMode
                      ? 'border border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              다음
            </button>
          </div>
        )}
      </main>

      {/* Add/Edit Dialog */}
      {isDialogOpen && (
        <AddBookDialog
          book={editingBook}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingBook(null);
          }}
          onSave={editingBook ? handleEditBook : handleAddBook}
          isDarkMode={isDarkMode}
          isAdmin={currentUser?.role === 'admin'}
        />
      )}

      {/* My Page */}
      {isMyPageOpen && currentUser && (
        <MyPage
          user={currentUser}
          books={isAdmin ? books : books.filter(b => b.createdBy === currentUser.id)}
          purchases={purchases}
          allBooks={books}
          users={users}
          onClose={() => setIsMyPageOpen(false)}
          onPasswordChange={handlePasswordChange}
          onEditBook={(book) => {
            setEditingBook(book);
            setIsDialogOpen(true);
            setIsMyPageOpen(false);
          }}
          onDeleteBook={handleDeleteBook}
          onUpdateBook={(updatedBook) => {
            const oldBook = books.find(b => b.id === updatedBook.id);
            setBooks(books.map(b => b.id === updatedBook.id ? updatedBook : b));
            
            // If status changed from pending to approved, show success message
            if (oldBook?.status === 'pending' && updatedBook.status === 'approved') {
              alert(`"${updatedBook.title}" 도서가 승인되었습니다.\n메인 화면에서 확인하실 수 있습니다.`);
            }
          }}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onCancelPurchase={handleCancelPurchase}
          onReturnPurchase={handleReturnPurchase}
          onPurchaseUpdate={reloadPurchases}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Book Detail Dialog */}
      {selectedBook && currentUser && (
        <BookDetailDialog
          book={selectedBook}
          currentUser={currentUser}
          purchases={purchases}
          onClose={() => setSelectedBookId(null)}
          onUpdateBook={(updatedBook) => {
            setBooks(books.map(b => b.id === updatedBook.id ? updatedBook : b));
            setSelectedBookId(updatedBook.id);
          }}
          onPurchaseBook={handlePurchaseBookWithConfirm}
          onCancelPurchase={handleCancelPurchase}
          onAddToCart={!isAdmin ? handleAddToCart : undefined}
          onToggleWishlist={handleToggleWishlist}
          onLikeReview={handleLikeReview}
          onReportReview={handleReportReview}
          onToggleReviewHidden={isAdmin ? handleToggleReviewHidden : undefined}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Cart */}
      {isCartOpen && !isAdmin && (
        <Cart
          cartItems={cartItems}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onCheckout={handleCartCheckout}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Wishlist */}
      {isWishlistOpen && currentUser && (
        <WishlistDialog
          books={books}
          wishlist={currentUser.wishlist || []}
          onClose={() => setIsWishlistOpen(false)}
          onRemoveFromWishlist={handleRemoveFromWishlist}
          onRemoveFromWishlistBulk={handleRemoveFromWishlistBulk}
          onAddToCart={handleAddToCart}
          onPurchaseBook={handlePurchaseBookWithConfirm}
          onAddToWishlist={handleToggleWishlist}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Checkout Dialog */}
      {isCheckoutOpen && (
        <CheckoutDialog
          items={checkoutItems}
          onClose={() => setIsCheckoutOpen(false)}
          onConfirmPurchase={handleCheckoutComplete}
          isDarkMode={isDarkMode}
          currentUser={currentUser}
        />
      )}

      {/* Purchase Confirm Dialog */}
      {isPurchaseConfirmOpen && pendingPurchaseBook && (
        <PurchaseConfirmDialog
          book={pendingPurchaseBook.book}
          quantity={pendingPurchaseBook.quantity}
          onClose={() => {
            setIsPurchaseConfirmOpen(false);
            setPendingPurchaseBook(null);
          }}
          onGoToCheckout={handleGoToCheckoutFromConfirm}
          onAddToCart={handleAddToCartFromConfirm}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}