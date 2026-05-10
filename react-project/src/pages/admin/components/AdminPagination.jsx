function AdminPagination({ page, totalPages, onPageChange }) {
  return (
    <div className="d-flex justify-content-between align-items-center gap-3">
      <span className="small text-muted">
        Page {page} of {totalPages}
      </span>
      <div className="btn-group">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AdminPagination;
