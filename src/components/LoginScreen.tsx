import { useState } from 'react';
import { User } from '../App';
import { BookOpen, LogIn, AlertCircle, UserPlus, Search, Key, X, Mail, User as UserIcon, Users, Moon, Sun } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: User) => void;
  users: User[];
  onRegister: (newUser: Omit<User, 'role'>) => User;
  onFindId: (email: string, name: string) => User[];
  onFindPassword: (id: string, email: string, name: string) => User | null;
  isDarkMode?: boolean;
  onToggleDarkMode?: (value: boolean) => void;
}

type ModalType = 'register' | 'findId' | 'findPassword' | null;

export function LoginScreen({ onLogin, users, onRegister, onFindId, onFindPassword, isDarkMode, onToggleDarkMode }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [modalType, setModalType] = useState<ModalType>(null);

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    id: '',
    password: '',
    confirmPassword: '',
    email: '',
    name: '',
    gender: 'male' as 'male' | 'female',
    phone: '',
    zipCode: '',
    address: '',
    detailAddress: ''
  });
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Find ID form state
  const [findIdForm, setFindIdForm] = useState({
    email: '',
    name: '',
    phone: ''
  });
  const [foundIds, setFoundIds] = useState<User[]>([]);
  const [findIdError, setFindIdError] = useState('');

  // Find Password form state
  const [findPwForm, setFindPwForm] = useState({
    id: '',
    email: '',
    name: '',
    phone: ''
  });
  const [foundPassword, setFoundPassword] = useState<string | null>(null);
  const [findPwError, setFindPwError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.id === username && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess(false);

    // Validation
    if (!registerForm.id || !registerForm.password || !registerForm.email || !registerForm.name) {
      setRegisterError('모든 필수 항목을 입력해주세요.');
      return;
    }

    // ID validation - only English letters allowed
    const idRegex = /^[a-zA-Z]+$/;
    if (!idRegex.test(registerForm.id)) {
      setRegisterError('아이디는 영문으로만 입력해주세요.');
      return;
    }

    // Password validation - minimum 6 characters
    if (registerForm.password.length < 6) {
      setRegisterError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      setRegisterError('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    try {
      onRegister({
        id: registerForm.id,
        password: registerForm.password,
        email: registerForm.email,
        name: registerForm.name,
        gender: registerForm.gender,
        phone: registerForm.phone,
        zipCode: registerForm.zipCode,
        address: registerForm.address,
        detailAddress: registerForm.detailAddress
      });

      setRegisterSuccess(true);
      setRegisterForm({
        id: '',
        password: '',
        confirmPassword: '',
        email: '',
        name: '',
        gender: 'male',
        phone: '',
        zipCode: '',
        address: '',
        detailAddress: ''
      });

      setTimeout(() => {
        setModalType(null);
        setRegisterSuccess(false);
      }, 2000);
    } catch (error: any) {
      setRegisterError(error.message);
    }
  };

  const handleFindIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFindIdError('');
    setFoundIds([]);

    if (!findIdForm.email || !findIdForm.name) {
      setFindIdError('이메일과 이름을 입력해주세요.');
      return;
    }

    const results = onFindId(findIdForm.email, findIdForm.name);
    
    if (results.length === 0) {
      setFindIdError('일치하는 계정을 찾을 수 없습니다.');
    } else {
      setFoundIds(results);
    }
  };

  const handleFindPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFindPwError('');
    setFoundPassword(null);

    if (!findPwForm.id || !findPwForm.email || !findPwForm.name) {
      setFindPwError('모든 항목을 입력해주세요.');
      return;
    }

    const result = onFindPassword(findPwForm.id, findPwForm.email, findPwForm.name);
    
    if (!result) {
      setFindPwError('일치하는 계정을 찾을 수 없습니다.');
    } else {
      setFoundPassword(result.password);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setRegisterForm({
      id: '',
      password: '',
      confirmPassword: '',
      email: '',
      name: '',
      gender: 'male',
      phone: '',
      zipCode: '',
      address: '',
      detailAddress: ''
    });
    setFindIdForm({ email: '', name: '', phone: '' });
    setFindPwForm({ id: '', email: '', name: '', phone: '' });
    setRegisterError('');
    setRegisterSuccess(false);
    setFindIdError('');
    setFoundIds([]);
    setFindPwError('');
    setFoundPassword(null);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
      {/* Dark Mode Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => onToggleDarkMode?.(!isDarkMode)}
          className={`p-3 rounded-lg shadow-lg transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
          aria-label="다크모드 토글"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className={isDarkMode ? 'text-white mb-2' : 'text-gray-900 mb-2'}>AI 도서 관리 시스템</h1>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>로그인하여 시작하세요</p>
        </div>

        {/* Login Form */}
        <div className={`rounded-2xl shadow-xl p-8 border transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className={`block text-sm mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                아이디
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300'
                }`}
                placeholder="아이디를 입력하세요"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300'
                }`}
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              로그인
            </button>
          </form>

          {/* Additional Actions */}
          <div className={`mt-6 pt-6 border-t transition-colors ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <button
                onClick={() => setModalType('register')}
                className="text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                회원가입
              </button>
              <button
                onClick={() => setModalType('findId')}
                className={`hover:underline transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                아이디 찾기
              </button>
              <button
                onClick={() => setModalType('findPassword')}
                className={`hover:underline transition-colors ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                비밀번호 찾기
              </button>
            </div>
          </div>

          {/* Admin Info */}
          <div className={`mt-6 p-4 rounded-lg border transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-gray-50 border-gray-200'
          }`}>
            <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>테스트 계정 정보:</p>
            <div className={`space-y-1 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>관리자: ADMIN / 1234</p>
              <p>일반 회원: KT / 1234</p>
            </div>
          </div>
        </div>
      </div>

      {/* Register Modal */}
      {modalType === 'register' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-gray-900">회원가입</h3>
                  <p className="text-sm text-gray-600">새 계정을 만드세요</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">아이디 *</label>
                <input
                  type="text"
                  value={registerForm.id}
                  onChange={(e) => setRegisterForm({...registerForm, id: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="영문으로만 입력"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">비밀번호 *</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="비밀번호 (6자 이상)"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">비밀번호 확인 *</label>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="비밀번호 확인"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">이메일 *</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">이름 *</label>
                <input
                  type="text"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">성별 *</label>
                <select
                  value={registerForm.gender}
                  onChange={(e) => setRegisterForm({...registerForm, gender: e.target.value as 'male' | 'female'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">전화번호</label>
                <input
                  type="text"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="전화번호 입력"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">우편번호</label>
                <input
                  type="text"
                  value={registerForm.zipCode}
                  onChange={(e) => setRegisterForm({...registerForm, zipCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="우편번호 입력"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">주소</label>
                <input
                  type="text"
                  value={registerForm.address}
                  onChange={(e) => setRegisterForm({...registerForm, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="주소 입력"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">상세주소</label>
                <input
                  type="text"
                  value={registerForm.detailAddress}
                  onChange={(e) => setRegisterForm({...registerForm, detailAddress: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="상세주소 입력"
                />
              </div>

              {registerError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600">{registerError}</p>
                </div>
              )}

              {registerSuccess && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <UserPlus className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-600">회원가입이 완료되었습니다!</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  가입하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Find ID Modal */}
      {modalType === 'findId' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-gray-900">아이디 찾기</h3>
                  <p className="text-sm text-gray-600">이메일과 이름으로 찾기</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleFindIdSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={findIdForm.email}
                    onChange={(e) => setFindIdForm({...findIdForm, email: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="등록한 이메일 입력"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">이름</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={findIdForm.name}
                    onChange={(e) => setFindIdForm({...findIdForm, name: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="등록한 이름 입력"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">연락처 (선택)</label>
                <input
                  type="tel"
                  value={findIdForm.phone}
                  onChange={(e) => setFindIdForm({...findIdForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="연락처 입력 (선택사항)"
                />
              </div>

              {findIdError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600">{findIdError}</p>
                </div>
              )}

              {foundIds.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 mb-2">찾은 아이디:</p>
                  <div className="space-y-1">
                    {foundIds.map((user, idx) => (
                      <p key={idx} className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border border-green-200">
                        {user.id}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  찾기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Find Password Modal */}
      {modalType === 'findPassword' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-gray-900">비밀번호 찾기</h3>
                  <p className="text-sm text-gray-600">아이디, 이메일, 이름으로 찾기</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleFindPasswordSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">아이디</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={findPwForm.id}
                    onChange={(e) => setFindPwForm({...findPwForm, id: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="아이디 입력"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={findPwForm.email}
                    onChange={(e) => setFindPwForm({...findPwForm, email: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="등록한 이메일 입력"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">이름</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={findPwForm.name}
                    onChange={(e) => setFindPwForm({...findPwForm, name: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="등록한 이름 입력"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">연락처 (선택)</label>
                <input
                  type="tel"
                  value={findPwForm.phone}
                  onChange={(e) => setFindPwForm({...findPwForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="연락처 입력 (선택사항)"
                />
              </div>

              {findPwError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600">{findPwError}</p>
                </div>
              )}

              {foundPassword && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700 mb-2">찾은 비밀번호:</p>
                  <p className="text-sm text-gray-900 font-mono bg-white px-3 py-2 rounded border border-purple-200">
                    {foundPassword}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  찾기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}