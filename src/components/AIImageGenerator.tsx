import { useState, useEffect } from 'react';
import { X, Sparkles, Wand2, RefreshCw, Palette, Image as ImageIcon, AlertCircle, Key } from 'lucide-react';
import { bookService } from '../services/bookService';

interface AIImageGeneratorProps {
  bookId?: string; // 기존 도서 ID (표지 재생성용)
  bookTitle: string;
  bookGenre: string;
  onClose: () => void;
  onGenerate: (imageUrl: string) => void;
}

export function AIImageGenerator({ bookId, bookTitle, bookGenre, onClose, onGenerate }: AIImageGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [activeStyle, setActiveStyle] = useState<'auto' | 'minimalist' | 'artistic' | 'vintage' | 'modern'>('auto');
  const [customPrompt, setCustomPrompt] = useState<string>(''); // 커스텀 프롬프트 추가
  const [apiKey, setApiKey] = useState<string>(''); // API 키 초기값을 빈 문자열로 설정 (localStorage 제거)
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(true); // 항상 입력창 표시

  // localStorage 저장 기능 제거 (useEffect 삭제)

  const styleOptions = [
    { id: 'auto' as const, label: '자동', icon: <Sparkles className="w-4 h-4" />, description: '장르 기반 자동 선택' },
    { id: 'minimalist' as const, label: '미니멀', icon: <Palette className="w-4 h-4" />, description: '심플하고 깔끔한 디자인' },
    { id: 'artistic' as const, label: '예술적', icon: <Wand2 className="w-4 h-4" />, description: '창의적이고 독특한 스타일' },
    { id: 'vintage' as const, label: '빈티지', icon: <ImageIcon className="w-4 h-4" />, description: '고전적이고 레트로한 느낌' },
    { id: 'modern' as const, label: '모던', icon: <Palette className="w-4 h-4" />, description: '세련되고 현대적인 감각' }
  ];

  // Generate AI prompt based on style and genre
  const generatePrompt = (): string => {
    const basePrompt = `Professional book cover design for "${bookTitle}"`;
    
    let stylePrompt = '';
    switch (activeStyle) {
      case 'minimalist':
        stylePrompt = 'minimalist, clean, simple, modern typography, solid colors, geometric shapes';
        break;
      case 'artistic':
        stylePrompt = 'artistic, creative, unique illustration, expressive, vibrant colors, imaginative';
        break;
      case 'vintage':
        stylePrompt = 'vintage, retro, classic book design, aged paper texture, traditional typography';
        break;
      case 'modern':
        stylePrompt = 'modern, contemporary, sleek design, bold typography, sophisticated color palette';
        break;
      case 'auto':
      default:
        // Auto-select style based on genre
        const genreLower = bookGenre.toLowerCase();
        if (genreLower.includes('소설') || genreLower.includes('문학')) {
          stylePrompt = 'literary, elegant, artistic, sophisticated';
        } else if (genreLower.includes('sf') || genreLower.includes('판타지')) {
          stylePrompt = 'sci-fi fantasy, imaginative, dramatic, vibrant';
        } else if (genreLower.includes('역사')) {
          stylePrompt = 'historical, vintage, classic, textured';
        } else if (genreLower.includes('자기계발') || genreLower.includes('비즈니스')) {
          stylePrompt = 'professional, modern, clean, inspiring';
        } else {
          stylePrompt = 'professional, modern, appealing';
        }
        break;
    }

    return `${basePrompt}, ${stylePrompt}, high quality, professional publishing, centered composition, no text`;
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError('OpenAI API 키를 입력해주세요.');
      setShowApiKeyInput(true);
      return;
    }

    if (!bookTitle.trim()) {
      setError('도서 제목을 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedImage(null);
    
    try {
      const prompt = customPrompt || generatePrompt();
      
      // Call OpenAI DALL-E 3 API directly
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('유효하지 않은 API 키입니다. API 키를 확인해주세요.');
        } else if (response.status === 429) {
          throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          throw new Error(errorData.error?.message || 'AI 이미지 생성 중 오류가 발생했습니다.');
        }
      }

      const data = await response.json();
      
      if (data.data && data.data[0] && data.data[0].url) {
        setGeneratedImage(data.data[0].url);
      } else {
        throw new Error('이미지 URL을 받아오지 못했습니다.');
      }
    } catch (err: any) {
      console.error('Error generating image:', err);
      setError(err.message || '이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseImage = () => {
    if (generatedImage) {
      onGenerate(generatedImage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-lg z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2>AI 표지 생성</h2>
              <p className="text-sm text-purple-100">OpenAI DALL-E 3로 전문가급 표지를 만들어보세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* API Key Input Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm text-gray-700">
                OpenAI API 키
              </label>
              {!showApiKeyInput && apiKey && (
                <button
                  onClick={() => setShowApiKeyInput(true)}
                  className="text-xs text-purple-600 hover:text-purple-700 underline"
                >
                  변경
                </button>
              )}
            </div>
            
            {showApiKeyInput ? (
              <div className="space-y-3">
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-900">
                    <strong>💡 API 키 발급 방법:</strong><br />
                    1. <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700">OpenAI Platform</a>에 접속<br />
                    2. "Create new secret key" 클릭하여 새 키 생성<br />
                    3. 생성된 키를 복사하여 여기에 붙여넣기<br />
                    ⚠️ 보안을 위해 API 키는 저장되지 않으며 매번 입력해야 합니다
                  </p>
                </div>
                {apiKey && (
                  <button
                    onClick={() => setShowApiKeyInput(false)}
                    className="text-xs text-gray-600 hover:text-gray-700"
                  >
                    닫기
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-900 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  API 키가 설정되었습니다
                </p>
              </div>
            )}
          </div>

          {/* Book Info */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 mb-6 border border-purple-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 mb-1">
                  {bookTitle || '제목 미입력'}
                </h3>
                <p className="text-sm text-gray-600">장르: {bookGenre}</p>
                {bookId && (
                  <p className="text-xs text-gray-500 mt-1">도서 ID: {bookId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-red-900 mb-1">오류 발생</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Style Selection */}
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-3">
              표지 스타일 선택
            </label>
            <div className="grid grid-cols-5 gap-3">
              {styleOptions.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setActiveStyle(style.id)}
                  disabled={isGenerating}
                  className={`p-3 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeStyle === style.id
                      ? 'border-purple-600 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`flex items-center justify-center mb-2 ${
                    activeStyle === style.id ? 'text-purple-600' : 'text-gray-600'
                  }`}>
                    {style.icon}
                  </div>
                  <div className={`text-xs text-center mb-1 ${
                    activeStyle === style.id ? 'text-purple-900' : 'text-gray-700'
                  }`}>
                    {style.label}
                  </div>
                  <div className={`text-[10px] text-center ${
                    activeStyle === style.id ? 'text-purple-700' : 'text-gray-500'
                  }`}>
                    {style.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt Input */}
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-3">
              커스텀 프롬프트 (선택 사항)
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="예: '미니멀한 스타일의 판타지 소설 표지'"
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Generate Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !apiKey.trim() || !bookTitle.trim()}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  AI가 표지를 생성하는 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  AI 표지 생성하기
                </>
              )}
            </button>
            {(!apiKey.trim() || !bookTitle.trim()) && (
              <p className="text-xs text-red-600 mt-2 text-center">
                ⚠️ API 키와 도서 제목을 모두 입력해주세요
              </p>
            )}
          </div>

          {/* Generated Image */}
          {generatedImage && (
            <div>
              <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                생성된 표지 이미지
              </h3>
              <div className="relative aspect-[3/4] max-w-sm mx-auto rounded-lg overflow-hidden border-2 border-purple-600 shadow-lg">
                <img
                  src={generatedImage}
                  alt="생성된 표지"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-3 right-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!generatedImage && !isGenerating && !error && (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-gray-900 mb-2">AI로 표지를 생성해보세요</h3>
              <p className="text-gray-500 mb-4">
                OpenAI API 키를 입력하고 스타일을 선택한 후<br />
                '생성' 버튼을 클릭하면 전문가급 표지가 만들어집니다
              </p>
            </div>
          )}

          {/* Loading State */}
          {isGenerating && !generatedImage && (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
              <h3 className="text-gray-900 mb-2">AI가 표지를 생성하는 중...</h3>
              <p className="text-gray-500">
                잠시만 기다려주세요. OpenAI DALL-E 3가<br />
                최적의 표지 이미지를 생성하고 있습니다.
              </p>
            </div>
          )}

          {/* API Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <ImageIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="mb-2">
                  <strong>📋 OpenAI DALL-E 3 사용</strong>
                </p>
                <ul className="space-y-1 text-blue-800">
                  <li>• 프론트엔드에서 직접 OpenAI API 호출</li>
                  <li>• API 키는 저장되지 않으며 매번 입력 필요합니다</li>
                  <li>• 생성된 이미지는 24시간 동안 유효합니다</li>
                  <li>• 비용: 이미지당 약 $0.04 (DALL-E 3 standard quality)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleUseImage}
            disabled={!generatedImage}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이 표지 사용하기
          </button>
        </div>
      </div>
    </div>
  );
}