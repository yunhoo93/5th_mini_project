import { useState, useEffect } from 'react';
import { Book } from '../App';
import { X, Sparkles, Upload } from 'lucide-react';
import { AIImageGenerator } from './AIImageGenerator';

interface AddBookDialogProps {
  book: Book | null;
  onClose: () => void;
  onSave: (book: any) => void;
  isDarkMode?: boolean;
  isAdmin?: boolean; // 관리자 여부 추가
}

export function AddBookDialog({ book, onClose, onSave, isDarkMode, isAdmin = true }: AddBookDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '소설',
    description: '',
    coverImage: '',
    publishedYear: new Date().getFullYear(),
    price: 15000,
    stock: 50
  });

  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [imageInputMethod, setImageInputMethod] = useState<'upload' | 'url'>('upload');

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        genre: book.genre,
        description: book.description,
        coverImage: book.coverImage,
        publishedYear: book.publishedYear,
        price: book.price || 15000,
        stock: book.stock || 50
      });
    }
  }, [book]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (book) {
      onSave({ ...book, ...formData });
    } else {
      onSave(formData);
    }
  };

  const handleAIGenerate = (imageUrl: string) => {
    setFormData({ ...formData, coverImage: imageUrl });
    setShowAIGenerator(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className={`rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto transition-colors ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Dialog Header */}
        <div className={`sticky top-0 border-b px-6 py-4 flex items-center justify-between transition-colors ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className={isDarkMode ? 'text-white' : 'text-gray-900'}>
            {book ? '도서 편집' : (isAdmin ? '신규 도서 등록' : '도서 요청')}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>

        {/* Dialog Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className={`block text-sm mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                도서 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300'
                }`}
                placeholder=""
              />
            </div>

            {/* Author */}
            <div>
              <label className={`block text-sm mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                저자 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300'
                }`}
                placeholder=""
              />
            </div>

            {/* Genre, Published Year, Stock - in one row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={`block text-sm mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  장르
                </label>
                <select
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'border-gray-300'
                  }`}
                >
                  <option value="소설">소설</option>
                  <option value="SF">SF</option>
                  <option value="판타지">판타지</option>
                  <option value="미스터리">미스터리</option>
                  <option value="로맨스">로맨스</option>
                  <option value="추리">추리</option>
                  <option value="스릴러">스릴러</option>
                  <option value="공포">공포</option>
                  <option value="무협">무협</option>
                  <option value="라이트노벨">라이트노벨</option>
                  <option value="자기계발">자기계발</option>
                  <option value="에세이">에세이</option>
                  <option value="시/詩">시/詩</option>
                  <option value="역사">역사</option>
                  <option value="철학">철학</option>
                  <option value="종교">종교</option>
                  <option value="과학">과학</option>
                  <option value="기술/공학">기술/공학</option>
                  <option value="컴퓨터/IT">컴퓨터/IT</option>
                  <option value="의학">의학</option>
                  <option value="경제">경제</option>
                  <option value="경영">경영</option>
                  <option value="정치">정치</option>
                  <option value="사회">사회</option>
                  <option value="예술">예술</option>
                  <option value="여행">여행</option>
                  <option value="요리">요리</option>
                  <option value="건강">건강</option>
                  <option value="육아">육아</option>
                  <option value="만화">만화</option>
                  <option value="잡지">잡지</option>
                  <option value="사전">사전</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  출판년도
                </label>
                <input
                  type="number"
                  value={formData.publishedYear}
                  onChange={(e) => {
                    const year = parseInt(e.target.value);
                    if (!isNaN(year) || e.target.value === '') {
                      setFormData({ ...formData, publishedYear: isNaN(year) ? new Date().getFullYear() : year });
                    }
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'border-gray-300'
                  }`}
                  min="1000"
                  max="2100"
                  placeholder="2025"
                />
              </div>

              <div>
                <label className={`block text-sm mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <span className="text-blue-600">재고</span> 수량
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => {
                    const stock = parseInt(e.target.value);
                    if (!isNaN(stock) || e.target.value === '') {
                      setFormData({ ...formData, stock: isNaN(stock) ? 50 : stock });
                    }
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'border-gray-300'
                  }`}
                  min="0"
                  placeholder="50"
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className={`block text-sm mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                가격
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => {
                  const price = parseInt(e.target.value);
                  if (!isNaN(price) || e.target.value === '') {
                    setFormData({ ...formData, price: isNaN(price) ? 15000 : price });
                  }
                }}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300'
                }`}
                min="0"
                placeholder=""
              />
            </div>

            {/* Description */}
            <div>
              <label className={`block text-sm mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'border-gray-300'
                }`}
                placeholder=""
              />
            </div>

            {/* Cover Image - 관리자만 표시 */}
            {isAdmin && (
              <div>
                <label className={`block text-sm mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  표지 이미지
                </label>

                {/* Tab switcher */}
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setImageInputMethod('upload')}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${
                      imageInputMethod === 'upload'
                        ? isDarkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-900'
                        : isDarkMode
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    이미지 첨부
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputMethod('url')}
                    className={`px-3 py-1.5 text-sm rounded transition-colors ${
                      imageInputMethod === 'url'
                        ? isDarkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-900'
                        : isDarkMode
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    이미지 URL 직접 입력
                  </button>
                </div>

                {/* Image input based on method */}
                {imageInputMethod === 'url' ? (
                  <input
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'border-gray-300'
                    }`}
                    placeholder="이미지 URL 직접 입력"
                  />
                ) : (
                  <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                    isDarkMode 
                      ? 'border-gray-600 hover:border-gray-500' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <Upload className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      파일을 드래그하거나 클릭하여 업로드
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      또는 아래 URL 입력 탭을 사용하세요
                    </p>
                  </div>
                )}

                {/* AI Generate Button */}
                <button
                  type="button"
                  onClick={() => setShowAIGenerator(true)}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  AI 표지 생성하기
                </button>
                
                {formData.coverImage && (
                  <div className={`mt-3 border rounded-lg p-3 transition-colors ${
                    isDarkMode ? 'border-gray-600' : 'border-gray-200'
                  }`}>
                    <p className={`text-xs mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>미리보기</p>
                    <img
                      src={formData.coverImage}
                      alt="미리보기"
                      className="w-24 h-32 object-cover rounded mx-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x300?text=No+Image';
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dialog Actions */}
          <div className={`flex justify-end gap-3 mt-6 pt-4 border-t transition-colors ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-lg transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 text-white hover:bg-gray-600' 
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {book ? '도서 수정' : (isAdmin ? '도서 등록' : '도서 요청')}
            </button>
          </div>
        </form>
      </div>

      {/* AI Image Generator Dialog */}
      {showAIGenerator && (
        <AIImageGenerator
          bookId={book?.id} // 기존 도서 수정 시에만 ID 전달
          bookTitle={formData.title}
          bookGenre={formData.genre}
          onClose={() => setShowAIGenerator(false)}
          onGenerate={handleAIGenerate}
        />
      )}
    </div>
  );
}