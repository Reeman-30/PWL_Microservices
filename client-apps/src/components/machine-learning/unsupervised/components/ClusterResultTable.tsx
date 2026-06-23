
interface StudentCluster {
  data: number[];
  cluster: number;
  label: string;
  distance: number;
}

interface ClusterResultTableProps {
  studentClusters: StudentCluster[];
  selectedStudent: number | null;
  onSelectStudent: (index: number) => void;
}

export function ClusterResultTable({
  studentClusters,
  selectedStudent,
  onSelectStudent,
}: ClusterResultTableProps) {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">
          <i className="bi bi-table me-2"></i>
          Dataset dengan Hasil Clustering
        </h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th className="text-center">#</th>
                <th>
                  <i className="bi bi-calendar-check me-2 text-primary"></i>
                  Kehadiran
                </th>
                <th>
                  <i className="bi bi-file-earmark-text me-2 text-success"></i>
                  Tugas
                </th>
                <th>
                  <i className="bi bi-journal-text me-2 text-warning"></i>
                  UTS
                </th>
                <th>
                  <i className="bi bi-journal-check me-2 text-danger"></i>
                  UAS
                </th>
                <th className="text-center">
                  <i className="bi bi-diagram-3 me-2 text-info"></i>
                  Cluster
                </th>
                <th className="text-center">
                  <i className="bi bi-tag me-2 text-success"></i>
                  Status
                </th>
                <th className="text-center">
                  <i className="bi bi-rulers me-2 text-secondary"></i>
                  Jarak ke Centroid
                </th>
              </tr>
            </thead>
            <tbody>
              {studentClusters.map((student, idx) => (
                <tr
                  key={idx}
                  className={selectedStudent === idx ? "table-active" : ""}
                  style={{ cursor: "pointer" }}
                >
                  <td className="text-center fw-bold">{idx + 1}</td>
                  <td>
                    <span className="badge bg-primary bg-opacity-75">
                      {student.data[0]}%
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-success bg-opacity-75">
                      {student.data[1]}%
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-warning bg-opacity-75 text-dark">
                      {student.data[2]}
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-danger bg-opacity-75">
                      {student.data[3]}
                    </span>
                  </td>
                  <td className="text-center">
                    <span
                      className={`badge ${
                        student.cluster === 0 ? "bg-info" : "bg-secondary"
                      }`}
                    >
                      Cluster {student.cluster}
                    </span>
                  </td>
                  <td className="text-center">
                    <span
                      className={`badge ${
                        student.label === "Lulus" ? "bg-success" : "bg-danger"
                      }`}
                    >
                      <i
                        className={`bi ${
                          student.label === "Lulus"
                            ? "bi-check-circle"
                            : "bi-x-circle"
                        } me-1`}
                      ></i>
                      {student.label}
                    </span>
                  </td>
                  <td className="text-center">
                    <small className="text-muted">
                      {student.distance.toFixed(2)}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}