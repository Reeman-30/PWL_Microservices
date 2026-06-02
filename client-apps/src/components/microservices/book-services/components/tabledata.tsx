"use client";

import React, { useMemo, useState, FC, ChangeEvent } from "react";
import { Cards } from "@/components/ui/cards";
import { Button } from "@/components/ui/buttons";
import {
  HeaderDatatables,
  SearchInput,
  PaginationComponent,
  NoRecordFound,
} from "@/components/ui/datatables";
import { ModalResponse, openModal } from "@/components/ui/modals";
import { Spinner } from "@/components/ui/loading";
import Form from "./form";
import { DELETE_BOOK } from "@/components/apis/BookService";

type Book = {
  id: number;
  title: string;
  author: string;
  language?: string;
  rating?: number;
  views?: number;
  is_free: boolean;
};

type Sorting = {
  field: keyof Book | "";
  order: "asc" | "desc" | "";
};

type Props = {
  data: Book[];
  ReloadData: () => void;
};

const ITEMS_PER_PAGE = 10;

const Tabledata: FC<Props> = ({ data, ReloadData }) => {
  const [search, setSearch] = useState<string>("");
  const [sorting, setSorting] = useState<Sorting>({
    field: "",
    order: "",
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const table_headers = [
    { name: "No", field: "id", sortable: false },
    { name: "Title", field: "title", sortable: true },
    { name: "Author", field: "author", sortable: true },
    { name: "Language", field: "language", sortable: true },
    { name: "Rate/View", field: "rate", sortable: false },
    { name: "Subscribe", field: "is_free", sortable: true },
    { name: "Actions", field: "id", sortable: false },
  ];

  const filteredData = useMemo(() => {
    let computed = [...data];

    if (search) {
      computed = computed.filter((item) =>
        Object.values(item).some(
          (val) =>
            val != null &&
            String(val).toLowerCase().includes(search.toLowerCase()),
        ),
      );
    }

    if (sorting.field) {
      computed.sort((a, b) => {
        const aVal = a[sorting.field as keyof Book];
        const bVal = b[sorting.field as keyof Book];

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sorting.order === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sorting.order === "asc" ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return computed;
  }, [data, search, sorting]);

  const totalItems = filteredData.length;

  const paginatedData = useMemo(() => {
    return filteredData.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE,
    );
  }, [filteredData, currentPage]);

  const handleDelete = async (book_id: number) => {
    setSelectedId(book_id);

    const result = await DELETE_BOOK(book_id);

    if (!result.success) {
      openModal({
        message: (
          <ModalResponse
            title="Failed Remove"
            message={result.message}
            variant="danger"
          />
        ),
      });
    } else {
      openModal({
        message: (
          <ModalResponse title="Successfully Removed" variant="success" />
        ),
      });
      ReloadData();
    }

    setSelectedId(null);
  };

  return (
    <Cards>
      <Cards.Header>
        <span className="card-label fw-bold fs-3">Book Lists</span>
        <div className="d-lg-flex align-items-center justify-content-end">
          <div style={{ width: 500 }}>
            <SearchInput
              keyword={search}
              onAction={(e: ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
            />
          </div>
          <div className="ms-1">
            <Button
              type={`button`}
              variant="primary"
              onClick={() => ReloadData()}
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span>Refresh</span>
            </Button>
          </div>
        </div>
      </Cards.Header>

      <Cards.Body className="px-0 pb-0">
        <div className="table-responsive">
          <table className="table table-hover">
            <HeaderDatatables
              headers={table_headers}
              onSorting={(field, order) =>
                setSorting({
                  field: field as keyof Book,
                  order,
                })
              }
            />

            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((book, index) => (
                  <tr key={`book-row-${book.id || index}`}>
                    <td className="text-center">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>

                    <td>
                      <strong>{book.title}</strong>
                    </td>

                    <td>{book.author}</td>
                    <td>{book.language}</td>

                    <td>
                      <div className="d-flex">
                        <div className="me-3">
                          <i className="bi bi-star-fill text-warning" />
                          <span className="ms-1">{book.rating ?? 0}</span>
                        </div>

                        <div>
                          <i className="bi bi-eye text-info" />
                          <span className="ms-1">{book.views ?? 0}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge bg-secondary">
                        {book.is_free ? "Yes" : "No"}
                      </span>
                    </td>

                    <td className="text-end">
                      {selectedId === book.id ? (
                        <Spinner />
                      ) : (
                        <>
                          <Button
                            variant="warning"
                            outline
                            className="btn-sm me-2"
                            onClick={() =>
                              openModal({
                                message: (
                                  <Form
                                    book_id={book.id}
                                    ReloadBook={ReloadData}
                                  />
                                ),
                                size: "xl",
                              })
                            }
                          >
                            <i className="bi bi-pencil" />
                          </Button>

                          <Button
                            variant="danger"
                            outline
                            className="btn-sm"
                            onClick={() => handleDelete(book.id)}
                          >
                            <i className="bi bi-trash" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <NoRecordFound />
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalItems > 0 && (
            <div className="d-flex justify-content-center">
              <PaginationComponent
                total={totalItems}
                itemsPerPage={ITEMS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          )}
        </div>
      </Cards.Body>
    </Cards>
  );
};

export default Tabledata;
