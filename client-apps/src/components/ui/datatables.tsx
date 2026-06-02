import React, {
  useEffect,
  useMemo,
  useState,
  ReactNode,
  ChangeEvent,
  FC,
} from "react";
import { Pagination } from "react-bootstrap";

type SortOrder = "asc" | "desc";

type HeaderItem = {
  name: string;
  field: string;
  sortable?: boolean;
};

type HeaderDatatablesProps = {
  headers: HeaderItem[];
  onSorting: (field: string, order: SortOrder) => void;
} & React.HTMLAttributes<HTMLTableRowElement>;

type SearchInputProps = {
  keyword: string;
  onAction: (e: ChangeEvent<HTMLInputElement>) => void;
};

type PaginationProps = {
  total?: number;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange: (page: number) => void;
  maxPageItems?: number;
};

type NoRecordFoundProps = {
  message?: ReactNode;
};

const HeaderDatatables: FC<HeaderDatatablesProps> = ({
  headers,
  onSorting,
  ...others
}) => {
  const [sortingField, setSortingField] = useState<string>("");
  const [sortingOrder, setSortingOrder] = useState<SortOrder>("asc");

  const onSortingChange = (field: string) => {
    const order: SortOrder =
      field === sortingField && sortingOrder === "asc" ? "desc" : "asc";

    setSortingField(field);
    setSortingOrder(order);
    onSorting(field, order);
  };

  return (
    <thead>
      <tr className="text-start fw-bold text-uppercase gs-0" {...others}>
        {headers.map(({ name, field, sortable }) => (
          <th
            key={field}
            className={`text-secondary fs-6 ${
              sortable ? "cursor-pointer" : ""
            }`}
            onClick={() => sortable && onSortingChange(field)}
          >
            {name}

            {sortingField === field && (
              <i
                className={`${
                  sortingOrder === "asc"
                    ? "bi bi-sort-up"
                    : "bi bi-sort-down"
                } fs-6 ms-1 text-secondary`}
              />
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
};

const SearchInput: FC<SearchInputProps> = ({ keyword, onAction }) => {
  return (
    <div className="input-group">
      <span className="input-group-text bg-white border-end-0">
        <i className="bi bi-search" />
      </span>
      <input
        type="text"
        className="form-control border-start-0"
        placeholder="Search here..."
        value={keyword}
        onChange={onAction}
      />
    </div>
  );
};

const PaginationComponent: FC<PaginationProps> = ({
  total = 0,
  itemsPerPage = 10,
  currentPage = 1,
  onPageChange,
  maxPageItems = 10,
}) => {
  const [totalPages, setTotalPages] = useState<number>(0);

  useEffect(() => {
    if (total > 0 && itemsPerPage > 0) {
      setTotalPages(Math.ceil(total / itemsPerPage));
    }
  }, [total, itemsPerPage]);

  const paginationItems = useMemo(() => {
    const pages: ReactNode[] = [];

    if (totalPages <= maxPageItems) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => onPageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxPageItems / 2));
      let endPage = Math.min(totalPages, startPage + maxPageItems - 1);

      if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxPageItems + 1);
      }

      if (startPage > 1) {
        pages.push(
          <Pagination.Item key={1} onClick={() => onPageChange(1)}>
            1
          </Pagination.Item>
        );

        if (startPage > 2) {
          pages.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <Pagination.Item
            key={i}
            active={i === currentPage}
            onClick={() => onPageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
        }

        pages.push(
          <Pagination.Item
            key={totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </Pagination.Item>
        );
      }
    }

    return pages;
  }, [totalPages, currentPage, maxPageItems, onPageChange]);

  if (totalPages === 0) return null;

  return (
    <Pagination>
      <Pagination.First
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      />
      <Pagination.Prev
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />

      {paginationItems}

      <Pagination.Next
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
      <Pagination.Last
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      />
    </Pagination>
  );
};

const NoRecordFound: FC<NoRecordFoundProps> = ({ message }) => {
  return (
    <div className="text-center py-5">
      <i className="bi bi-inbox fs-1 text-muted d-block mb-3" />
      <p className="text-muted mb-0">{message ?? "No record found"}</p>
    </div>
  );
};

export {
  HeaderDatatables,
  SearchInput,
  PaginationComponent,
  NoRecordFound,
};