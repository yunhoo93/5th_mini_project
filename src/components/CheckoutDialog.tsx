import { useState } from 'react';
import { X, CreditCard, Truck, MapPin, Phone, User as UserIcon } from 'lucide-react';
import { Book, User } from '../App';

export interface CheckoutItem {
  book: Book;
  quantity: number;
}

interface CheckoutDialogProps {
  items: CheckoutItem[];
  onClose: () => void;
  onConfirmPurchase: (paymentInfo: PaymentInfo) => void;
  isDarkMode?: boolean;
  currentUser?: User;
}

export interface PaymentInfo {
  paymentMethod: 'card' | 'transfer' | 'phone' | 'kakao';
  recipient: string;
  phone: string;
  address: string;
  detailAddress: string;
  zipCode: string;
  deliveryRequest?: string;
}

export function CheckoutDialog({ items, onClose, onConfirmPurchase, isDarkMode = false, currentUser }: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'phone' | 'kakao'>('card');
  const [recipient, setRecipient] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [address, setAddress] = useState(currentUser?.address || '');
  const [detailAddress, setDetailAddress] = useState(currentUser?.detailAddress || '');
  const [zipCode, setZipCode] = useState(currentUser?.zipCode || '');
  const [deliveryRequest, setDeliveryRequest] = useState('');

  const totalAmount = items.reduce((sum, item) => sum + item.book.price * item.quantity, 0);
  const deliveryFee = totalAmount >= 30000 ? 0 : 3000;
  const finalAmount = totalAmount + deliveryFee;

  const handleConfirm = () => {
    // Validation
    if (!recipient.trim()) {
      alert('받는 분 성함을 입력해주세요.');
      return;
    }
    if (!phone.trim()) {
      alert('연락처를 입력해주세요.');
      return;
    }
    if (!zipCode.trim()) {
      alert('우편번호를 입력해주세요.');
      return;
    }
    if (!address.trim()) {
      alert('주소를 입력해주세요.');
      return;
    }
    if (!detailAddress.trim()) {
      alert('상세주소를 입력해주세요.');
      return;
    }

    const paymentInfo: PaymentInfo = {
      paymentMethod,
      recipient,
      phone,
      address,
      detailAddress,
      zipCode,
      deliveryRequest
    };

    onConfirmPurchase(paymentInfo);
  };

  const paymentOptions = [
    { value: 'card', label: '신용/체크카드', icon: CreditCard },
    { value: 'transfer', label: '계좌이체', icon: CreditCard },
    { value: 'phone', label: '휴대폰 결제', icon: Phone },
    { value: 'kakao', label: '카카오페이', icon: CreditCard }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-2xl">주문/결제</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Items */}
          <div>
            <h3 className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5" />
              주문 상품
            </h3>
            <div className={`rounded-lg border ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              {items.map((item, index) => (
                <div
                  key={item.book.id}
                  className={`flex gap-4 p-4 ${
                    index !== items.length - 1 ? (isDarkMode ? 'border-b border-gray-700' : 'border-b border-gray-200') : ''
                  }`}
                >
                  <img
                    src={item.book.coverImage}
                    alt={item.book.title}
                    className="w-20 h-28 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className={isDarkMode ? 'text-white' : 'text-gray-900'}>{item.book.title}</h4>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.book.author}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                        수량: {item.quantity}권
                      </span>
                      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                        {(item.book.price * item.quantity).toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5" />
              결제 방법
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {paymentOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setPaymentMethod(option.value as any)}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === option.value
                        ? isDarkMode
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-blue-500 bg-blue-50'
                        : isDarkMode
                        ? 'border-gray-700 hover:border-gray-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delivery Information */}
          <div>
            <h3 className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5" />
              배송 정보
            </h3>
            <div className="space-y-3">
              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  받는 분 성함 *
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="홍길동"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  연락처 *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    우편번호 *
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="12345"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <button
                  type="button"
                  className={`px-6 py-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  } transition-colors mt-6`}
                >
                  우편번호 찾기
                </button>
              </div>

              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  주소 *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="서울시 강남구 테헤란로 123"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  상세주소 *
                </label>
                <input
                  type="text"
                  value={detailAddress}
                  onChange={(e) => setDetailAddress(e.target.value)}
                  placeholder="아파트 동/호수, 건물명 등"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  배송 요청사항
                </label>
                <textarea
                  value={deliveryRequest}
                  onChange={(e) => setDeliveryRequest(e.target.value)}
                  placeholder="배송 시 요청사항을 입력해주세요 (선택)"
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
                />
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className={`rounded-lg p-4 ${
            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'
          }`}>
            <h3 className="mb-3">결제 정보</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>상품 금액</span>
                <span>{totalAmount.toLocaleString()}원</span>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>배송비</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-green-500">무료</span>
                  ) : (
                    `${deliveryFee.toLocaleString()}원`
                  )}
                </span>
              </div>
              {totalAmount < 30000 && (
                <p className="text-sm text-blue-500">
                  {(30000 - totalAmount).toLocaleString()}원 더 구매하시면 무료배송!
                </p>
              )}
              <div className={`pt-3 border-t ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="text-lg">총 결제 금액</span>
                  <span className="text-2xl text-blue-500">{finalAmount.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`flex-1 px-6 py-3 rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
              }`}
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {finalAmount.toLocaleString()}원 결제하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}