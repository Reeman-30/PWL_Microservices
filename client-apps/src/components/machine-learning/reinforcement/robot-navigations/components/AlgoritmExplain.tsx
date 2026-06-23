import React from "react";

export default function AlgoritmExplain() {
  return (
    <div className="col-12">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-secondary text-white">
          <h5 className="mb-0">
            <i className="bi bi-book me-2"></i>
            Tentang Q-Learning
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <h6 className="text-primary">
                <i className="bi bi-lightbulb me-2"></i>
                Apa itu Q-Learning?
              </h6>
              <p className="text-muted mb-0">
                Q-Learning adalah algoritma Reinforcement Learning yang
                memungkinkan agent belajar kebijakan optimal melalui trial and
                error. Agent mempelajari nilai (Q-value) dari setiap action di
                setiap state untuk memaksimalkan reward jangka panjang.
              </p>
            </div>
            <div className="col-md-6">
              <h6 className="text-success">
                <i className="bi bi-gear me-2"></i>
                Cara Kerja
              </h6>
              <ul className="text-muted mb-0">
                <li>Agent mulai dari posisi start (🤖)</li>
                <li>Memilih action (↑↓←→) berdasarkan Q-values</li>
                <li>Menerima reward (+100 goal, -100 trap, -1 step)</li>
                <li>Update Q-values menggunakan Bellman equation</li>
                <li>Ulangi hingga menemukan kebijakan optimal</li>
              </ul>
            </div>
            <div className="col-md-6">
              <h6 className="text-warning">
                <i className="bi bi-calculator me-2"></i>
                Hyperparameters
              </h6>
              <ul className="text-muted mb-0 small">
                <li>
                  <strong>Learning Rate (α):</strong> 0.1 - Seberapa cepat agent
                  belajar
                </li>
                <li>
                  <strong>Discount Factor (γ):</strong> 0.9 - Pentingnya reward
                  masa depan
                </li>
                <li>
                  <strong>Epsilon (ε):</strong> 0.1 - Exploration vs
                  Exploitation
                </li>
              </ul>
            </div>
            <div className="col-md-6">
              <h6 className="text-info">
                <i className="bi bi-trophy me-2"></i>
                Reward System
              </h6>
              <ul className="text-muted mb-0 small">
                <li>
                  <strong>Goal (🏆):</strong> +100 reward
                </li>
                <li>
                  <strong>Trap (💀):</strong> -100 reward
                </li>
                <li>
                  <strong>Each Step:</strong> -1 reward (encourage efficiency)
                </li>
                <li>
                  <strong>Wall (🧱):</strong> Cannot move (stay in place)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
