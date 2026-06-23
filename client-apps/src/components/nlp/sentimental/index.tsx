"use client";
import React, { useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as toxicity from "@tensorflow-models/toxicity";
import { Alert } from "@/components/ui/alerts";
import { Skeleton } from "@/components/ui/loading";

interface Comment {
  id: string;
  text: string;
  author: string;
  likeCount: number;
  publishedAt: string;
}

interface SentimentResult {
  comment: Comment;
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  toxicityLabels?: string[];
}

export default function YTKomenSentimental() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [sentimentResults, setSentimentResults] = useState<SentimentResult[]>(
    [],
  );
  const [toxicityModel, setToxicityModel] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  const YOUTUBE_API_KEY = "AIzaSyAbHhPxgKkhWbix_V8iKbfORLN-IZEuV08";

  // Load TensorFlow.js Toxicity Model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoadingModel(true);
        console.log("Loading TensorFlow.js...");

        await tf.setBackend("webgl");
        await tf.ready();

        console.log("Loading Toxicity model...");
        const model = await toxicity.load(0.7, []);

        setToxicityModel(model);
        setIsLoadingModel(false);
        console.log("Model loaded successfully");
      } catch (err) {
        console.error("Error loading model:", err);
        setError(
          `Gagal memuat model: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        setIsLoadingModel(false);
      }
    };

    loadModel();

    return () => {
      if (toxicityModel) {
        toxicityModel.dispose();
      }
    };
  }, []);

  // Extract YouTube Video ID
  const extractVideoId = (url: string): string | null => {
    const regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7].length === 11 ? match[7] : null;
  };

  // Fetch YouTube Comments
  const fetchComments = async (videoId: string): Promise<Comment[]> => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&key=${YOUTUBE_API_KEY}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch comments");
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error("Tidak ada komentar yang ditemukan pada video ini");
      }

      const comments: Comment[] = data.items.map((item: any) => ({
        id: item.id,
        text: item.snippet.topLevelComment.snippet.textDisplay,
        author: item.snippet.topLevelComment.snippet.authorDisplayName,
        likeCount: item.snippet.topLevelComment.snippet.likeCount,
        publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      }));

      return comments;
    } catch (err) {
      throw err;
    }
  };

  // Analyze Sentiment using Simple Rule-Based + Toxicity Model
  const analyzeSentiment = async (
    text: string,
  ): Promise<{
    sentiment: "positive" | "negative" | "neutral";
    score: number;
    toxicityLabels: string[];
  }> => {
    const positiveWords = [
      "bagus",
      "baik",
      "hebat",
      "luar biasa",
      "keren",
      "mantap",
      "suka",
      "senang",
      "good",
      "great",
      "awesome",
      "excellent",
      "amazing",
      "love",
      "like",
      "best",
      "wonderful",
      "fantastic",
      "perfect",
      "nice",
      "👍",
      "❤️",
      "😊",
      "😍",
      "🔥",
    ];

    const negativeWords = [
      "buruk",
      "jelek",
      "tidak suka",
      "benci",
      "kecewa",
      "mengecewakan",
      "payah",
      "bad",
      "terrible",
      "awful",
      "hate",
      "worst",
      "disappointed",
      "poor",
      "horrible",
      "serem",
      "seram",
      "menakutkan",
      "ngeri",
      "horor",
      "menyeramkan",
      "jahat",
      "kejam",
      "sadis",
      "keji",
      "licik",
      "curang",
      "bohong",
      "marah",
      "kesal",
      "jengkel",
      "dongkol",
      "sebel",
      "geram",
      "bodoh",
      "tolol",
      "goblok",
      "idiot",
      "dungu",
      "bego",
      "sampah",
      "busuk",
      "bau",
      "jorok",
      "kotor",
      "najis",
      "gagal",
      "hancur",
      "rusak",
      "parah",
      "fatal",
      "kacau",
      "menyebalkan",
      "menjijikkan",
      "memuakkan",
      "menyakitkan",
      "bahaya",
      "berbahaya",
      "rawan",
      "risiko",
      "ancaman",
      "penipuan",
      "tipu",
      "scam",
      "penipu",
      "menipu",
      "korupsi",
      "korup",
      "suap",
      "sogok",
      "mark up",
      "sindikat",
      "mafia",
      "komplotan",
      "geng",
      "preman",
      "👎",
      "😡",
      "😠",
      "💔",
      "😤",
      "😒",
      "🤬",
      "😾",
      "💢",
      "🤨",
      "😑",
      "😐",
    ];

    const lowerText = text.toLowerCase();

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach((word) => {
      const regex = new RegExp(
        word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi",
      );
      const matches = lowerText.match(regex);
      if (matches) {
        positiveCount += matches.length;
      }
    });

    negativeWords.forEach((word) => {
      const regex = new RegExp(
        word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi",
      );
      const matches = lowerText.match(regex);
      if (matches) {
        negativeCount += matches.length;
      }
    });

    const negativePatterns = [
      /jangan[- ]?jangan/i, // "jangan-jangan" atau "jangan jangan"
      /gak\s+(bagus|baik|suka)/i, // "gak bagus", "gak baik", "gak suka"
      /tidak\s+(bagus|baik|suka)/i, // "tidak bagus", "tidak baik", "tidak suka"
      /kurang\s+(bagus|baik|memuaskan)/i, // "kurang bagus", dll
      /\b(awas|hati[- ]?hati)\b/i, // "awas", "hati-hati"
      /\b(waspada|was[- ]?pada)\b/i, // "waspada"
    ];

    negativePatterns.forEach((pattern) => {
      if (pattern.test(text)) {
        negativeCount += 2;
      }
    });

    let toxicityLabels: string[] = [];
    if (toxicityModel) {
      try {
        const predictions = await toxicityModel.classify([text]);
        predictions.forEach((prediction: any) => {
          if (prediction.results[0].match) {
            toxicityLabels.push(prediction.label);
          }
        });
      } catch (err) {
        console.error("Error in toxicity detection:", err);
      }
    }

    if (toxicityLabels.length > 0) {
      negativeCount += toxicityLabels.length * 3;
    }

    const totalWords = positiveCount + negativeCount;
    let sentiment: "positive" | "negative" | "neutral" = "neutral";
    let score = 0.5;

    if (totalWords > 0) {
      score = positiveCount / totalWords;

      if (score >= 0.65) {
        sentiment = "positive";
      } else if (score <= 0.35) {
        sentiment = "negative";
      } else {
        if (negativeCount > positiveCount) {
          sentiment = "negative";
          score = 0.3;
        } else if (positiveCount > negativeCount) {
          sentiment = "positive";
          score = 0.7;
        }
      }
    } else {
      if (negativeCount === 0 && positiveCount === 0) {
        const hasNegativeEmoji = /[😡😠🤬😾💢🤨👎💔😤😒]/g.test(text);
        if (hasNegativeEmoji) {
          sentiment = "negative";
          score = 0.3;
        }
      }
    }

    return { sentiment, score, toxicityLabels };
  };

  const handleAnalyze = async () => {
    const videoId = extractVideoId(youtubeUrl);

    if (!videoId) {
      setError(
        "URL YouTube tidak valid. Contoh: https://www.youtube.com/watch?v=VIDEO_ID",
      );
      return;
    }

    if (!toxicityModel) {
      setError("Model belum siap. Silakan tunggu beberapa saat.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setComments([]);
    setSentimentResults([]);
    setProgress(0);

    try {
      console.log("Fetching comments...");
      const fetchedComments = await fetchComments(videoId);
      setComments(fetchedComments);

      console.log("Analyzing sentiments...");
      const results: SentimentResult[] = [];

      for (let i = 0; i < fetchedComments.length; i++) {
        const comment = fetchedComments[i];
        const { sentiment, score, toxicityLabels } = await analyzeSentiment(
          comment.text,
        );

        results.push({
          comment,
          sentiment,
          score,
          toxicityLabels,
        });

        setProgress(Math.round(((i + 1) / fetchedComments.length) * 100));
      }

      setSentimentResults(results);
      setIsLoading(false);
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menganalisis komentar",
      );
      setIsLoading(false);
    }
  };

  const getSentimentBadge = (
    sentiment: "positive" | "negative" | "neutral",
  ) => {
    switch (sentiment) {
      case "positive":
        return "bg-success";
      case "negative":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const getSentimentIcon = (sentiment: "positive" | "negative" | "neutral") => {
    switch (sentiment) {
      case "positive":
        return "😊";
      case "negative":
        return "😠";
      default:
        return "😐";
    }
  };

  const getStatistics = () => {
    const total = sentimentResults.length;
    const positive = sentimentResults.filter(
      (r) => r.sentiment === "positive",
    ).length;
    const negative = sentimentResults.filter(
      (r) => r.sentiment === "negative",
    ).length;
    const neutral = sentimentResults.filter(
      (r) => r.sentiment === "neutral",
    ).length;
    const toxic = sentimentResults.filter(
      (r) => r.toxicityLabels && r.toxicityLabels.length > 0,
    ).length;

    return {
      total,
      positive,
      negative,
      neutral,
      toxic,
      positivePercent: total > 0 ? Math.round((positive / total) * 100) : 0,
      negativePercent: total > 0 ? Math.round((negative / total) * 100) : 0,
      neutralPercent: total > 0 ? Math.round((neutral / total) * 100) : 0,
      toxicPercent: total > 0 ? Math.round((toxic / total) * 100) : 0,
    };
  };

  const stats = getStatistics();

  if (isLoadingModel) {
    return (
      <div className="container my-5">
        <Skeleton />
        <div className="text-center mt-3">
          <p className="text-muted">Memuat model TensorFlow.js...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card mt-5">
        <div className="card-header">
          <h3>
            <i className="bi bi-chat-left-text me-2"></i>
            Analisis Sentimen Komentar YouTube
          </h3>
          <p className="text-muted mb-0">
            Menggunakan TensorFlow.js Toxicity Model & Rule-based Analysis
          </p>
        </div>
        <div className="card-body">
          {error && <Alert message={error} variant="danger" />}

          <div className="input-group mb-3">
            <span className="input-group-text">
              <i className="bi bi-youtube"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Enter YouTube video URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              disabled={isLoading}
            />
            <button
              className="btn btn-sm btn-outline-primary px-3"
              onClick={handleAnalyze}
              disabled={!youtubeUrl || isLoading || !toxicityModel}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <span>Analyzing...</span>
                </>
              ) : (
                <i className="bi bi-play-circle-fill fs-5"></i>
              )}
            </button>
          </div>

          {isLoading && (
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-2">
                <span>Progress: {progress}%</span>
                <span>
                  {sentimentResults.length} / {comments.length} komentar
                </span>
              </div>
              <div className="progress" style={{ height: "25px" }}>
                <div
                  className="progress-bar progress-bar-striped progress-bar-animated"
                  role="progressbar"
                  style={{ width: `${progress}%` }}
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {progress}%
                </div>
              </div>
            </div>
          )}

          {sentimentResults.length > 0 && (
            <>
              <div className="row mb-4">
                <div className="col-md-3 mb-3">
                  <div className="card border-primary">
                    <div className="card-body text-center">
                      <h6 className="text-muted">Total Komentar</h6>
                      <h2 className="mb-0">{stats.total}</h2>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card border-success">
                    <div className="card-body text-center">
                      <h6 className="text-muted">Positif 😊</h6>
                      <h2 className="mb-0 text-success">{stats.positive}</h2>
                      <small className="text-muted">
                        {stats.positivePercent}%
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card border-danger">
                    <div className="card-body text-center">
                      <h6 className="text-muted">Negatif 😠</h6>
                      <h2 className="mb-0 text-danger">{stats.negative}</h2>
                      <small className="text-muted">
                        {stats.negativePercent}%
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card border-secondary">
                    <div className="card-body text-center">
                      <h6 className="text-muted">Netral 😐</h6>
                      <h2 className="mb-0 text-secondary">{stats.neutral}</h2>
                      <small className="text-muted">
                        {stats.neutralPercent}%
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {stats.toxic > 0 && (
                <Alert
                  message={`⚠️ Ditemukan ${stats.toxic} komentar (${stats.toxicPercent}%) yang mengandung konten toxic/berbahaya`}
                  variant="warning"
                />
              )}
              <ResultSentimental
                results={sentimentResults}
                getSentimentBadge={getSentimentBadge}
                getSentimentIcon={getSentimentIcon}
              />
            </>
          )}

          {!isLoading && sentimentResults.length === 0 && !error && (
            <div className="text-center py-5 bg-light rounded">
              <i className="bi bi-chat-left-text fs-1 text-muted"></i>
              <p className="text-muted mt-3">
                Masukkan URL YouTube dan klik tombol play untuk memulai analisis
                sentimen
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ResultSentimentalProps {
  results: SentimentResult[];
  getSentimentBadge: (sentiment: "positive" | "negative" | "neutral") => string;
  getSentimentIcon: (sentiment: "positive" | "negative" | "neutral") => string;
}

const ResultSentimental: React.FC<ResultSentimentalProps> = ({
  results,
  getSentimentBadge,
  getSentimentIcon,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterSentiment, setFilterSentiment] = useState<
    "all" | "positive" | "negative" | "neutral" | "toxic"
  >("all");
  const [sortBy, setSortBy] = useState<"date" | "likes" | "sentiment">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const itemsPerPage = 10;

  const filteredResults = results.filter((result) => {
    if (filterSentiment === "all") return true;
    if (filterSentiment === "toxic")
      return result.toxicityLabels && result.toxicityLabels.length > 0;
    return result.sentiment === filterSentiment;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "date":
        comparison =
          new Date(a.comment.publishedAt).getTime() -
          new Date(b.comment.publishedAt).getTime();
        break;
      case "likes":
        comparison = a.comment.likeCount - b.comment.likeCount;
        break;
      case "sentiment":
        const sentimentOrder = { positive: 3, neutral: 2, negative: 1 };
        comparison = sentimentOrder[a.sentiment] - sentimentOrder[b.sentiment];
        break;
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const totalPages = Math.ceil(sortedResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = sortedResults.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterSentiment, sortBy, sortOrder]);

  return (
    <div>
      <div className="card mb-3">
        <div className="card-body">
          <div className="row align-items-center">
            <div className="col-md-4 mb-2 mb-md-0">
              <label className="form-label mb-1 fw-bold">
                <i className="bi bi-funnel me-1"></i>
                Filter Sentimen:
              </label>
              <select
                className="form-select"
                value={filterSentiment}
                onChange={(e) => setFilterSentiment(e.target.value as any)}
              >
                <option value="all">Semua ({results.length})</option>
                <option value="positive">
                  Positif (
                  {results.filter((r) => r.sentiment === "positive").length})
                </option>
                <option value="negative">
                  Negatif (
                  {results.filter((r) => r.sentiment === "negative").length})
                </option>
                <option value="neutral">
                  Netral (
                  {results.filter((r) => r.sentiment === "neutral").length})
                </option>
                <option value="toxic">
                  Toxic (
                  {
                    results.filter(
                      (r) => r.toxicityLabels && r.toxicityLabels.length > 0,
                    ).length
                  }
                  )
                </option>
              </select>
            </div>

            <div className="col-md-4 mb-2 mb-md-0">
              <label className="form-label mb-1 fw-bold">
                <i className="bi bi-sort-down me-1"></i>
                Urutkan Berdasarkan:
              </label>
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="date">Tanggal</option>
                <option value="likes">Jumlah Like</option>
                <option value="sentiment">Sentimen</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label mb-1 fw-bold">
                <i className="bi bi-arrow-down-up me-1"></i>
                Urutan:
              </label>
              <select
                className="form-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
              >
                <option value="desc">Menurun</option>
                <option value="asc">Menaik</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="alert alert-info d-flex align-items-center mb-3">
        <i className="bi bi-info-circle me-2"></i>
        <span>
          Menampilkan {currentResults.length} dari {filteredResults.length}{" "}
          komentar
          {filterSentiment !== "all" && ` (Filter: ${filterSentiment})`}
        </span>
      </div>

      <div className="table-responsive">
        <table className="table table-hover table-bordered">
          <thead className="table-light">
            <tr>
              <th style={{ width: "50px" }}>No</th>
              <th style={{ width: "150px" }}>Penulis</th>
              <th>Komentar</th>
              <th style={{ width: "120px" }} className="text-center">
                Sentimen
              </th>
              <th style={{ width: "100px" }} className="text-center">
                Score
              </th>
              <th style={{ width: "80px" }} className="text-center">
                <i className="bi bi-hand-thumbs-up"></i>
              </th>
              <th style={{ width: "150px" }}>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {currentResults.length > 0 ? (
              currentResults.map((result, index) => (
                <tr key={result.comment.id}>
                  <td className="text-center">{startIndex + index + 1}</td>
                  <td>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person-circle fs-4 me-2 text-primary"></i>
                      <span
                        className="text-truncate"
                        style={{ maxWidth: "100px" }}
                      >
                        {result.comment.author}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div
                      dangerouslySetInnerHTML={{ __html: result.comment.text }}
                      style={{ maxHeight: "100px", overflow: "auto" }}
                    />
                    {result.toxicityLabels &&
                      result.toxicityLabels.length > 0 && (
                        <div className="mt-2">
                          {result.toxicityLabels.map((label, idx) => (
                            <span
                              key={idx}
                              className="badge bg-warning text-dark me-1"
                            >
                              ⚠️ {label}
                            </span>
                          ))}
                        </div>
                      )}
                  </td>
                  <td className="text-center">
                    <span
                      className={`badge ${getSentimentBadge(result.sentiment)} fs-6`}
                    >
                      {getSentimentIcon(result.sentiment)}{" "}
                      {result.sentiment.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="progress" style={{ height: "20px" }}>
                      <div
                        className={`progress-bar ${
                          result.sentiment === "positive"
                            ? "bg-success"
                            : result.sentiment === "negative"
                              ? "bg-danger"
                              : "bg-secondary"
                        }`}
                        role="progressbar"
                        style={{ width: `${result.score * 100}%` }}
                        aria-valuenow={result.score * 100}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        {Math.round(result.score * 100)}%
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="badge bg-light text-dark">
                      {result.comment.likeCount}
                    </span>
                  </td>
                  <td>
                    <small className="text-muted">
                      {formatDate(result.comment.publishedAt)}
                    </small>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  <i className="bi bi-inbox fs-1 text-muted d-block mb-2"></i>
                  <span className="text-muted">
                    Tidak ada komentar yang sesuai dengan filter
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav aria-label="Page navigation">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                <i className="bi bi-chevron-double-left"></i>
              </button>
            </li>
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
            </li>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <li
                    key={page}
                    className={`page-item ${currentPage === page ? "active" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  </li>
                );
              } else if (page === currentPage - 3 || page === currentPage + 3) {
                return (
                  <li key={page} className="page-item disabled">
                    <span className="page-link">...</span>
                  </li>
                );
              }
              return null;
            })}

            <li
              className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
            >
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </li>
            <li
              className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
            >
              <button
                className="page-link"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                <i className="bi bi-chevron-double-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      )}

      <div className="text-center text-muted mt-2">
        <small>
          Halaman {currentPage} dari {totalPages} | Menampilkan {startIndex + 1}
          -{Math.min(endIndex, filteredResults.length)} dari{" "}
          {filteredResults.length} komentar
        </small>
      </div>
    </div>
  );
};
