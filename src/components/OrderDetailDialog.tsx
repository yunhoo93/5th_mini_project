import { useState, useEffect } from 'react';
import { X, Package, Calendar, CreditCard, MapPin, Truck, CheckCircle, Clock, AlertCircle, XCircle, FileText, Hash, ShoppingCart, RotateCcw, Plus, Minus } from 'lucide-react';
import { orderService } from '../services/orderService';

interface OrderDetailDialogProps {
  orderId: string;
  onClose: () => void;
  allBooks: Book[];
  isDarkMode?: boolean;
  onPurchaseUpdate?: () => void;
}

interface OrderItem {
  bookId: string;
  quantity: number;
  price: number;
}

interface OrderDetail {
  orderId: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: OrderItem[];
  createdAt: Date;
}

export function OrderDetailDialog({ orderId, onClose, allBooks, isDarkMode, onPurchaseUpdate }: OrderDetailDialogProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // 선택된 도서와 각 도서의 취소/반품 수량 관리
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [returnQuantities, setReturnQuantities] = useState<Map<number, number>>(new Map());
  
  // 관리자 권한 확인
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    loadOrderDetail();
  }, [orderId]);
  
  // 주문 항목 선택/해제
  const toggleSelectItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
      const newQuantities = new Map(returnQuantities);
      newQuantities.delete(index);
      setReturnQuantities(newQuantities);
    } else {
      newSelected.add(index);
      // 기본값으로 1개 설정
      const newQuantities = new Map(returnQuantities);
      newQuantities.set(index, 1);
      setReturnQuantities(newQuantities);
    }
    setSelectedItems(newSelected);
  };
  
  // 반품 수량 조절
  const updateReturnQuantity = (index: number, delta: number) => {
    if (!order) return;
    const currentQty = returnQuantities.get(index) || 1;
    const maxQty = order.items[index].quantity;
    const newQty = Math.max(1, Math.min(maxQty, currentQty + delta));
    const newQuantities = new Map(returnQuantities);
    newQuantities.set(index, newQty);
    setReturnQuantities(newQuantities);
  };
  
  // 선택한 상품만 취소/반품
  const handlePartialReturn = async () => {
    if (!order || selectedItems.size === 0) {
      alert('취소/반품할 상품을 선택해주세요.');
      return;
    }
    
    const selectedItemsList = Array.from(selectedItems).map(index => {
      const item = order.items[index];
      const qty = returnQuantities.get(index) || 1;
      const book = getBookInfo(item.bookId);
      return `${book?.title || item.bookId} (${qty}권)`;
    }).join(', ');
    
    const actionText = order.status === 'delivered' ? '반품' : '취소';
    const confirmMessage = `다음 상품을 ${actionText}하시겠습니까?\n\n${selectedItemsList}`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      setActionLoading(true);
      
      // localStorage에서 주문 데이터 가져오기
      const orders = JSON.parse(localStorage.getItem(`orders_${currentUser.id}`) || '[]');
      const orderIndex = orders.findIndex((o: any) => o.orderId === orderId);
      
      if (orderIndex !== -1) {
        // 선택한 항목들의 수량 감소 또는 제거
        const updatedItems = order.items.map((item, index) => {
          if (selectedItems.has(index)) {
            const returnQty = returnQuantities.get(index) || 1;
            const remainingQty = item.quantity - returnQty;
            
            if (remainingQty > 0) {
              return { ...item, quantity: remainingQty };
            }
            return null; // 전체 반품인 경우 null로 표시
          }
          return item;
        }).filter(item => item !== null); // null 항목 제거
        
        if (updatedItems.length === 0) {
          // 모든 항목이 취소되면 주문 자체를 취소 상태로 변경
          orders[orderIndex].status = 'cancelled';
        } else {
          // 일부 항목만 취소되면 항목 업데이트 및 총액 재계산
          orders[orderIndex].items = updatedItems;
          orders[orderIndex].totalAmount = updatedItems.reduce(
            (sum: number, item: any) => sum + (item.price * item.quantity),
            0
          );
        }
        
        localStorage.setItem(`orders_${currentUser.id}`, JSON.stringify(orders));
        
        // purchases 데이터도 업데이트 - 삭제하지 않고 상태를 'cancelled'로 변경
        let purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
        
        // 선택한 항목들을 purchases에서 'cancelled' 상태로 변경
        Array.from(selectedItems).forEach(index => {
          const item = order.items[index];
          const returnQty = returnQuantities.get(index) || 1;
          
          // 해당 bookId의 purchase를 찾아서 returnQty만큼 취소 상태로 변경
          let cancelledCount = 0;
          purchases = purchases.map((purchase: any) => {
            if (purchase.bookId === item.bookId && 
                purchase.userId === currentUser.id && 
                purchase.status !== 'cancelled' &&
                cancelledCount < returnQty) {
              cancelledCount++;
              return { ...purchase, status: 'cancelled' };
            }
            return purchase;
          });
        });
        
        localStorage.setItem('purchases', JSON.stringify(purchases));
      }
      
      alert(`${actionText}이 완료되었습니다.`);
      
      // 선택 초기화
      setSelectedItems(new Set());
      setReturnQuantities(new Map());
      
      // Refresh purchases in parent component
      if (onPurchaseUpdate) onPurchaseUpdate();
      
      await loadOrderDetail();
    } catch (err: any) {
      alert(`${actionText}에 실패했습니다.`);
    } finally {
      setActionLoading(false);
    }
  };

  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await orderService.getOrder(orderId);
      setOrder(data);
    } catch (err: any) {
      console.error('Error loading order detail:', err);
      setError(err.message || '주문 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    
    const confirmMessage = order.status === 'paid' 
      ? '결제 완료된 주문을 취소하시겠습니까?' 
      : order.status === 'shipped'
      ? '배송 중인 주문을 취소하시겠습니까? 반품 처리됩니다.'
      : order.status === 'delivered'
      ? '배송 완료된 주문을 반품하시겠습니까?'
      : '주문을 취소하시겠습니까?';
    
    if (!confirm(confirmMessage)) return;

    try {
      setActionLoading(true);
      
      // orderService를 통해 주문 취소
      await orderService.cancelOrder(orderId);
      
      // purchases 데이터도 업데이트 - 삭제하지 않고 상태를 'cancelled'로 변경
      let purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
      
      // 주문의 모든 항목을 purchases에서 'cancelled' 상태로 변경
      order.items.forEach(item => {
        let cancelledCount = 0;
        purchases = purchases.map((purchase: any) => {
          if (purchase.bookId === item.bookId && 
              purchase.userId === currentUser.id && 
              purchase.status !== 'cancelled' &&
              cancelledCount < item.quantity) {
            cancelledCount++;
            return { ...purchase, status: 'cancelled' };
          }
          return purchase;
        });
      });
      
      localStorage.setItem('purchases', JSON.stringify(purchases));
      
      // Refresh purchases in parent component
      if (onPurchaseUpdate) onPurchaseUpdate();
      
      alert('주문이 취소되었습니다.');
      await loadOrderDetail();
    } catch (err: any) {
      alert(err.message || '주문 취소에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = async (newStatus: 'paid' | 'shipped' | 'delivered') => {
    if (!order) return;
    
    try {
      setActionLoading(true);
      // Update order status in localStorage
      const orders = JSON.parse(localStorage.getItem(`orders_${currentUser.id}`) || '[]');
      
      const orderIndex = orders.findIndex((o: any) => o.orderId === orderId);
      if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        localStorage.setItem(`orders_${currentUser.id}`, JSON.stringify(orders));
      }
      
      await loadOrderDetail();
      
      const statusMessages = {
        paid: '주문이 결제 완료 상태로 변경되었습니다.',
        shipped: '주문이 배송 중 상태로 변경되었습니다.',
        delivered: '주문이 배송 완료 상태로 변경되었습니다.'
      };
      alert(statusMessages[newStatus]);
    } catch (err: any) {
      alert('상태 변경에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: '결제 대기',
          icon: <Clock className="w-5 h-5" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'paid':
        return {
          label: '결제 완료',
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'shipped':
        return {
          label: '배송 중',
          icon: <Truck className="w-5 h-5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'delivered':
        return {
          label: '배송 완료',
          icon: <Package className="w-5 h-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
      case 'cancelled':
        return {
          label: '주문 취소',
          icon: <XCircle className="w-5 h-5" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      default:
        return {
          label: status,
          icon: <AlertCircle className="w-5 h-5" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const getBookInfo = (bookId: string) => {
    return allBooks.find(b => b.id === bookId);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className={`rounded-lg shadow-xl max-w-3xl w-full p-8 transition-colors ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              주문 정보를 불러오는 중...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className={`rounded-lg shadow-xl max-w-md w-full transition-colors ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className={`border-b px-6 py-4 flex items-center justify-between transition-colors ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className={isDarkMode ? 'text-white' : 'text-gray-900'}>오류</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className={`mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  주문 정보를 불러올 수 없습니다
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {error || '알 수 없는 오류가 발생했습니다.'}
                </p>
              </div>
            </div>
          </div>
          <div className={`border-t px-6 py-4 flex justify-end transition-colors ${
            isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
          }`}>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className={`rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between transition-colors z-10 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className={isDarkMode ? 'text-white' : 'text-gray-900'}>주문 상세 정보</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                주문번호: {order.orderId}
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
        <div className="p-6 space-y-6">
          {/* Status & Date Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Order Status */}
            <div className={`border-2 rounded-lg p-4 ${statusInfo.borderColor} ${statusInfo.bgColor}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={statusInfo.color}>
                  {statusInfo.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-600">주문 상태</p>
                  <p className={`${statusInfo.color}`}>
                    {statusInfo.label}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Date */}
            <div className={`border rounded-lg p-4 transition-colors ${
              isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>주문 일시</p>
                  <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className={`flex items-center gap-2 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <ShoppingCart className="w-5 h-5" />
              주문 항목
              {order.status !== 'cancelled' && (
                <span className={`text-xs ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  (체크박스를 클릭하여 취소/반품할 상품을 선택하세요)
                </span>
              )}
            </h3>
            <div className="space-y-3">
              {order.items.map((item, index) => {
                const book = getBookInfo(item.bookId);
                const isSelected = selectedItems.has(index);
                const returnQty = returnQuantities.get(index) || 1;
                
                return (
                  <div
                    key={index}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      isSelected
                        ? isDarkMode 
                          ? 'border-red-500 bg-red-900 bg-opacity-20' 
                          : 'border-red-500 bg-red-50'
                        : isDarkMode 
                          ? 'border-gray-700 bg-gray-750' 
                          : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Checkbox */}
                      {order.status !== 'cancelled' && (
                        <div className="flex items-start pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(index)}
                            className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                          />
                        </div>
                      )}
                      
                      {/* Book Image */}
                      <div className="w-16 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex-shrink-0 overflow-hidden">
                        {book?.coverImage ? (
                          <img
                            src={book.coverImage}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-8 h-8 text-blue-600" />
                          </div>
                        )}
                      </div>

                      {/* Book Info */}
                      <div className="flex-1">
                        <h4 className={`mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {book?.title || `도서 ID: ${item.bookId}`}
                        </h4>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {book?.author || '-'}
                        </p>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            수량: {item.quantity}권
                          </span>
                          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            단가: {formatPrice(item.price)}원
                          </span>
                        </div>
                        
                        {/* Quantity Control (when selected) */}
                        {isSelected && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              취소/반품 수량:
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateReturnQuantity(index, -1)}
                                disabled={returnQty <= 1}
                                className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                                  returnQty <= 1
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className={`w-10 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {returnQty}
                              </span>
                              <button
                                onClick={() => updateReturnQuantity(index, 1)}
                                disabled={returnQty >= item.quantity}
                                className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                                  returnQty >= item.quantity
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              (최대 {item.quantity}권)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>소계</p>
                        <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatPrice(item.price * item.quantity)}원
                        </p>
                        {isSelected && (
                          <p className={`text-sm mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                            환불: {formatPrice(item.price * returnQty)}원
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Summary */}
          <div className={`border-2 rounded-lg p-6 transition-colors ${
            isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
          }`}>
            <h3 className={`flex items-center gap-2 mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <CreditCard className="w-5 h-5" />
              결제 정보
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>상품 금액</span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  {formatPrice(order.totalAmount)}원
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>배송비</span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>무료</span>
              </div>
              <div className={`border-t pt-3 flex justify-between items-center transition-colors ${
                isDarkMode ? 'border-gray-700' : 'border-gray-300'
              }`}>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>총 결제 금액</span>
                <span className="text-blue-600 text-2xl">
                  {formatPrice(order.totalAmount)}원
                </span>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className={`border rounded-lg p-4 transition-colors ${
            isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
          }`}>
            <h3 className={`flex items-center gap-2 mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Hash className="w-5 h-5" />
              주문 정보
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex">
                <span className={`w-32 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>주문번호</span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{order.orderId}</span>
              </div>
              <div className="flex">
                <span className={`w-32 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>주문 상태</span>
                <span className={statusInfo.color}>{statusInfo.label}</span>
              </div>
              <div className="flex">
                <span className={`w-32 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>주문 일시</span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex">
                <span className={`w-32 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>총 상품 수</span>
                <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  {order.items.reduce((sum, item) => sum + item.quantity, 0)}권
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 border-t px-6 py-4 flex justify-between items-center transition-colors ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            {order.status !== 'cancelled' && selectedItems.size > 0 && (
              <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span>{selectedItems.size}개 상품 선택됨</span>
                <span className="mx-2">•</span>
                <span className={isDarkMode ? 'text-red-400' : 'text-red-600'}>
                  환불 예상 금액: {formatPrice(
                    Array.from(selectedItems).reduce((sum, index) => {
                      const item = order.items[index];
                      const qty = returnQuantities.get(index) || 1;
                      return sum + (item.price * qty);
                    }, 0)
                  )}원
                </span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`px-6 py-2 border rounded-lg transition-colors ${
                isDarkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              닫기
            </button>
            
            {/* Test buttons for status change - 관리자만 볼 수 있음 */}
            {isAdmin && order.status === 'pending' && (
              <button
                onClick={() => handleChangeStatus('paid')}
                className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
                  actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={actionLoading}
              >
                결제 완료로 변경
              </button>
            )}
            {isAdmin && order.status === 'paid' && (
              <button
                onClick={() => handleChangeStatus('shipped')}
                className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                  actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={actionLoading}
              >
                배송 중으로 변경
              </button>
            )}
            {isAdmin && order.status === 'shipped' && (
              <button
                onClick={() => handleChangeStatus('delivered')}
                className={`px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${
                  actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={actionLoading}
              >
                배송 완료로 변경
              </button>
            )}
            
            {/* Partial return/cancel button */}
            {order.status !== 'cancelled' && (
              <>
                <button
                  onClick={handlePartialReturn}
                  disabled={selectedItems.size === 0 || actionLoading}
                  className={`px-6 py-2 rounded-lg transition-colors ${
                    selectedItems.size === 0 || actionLoading
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  선택 상품 {order.status === 'delivered' ? '반품' : '취소'} ({selectedItems.size})
                </button>
                
                <button
                  onClick={handleCancelOrder}
                  disabled={actionLoading}
                  className={`px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${
                    actionLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  전체 주문 {order.status === 'delivered' ? '반품' : '취소'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}