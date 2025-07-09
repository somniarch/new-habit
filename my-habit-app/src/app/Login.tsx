"use client";

import React, { useState } from "react";

export default function Login({ onLogin }: { onLogin: (userId: string, isAdmin: boolean) => void }) {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const adminId = "admin";
  const adminPw = "admin123";

  const handleSubmit = async () => {
    if (id === adminId && password === adminPw) {
      onLogin(id, true);
      return;
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ id, password }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (data.success) {
      onLogin(data.id, false);
    } else {
      setError("아이디 또는 비밀번호가 틀렸습니다.");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4 border rounded space-y-4">
      <input
        type="text"
        placeholder="User ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
        className="w-full border rounded p-2"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded p-2"
      />
      <button onClick={handleSubmit} className="w-full bg-blue-600 text-white py-2 rounded">
        로그인
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
