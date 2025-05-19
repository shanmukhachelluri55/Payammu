interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    currentTheme: string;
  }
  
  export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    currentTheme,
  }: PaginationProps) {
    return (
      <div className="flex justify-center mt-6 gap-2">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-lg ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : `bg-${currentTheme}-100 text-${currentTheme}-700 hover:bg-${currentTheme}-200`
          }`}
        >
          Previous
        </button>
        <span className="px-4 py-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-lg ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : `bg-${currentTheme}-100 text-${currentTheme}-700 hover:bg-${currentTheme}-200`
          }`}
        >
          Next
        </button>
      </div>
    );
  }