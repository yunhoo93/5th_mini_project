import { Book, Purchase } from '../App';
import { Calendar, Check, Star, Package } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface BookCardProps {
  book: Book;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onBookClick: (book: Book) => void;
  isSelectionMode: boolean;
  purchases: Purchase[];
  isDarkMode?: boolean;
}

export function BookCard({ book, isSelected, onSelect, onBookClick, isSelectionMode, purchases, isDarkMode }: BookCardProps) {
  const handleClick = () => {
    if (isSelectionMode) {
      onSelect(book.id);
    } else {
      onBookClick(book);
    }
  };

  // Calculate average rating
  const calculateAverageRating = () => {
    if (!book.ratings || book.ratings.length === 0) return 0;
    const sum = book.ratings.reduce((acc, r) => acc + r.rating, 0);
    return sum / book.ratings.length;
  };

  const averageRating = calculateAverageRating();

  return (
    <div 
      onClick={handleClick}
      className={`rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative cursor-pointer transform hover:scale-105 h-full flex flex-col ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } ${
        isSelected ? 'ring-2 ring-blue-600' : ''
      }`}
    >
      {/* Selection Checkbox - Only visible in selection mode */}
      {isSelectionMode && (
        <div className="absolute top-2 left-2 z-10">
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-blue-600 border-blue-600'
                : isDarkMode
                ? 'bg-gray-700 border-gray-500 hover:border-blue-400'
                : 'bg-white border-gray-300 hover:border-blue-400'
            }`}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
        </div>
      )}

      {/* Book Cover - Reduced height */}
      <div className={`relative aspect-[3/2] overflow-hidden ${
        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
      }`}>
        <ImageWithFallback
          src={book.coverImage}
          alt={book.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-1 right-1 bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px]">
          {book.genre}
        </div>
      </div>

      {/* Book Info */}
      <div className="p-3">
        <h3 className={`text-sm mb-1 line-clamp-1 ${
          isDarkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>{book.title}</h3>
        <p className={`text-xs mb-2 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>{book.author}</p>
        
        <p className={`text-xs line-clamp-2 mb-3 ${
          isDarkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>
          {book.description}
        </p>

        <div className={`flex items-center justify-between text-[10px] ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {book.publishedYear}
            </div>
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              재고 {book.stock}권
            </div>
          </div>
          {averageRating > 0 && (
            <div className="flex items-center gap-1 text-yellow-600">
              <Star className="w-3 h-3 fill-yellow-500" />
              {averageRating.toFixed(1)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}