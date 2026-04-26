import { ChevronLeft, ChevronRight } from "lucide-react";
import "./TableFooter.css";

type TableFooterProps = {
  total: number;
  page: number;
  rowsPerPage: number;
  onRowsPerPageChange: (value: number) => void;
  onPageChange: (page: number) => void;
  rowsPerPageOptions?: number[];
  className?: string;
};

function getPageCount(total: number, rowsPerPage: number) {
  return Math.max(1, Math.ceil(total / rowsPerPage));
}

export default function TableFooter({
  total,
  page,
  rowsPerPage,
  onRowsPerPageChange,
  onPageChange,
  rowsPerPageOptions = [10, 20, 30],
  className = "",
}: TableFooterProps) {
  const pageCount = getPageCount(total, rowsPerPage);
  const safePage = Math.min(page, pageCount);
  const start = total === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const end = total === 0 ? 0 : Math.min(safePage * rowsPerPage, total);

  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1).slice(
    Math.max(0, safePage - 3),
    Math.max(5, safePage + 2)
  );

  return (
    <div className={`app-table-footer ${className}`.trim()}>
      <span className="app-table-footer-summary">
        Showing {start}-{end} of {total}
      </span>

      <div className="app-table-footer-controls">
        <label className="app-rows-per-page">
          <span>Rows per page</span>
          <select
            className="app-select-control"
            value={rowsPerPage}
            onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {pageCount > 1 ? (
          <div className="app-table-pager">
            <button
              type="button"
              className="app-page-btn"
              disabled={safePage === 1}
              onClick={() => onPageChange(Math.max(1, safePage - 1))}
            >
              <ChevronLeft size={15} />
              Previous
            </button>

            <div className="app-page-number-set">
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={`app-page-btn ${safePage === pageNumber ? "active" : ""}`}
                  onClick={() => onPageChange(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="app-page-btn"
              disabled={safePage === pageCount}
              onClick={() => onPageChange(Math.min(pageCount, safePage + 1))}
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        ) : (
          <span className="app-single-page-note">Single page</span>
        )}
      </div>
    </div>
  );
}
