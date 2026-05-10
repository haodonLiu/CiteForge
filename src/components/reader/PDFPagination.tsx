interface PDFPaginationProps {
  pageNumber: number;
  numPages: number;
  onPageChange: (page: number) => void;
}

export default function PDFPagination({ pageNumber, numPages, onPageChange }: PDFPaginationProps) {
  return (
    <div className="flex items-center justify-center gap-4 p-4 border-t border-border">
      <button
        onClick={() => onPageChange(Math.max(1, pageNumber - 1))}
        disabled={pageNumber <= 1}
        className="px-3 py-1 rounded bg-surface hover:bg-surface-hover disabled:opacity-50"
      >
        上一页
      </button>
      <span className="text-secondary">
        {pageNumber} / {numPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(numPages, pageNumber + 1))}
        disabled={pageNumber >= numPages}
        className="px-3 py-1 rounded bg-surface hover:bg-surface-hover disabled:opacity-50"
      >
        下一页
      </button>
    </div>
  );
}
