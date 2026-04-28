const db = require("../models");
const Book = db.Book;
const { Op } = db.Sequelize;
const rabbitmq = require("../config/rabbitmq");

// Get all books
exports.getAllBooks = async (req, res) => {
  try {
    const { search, is_free, language, sort_by, order } = req.query;

    // Build where clause
    let whereClause = {};
    if (search) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { title: { [Op.like]: `%${search}%` } },
          { author: { [Op.like]: `%${search}%` } },
          { sinopsis: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    if (is_free !== undefined) {
      whereClause.is_free = is_free === "true";
    }

    if (language) {
      whereClause.language = language;
    }

    // Build order clause
    let orderClause = [["created_at", "DESC"]];
    if (sort_by) {
      const sortOrder = order && order.toUpperCase() === "ASC" ? "ASC" : "DESC";
      orderClause = [[sort_by, sortOrder]];
    }

    const books = await Book.findAll({
      where: whereClause,
      order: orderClause,
    });

    res.json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch books",
      error: error.message,
    });
  }
};

// Get single book by ID
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }
    // Increment views
    await book.increment("views");
    await book.reload();

    res.json({
      success: true,
      data: book,
    });
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch book",
      error: error.message,
    });
  }
};

// Create new book
exports.createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      rating,
      views,
      is_free,
      language,
      sinopsis,
      story,
      image,
    } = req.body;

    // Validation
    if (!title || !author || !sinopsis || !story) {
      return res.status(400).json({
        success: false,
        message: "Title, author, sinopsis, and story are required",
      });
    }

    const book = await Book.create({
      title,
      author,
      rating: rating || 0,
      views: views || 0,
      is_free: is_free || false,
      language: language || "English",
      sinopsis,
      story,
      image,
    });

    // Send data to Message Broker
    await rabbitmq.sendToQueue("book_created", {
      event: "book.created",
      timestamp: new Date().toISOString(),
      data: {
        id: book.id,
        tittle: book.title,
        author: book.author,
        rating: book.rating,
        views: book.views,
        is_free: book.is_free,
        language: book.language,
        sinopsis: book.sinopsis,
        story: book.story,
        image: book.image,
      },
    });
    // End of Message Broker

    res.status(201).json({
      success: true,
      message: "Book created successfully",
      data: book,
    });
  } catch (error) {
    console.error("Error creating book:", error);

    // Handle validation errors
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create book",
      error: error.message,
    });
  }
};

// Update book (full update)
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const {
      title,
      author,
      rating,
      views,
      is_free,
      language,
      sinopsis,
      story,
      image,
    } = req.body;

    await book.update({
      title: title || book.title,
      author: author || book.author,
      rating: rating !== undefined ? rating : book.rating,
      views: views !== undefined ? views : book.views,
      is_free: is_free !== undefined ? is_free : book.is_free,
      language: language || book.language,
      sinopsis: sinopsis || book.sinopsis,
      story: story || book.story,
      image: image !== undefined ? image : book.image,
    });

    await rabbitmq.sendToQueue("book_updated", {
      event: "book.updated",
      timestamp: new Date().toISOString(),
      data: {
        id: book.id,
        tittle: book.title,
        author: book.author,
        rating: book.rating,
        views: book.views,
        is_free: book.is_free,
        language: book.language,
        sinopsis: book.sinopsis,
        story: book.story,
        image: book.image,
      },
    });

    res.json({
      success: true,
      message: "Book updated successfully",
      data: book,
    });
  } catch (error) {
    console.error("Error updating book:", error);
    // Handle validation errors
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update book",
      error: error.message,
    });
  }
};

// Patch book (partial update)
exports.patchBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    await book.update(req.body);

    res.json({
      success: true,
      message: "Book updated successfully",
      data: book,
    });
  } catch (error) {
    console.error("Error updating book:", error);
    // Handle validation errors
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update book",
      error: error.message,
    });
  }
};

// Delete book
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    await book.destroy();

    res.json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete book",
      error: error.message,
    });
  }
};
