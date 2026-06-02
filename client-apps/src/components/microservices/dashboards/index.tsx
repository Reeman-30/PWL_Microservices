"use client";

import { useAuth } from "@/components/auths/context/auth-context";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return <p>User tidak ditemukan. Silakan login kembali.</p>;
  }

  return (
    <div>
      <h1>Profile Page</h1>

      <div>
        <p>
          <strong>ID:</strong> {user.id}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Nama:</strong> {user.name}
        </p>
      </div>

      <hr />

      <button onClick={logout}>Logout</button>
    </div>
  );
}
