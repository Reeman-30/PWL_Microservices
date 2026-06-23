
interface ClusteringCardProps {
  isTraining: boolean;
  clusterResult: {
    clusters: number[];
    centroids: number[][];
    iterations: number;
  } | null;
  onStartClustering: () => void;
  onRetrain: () => void;
  stats?: {
    cluster0: {
      count: number;
      label: string;
      avgScore: number;
    };
    cluster1: {
      count: number;
      label: string;
      avgScore: number;
    };
  } | null;
  studentClusters: Array<{
    data: number[];
    cluster: number;
    label: string;
    distance: number;
  }>;
}

export function ClusteringCard({
  isTraining,
  clusterResult,
  onStartClustering,
  onRetrain,
  stats,
  studentClusters,
}: ClusteringCardProps) {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-success text-white">
        <h5 className="mb-0">
          <i className="bi bi-cpu me-2"></i>
          K-Means Clustering
        </h5>
      </div>
      <div className="card-body">
        {!clusterResult && !isTraining && (
          <div className="text-center py-4">
            <i className="bi bi-robot fs-1 text-muted mb-3 d-block"></i>
            <p className="text-muted mb-3">
              Clustering belum dilakukan. Klik tombol di bawah untuk memulai.
            </p>
            <button
              className="btn btn-success btn-lg"
              onClick={onStartClustering}
            >
              <i className="bi bi-play-fill me-2"></i>
              Mulai Clustering
            </button>
          </div>
        )}

        {isTraining && (
          <div>
            <div className="d-flex align-items-center mb-3">
              <div className="spinner-border text-success me-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="flex-grow-1">
                <h6 className="mb-1">Melakukan K-Means Clustering...</h6>
                <p className="text-muted mb-0 small">
                  Mengelompokkan data ke dalam 2 cluster
                </p>
              </div>
            </div>
          </div>
        )}

        {clusterResult && !isTraining && (
          <div>
            <div
              className="alert alert-success d-flex align-items-center mb-3"
              role="alert"
            >
              <i className="bi bi-check-circle-fill fs-4 me-3"></i>
              <div>
                <h6 className="alert-heading mb-1">Clustering Selesai!</h6>
                <p className="mb-0 small">
                  Data berhasil dikelompokkan menjadi 2 cluster dalam{" "}
                  <strong>{clusterResult.iterations} iterasi</strong>
                </p>
              </div>
            </div>

            {stats && (
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <div className="card bg-primary bg-opacity-10 border-primary">
                    <div className="card-body">
                      <h6 className="text-primary mb-2">
                        <i className="bi bi-check-circle me-2"></i>
                        Cluster 0: {stats.cluster0.label}
                      </h6>
                      <p className="mb-1">
                        <strong>Jumlah:</strong> {stats.cluster0.count}{" "}
                        mahasiswa
                      </p>
                      <p className="mb-0">
                        <strong>Rata-rata Nilai:</strong>{" "}
                        {stats.cluster0.avgScore.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-danger bg-opacity-10 border-danger">
                    <div className="card-body">
                      <h6 className="text-danger mb-2">
                        <i className="bi bi-x-circle me-2"></i>
                        Cluster 1: {stats.cluster1.label}
                      </h6>
                      <p className="mb-1">
                        <strong>Jumlah:</strong> {stats.cluster1.count}{" "}
                        mahasiswa
                      </p>
                      <p className="mb-0">
                        <strong>Rata-rata Nilai:</strong>{" "}
                        {stats.cluster1.avgScore.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card bg-light mb-3">
              <div className="card-body">
                <h6 className="mb-3">
                  <i className="bi bi-bullseye me-2"></i>
                  Centroids (Pusat Cluster)
                </h6>
                <div className="row g-2">
                  {clusterResult.centroids.map((centroid, idx) => (
                    <div key={idx} className="col-md-6">
                      <div className="p-3 bg-white rounded border">
                        <strong className="d-block mb-2">
                          Cluster {idx}:{" "}
                          {studentClusters.find((s) => s.cluster === idx)
                            ?.label || "Unknown"}
                        </strong>
                        <small className="text-muted">
                          Kehadiran: {centroid[0].toFixed(1)}% | Tugas:{" "}
                          {centroid[1].toFixed(1)}% | UTS:{" "}
                          {centroid[2].toFixed(1)} | UAS:{" "}
                          {centroid[3].toFixed(1)}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button className="btn btn-outline-success" onClick={onRetrain}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Clustering Ulang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}