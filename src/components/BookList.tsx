import { Book, Purchase } from '../App';
import { BookCard } from './BookCard';

interface BookListProps {
  books: Book[];
  purchases: Purchase[];
  selectedBookIds: string[];
  onSelectBook: (id: string) => void;
  onBookClick: (book: Book) => void;
  isSelectionMode: boolean;
  isDarkMode?: boolean;
}

export function BookList({ books, purchases, selectedBookIds, onSelectBook, onBookClick, isSelectionMode, isDarkMode }: BookListProps) {
  if (books.length === 0) {
    return (
      <div className={`rounded-lg shadow-sm p-12 text-center transition-colors ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <svg className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className={isDarkMode ? 'text-gray-200 mb-2' : 'text-gray-900 mb-2'}>도서가 없습니다</h3>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>새로운 도서를 추가해보세요</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-4">
      {books.map(book => (
        <BookCard
          key={book.id}
          book={book}
          purchases={purchases}
          isSelected={selectedBookIds.includes(book.id)}
          onSelect={onSelectBook}
          onBookClick={onBookClick}
          isSelectionMode={isSelectionMode}
          isDarkMode={isDarkMode}
        />
      ))}
    </div>
  );
}