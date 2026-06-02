/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState } from "react";
import { openModal } from "@/components/ui/modals";
import { Alert } from "@/components/ui/alerts";
import { Skeleton } from "@/components/ui/loading";
import { GET_ALL_BOOK } from "@/components/apis/BookService";
import { Header } from "./components/header";
import Form from "./components/form";
import Tabledata from "./components/tabledata";
import { CardCalculates } from "./components/card_calculates";

type BooksState = {
  loading: boolean;
  success?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  message: string;
};

export function BookManagements() {
  const [books, setBooks] = useState<BooksState>({
    loading: false,
    data: [],
    message: "",
  });
  const ReloadBook = async () => {
    setBooks({ loading: true, data: [], message: "" });

    try {
      const results = await GET_ALL_BOOK();

      if (results.data && Object.values(results.data).length > 0) {
        setBooks({
          loading: false,
          data: results.data,
          message: "",
        });
      } else {
        setBooks({
          loading: false,
          data: [],
          message: results?.message || "No books found",
        });
      }
    } catch (error) {
      console.error("Error loading books:", error);
      setBooks({
        loading: false,
        data: [],
        message:
          error instanceof Error ? error.message : "Failed to load books",
      });
    }
  };
  useEffect(() => {
    ReloadBook();
  }, []);

  return (
    <div className="container-fluid">
      <Header
        handleAdd={() =>
          openModal({ message: <Form ReloadBook={ReloadBook} />, size: "xl" })
        }
      />

      <div className="row">
        <div className="col-md-3">
          <CardCalculates
            title={`Total Books`}
            value={books?.data.length || 0}
            icon={`book`}
          />
        </div>
        <div className="col-md-3">
          <CardCalculates
            title={`Free Book`}
            value={
              books?.data.length > 0
                ? books?.data.filter((b) => !b.is_free).length
                : 0
            }
            icon={`grid`}
          />
        </div>
        <div className="col-md-3">
          <CardCalculates
            title={`Subscribe`}
            value={
              books?.data.length > 0
                ? books?.data.filter((b) => b.is_free).length
                : 0
            }
            icon={`calendar-event`}
          />
        </div>
        <div className="col-md-3">
          <CardCalculates
            title={`Authors`}
            value={
              books?.data.length > 0
                ? books?.data.filter((b) => b.author).length
                : 0
            }
            icon={`people`}
          />
        </div>
      </div>

      {books.loading ? (
        <Skeleton />
      ) : books.message ? (
        <Alert message={books.message} variant="danger" />
      ) : books.data && books.data.length > 0 ? (
        <Tabledata data={books.data} ReloadData={ReloadBook} />
      ) : (
        ""
      )}
    </div>
  );
}

export default BookManagements;
