import { RequestAPI } from "@/hooks/request-api";

type Book = {
  id?: number;
  title: string;
  author: string;
  sinopsis: string;
  story: string;
  is_free: boolean;
  image?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

const getHeaders = (isFormData = false): Record<string, string> => {
  if (typeof window === "undefined") return {};

  const token = localStorage.getItem("accessToken");

  return {
    Authorization: token ? `Bearer ${token}` : "",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
  };
};

const GET_ALL_BOOK = () => {
  return RequestAPI<Book[]>("GET", `${API_URL}/api/books`, getHeaders());
};

const GET_BOOK_BY_ID = (book_id: number) => {
  return RequestAPI<Book>(
    "GET",
    `${API_URL}/api/books/${book_id}`,
    getHeaders(),
  );
};

const CREATE_BOOK = (payload: FormData) => {
  return RequestAPI<Book>(
    "POST",
    `${API_URL}/api/books`,
    getHeaders(true),
    payload,
  );
};

const UPDATE_BOOK = (book_id: number, payload: FormData) => {
  return RequestAPI<Book>(
    "PUT",
    `${API_URL}/api/books/${book_id}`,
    getHeaders(true),
    payload,
  );
};

const DELETE_BOOK = (book_id: number) => {
  return RequestAPI<void>(
    "DELETE",
    `${API_URL}/api/books/${book_id}`,
    getHeaders(),
  );
};

export { GET_ALL_BOOK, GET_BOOK_BY_ID, CREATE_BOOK, UPDATE_BOOK, DELETE_BOOK };
