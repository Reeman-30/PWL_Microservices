"use client";

import React, {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
  FC,
  useCallback,
} from "react";

import {
  TextAreaInput,
  TextInput,
  InputImage,
  InputCheckbox,
} from "@/components/ui/forms";

import { Button } from "@/components/ui/buttons";
import { openModal, ModalResponse } from "@/components/ui/modals";
import { Alert } from "@/components/ui/alerts";
import {
  CREATE_BOOK,
  GET_BOOK_BY_ID,
  UPDATE_BOOK,
} from "@/components/apis/BookService";

type BookForm = {
  title: string;
  author: string;
  sinopsis: string;
  story: string;
  is_free: boolean;
  image: File | string | null;
};

type Props = {
  book_id?: number;
  ReloadBook: () => void;
};

const initialState: BookForm = {
  title: "",
  author: "",
  sinopsis: "",
  story: "",
  is_free: false,
  image: null,
};

const Form: FC<Props> = ({ book_id, ReloadBook }) => {
  const [formData, setFormData] = useState<BookForm>(initialState);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reloadBookByID = useCallback(async () => {
    if (!book_id) return;

    // setIsLoading(true);
    console.log("Book id:", book_id);
    try {
      const result = await GET_BOOK_BY_ID(book_id);
      console.log("Book loaded:", result);

      if (result?.data) {
        const bookData: BookForm = {
          title: result.data.title || "",
          author: result.data.author || "",
          sinopsis: result.data.sinopsis || "",
          story: result.data.story || "",
          is_free: result.data.is_free || false,
          image: result.data.image || null,
        };

        setFormData(bookData);

        if (result.data.image) {
          const imageUrl = `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}${result.data.image}`;
          setImagePreview(imageUrl);
        }
      } else {
        openModal({
          message: (
            <ModalResponse
              message={result?.message || "No record found"}
              title="No record found"
            />
          ),
        });

        setFormData(initialState);
        setImagePreview(null);
      }
    } catch (err) {
      console.error("Error loading book:", err);
      setError("Failed to load book data");
    } finally {
      setIsLoading(false);
    }
  }, [book_id]);

  useEffect(() => {
    if (book_id) {
      reloadBookByID();
    } else {
      setFormData(initialState);
      setImagePreview(null);
      setError(null);
    }
  }, [book_id, reloadBookByID]);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, JPG, or WebP)");
      // Clear the input
      e.target.value = "";
      return;
    }

    if (file.size > maxSize) {
      setError(`Image size must be less than ${maxSize / (1024 * 1024)}MB`);
      e.target.value = "";
      return;
    }

    setFormData((prev) => ({ ...prev, image: file }));
    setError(null);

    const reader = new FileReader();

    reader.onerror = () => {
      setError("Failed to read image file");
      setImagePreview(null);
    };

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validasi form sebelum submit
    if (!formData.title.trim()) {
      setError("Book title is required");
      return;
    }

    if (!formData.author.trim()) {
      setError("Author name is required");
      return;
    }

    if (!formData.sinopsis.trim()) {
      setError("Sinopsis is required");
      return;
    }

    if (!formData.story.trim()) {
      setError("Story is required");
      return;
    }

    if (!book_id && !formData.image) {
      setError("Cover image is required for new book");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fd = new FormData();

      fd.append("title", formData.title.trim());
      fd.append("author", formData.author.trim());
      fd.append("sinopsis", formData.sinopsis.trim());
      fd.append("story", formData.story.trim());
      fd.append("is_free", String(formData.is_free));

      if (formData.image instanceof File) {
        fd.append("coverImage", formData.image);
      }

      let result;

      if (book_id) {
        // FormData.append() memerlukan string, tapi UPDATE_BOOK menerima number
        fd.append("id", String(book_id)); // Convert untuk FormData
        result = await UPDATE_BOOK(book_id, fd); // Kirim sebagai number
      } else {
        result = await CREATE_BOOK(fd);
        console.log("result:", result);
      }

      if (result?.success) {
        openModal({
          message: (
            <ModalResponse
              message={`Book has been successfully ${
                book_id ? "updated" : "created"
              }!`}
              title="Success"
            />
          ),
        });

        ReloadBook();

        // Reset form only when creating new book
        if (!book_id) {
          setFormData(initialState);
          setImagePreview(null);
        }
      } else {
        setError(result?.message || "Something went wrong");
      }
    } catch (err) {
      console.log("Submit error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to submit book data";
      console.log("msg:", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>
        {book_id ? "Edit Book" : "Add New Book"}
        <small className="d-block text-secondary fs-6">
          {book_id
            ? "Update the book details below."
            : "Fill in the details for the new book."}
        </small>
      </h3>

      {isLoading && (
        <div className="alert alert-info">
          <div className="d-flex align-items-center">
            <div
              className="spinner-border spinner-border-sm me-2"
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <span>{book_id ? "Loading book data..." : "Submitting..."}</span>
          </div>
        </div>
      )}

      <div className="row">
        <div className="col-lg-6">
          <TextInput
            title="Book Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />

          <TextAreaInput
            title="Sinopsis"
            name="sinopsis"
            value={formData.sinopsis}
            onChange={handleInputChange}
            rows={2}
            required
          />

          <TextAreaInput
            title="Story"
            name="story"
            value={formData.story}
            onChange={handleInputChange}
            rows={3}
            required
          />
        </div>

        <div className="col-lg-6">
          <TextInput
            title="Author Name"
            name="author"
            value={formData.author}
            onChange={handleInputChange}
            required
          />

          <InputCheckbox
            title="Type Book"
            label="Is Free"
            name="is_free"
            isSwitch
            checked={formData.is_free}
            onChange={handleInputChange}
          />

          <InputImage
            title="Cover Image"
            onChange={handleImageChange}
            required={!book_id}
            imagePreview={imagePreview ?? undefined}
          />
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Alert message={error} variant="info" />
        </div>
      )}

      <div className="mt-4 text-center">
        <Button
          type="button"
          variant="light"
          className="me-2 btn-lg"
          onClick={() => openModal({ open: false })}
          disabled={isLoading}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          className="btn-lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              {book_id ? "Updating..." : "Creating..."}
            </>
          ) : book_id ? (
            "Update Book"
          ) : (
            "Submit Book"
          )}
        </Button>
      </div>
    </form>
  );
};

export default Form;
