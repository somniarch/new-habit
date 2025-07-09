"use client";

import React, { useState } from "react";

export default function Login({ onLogin }: { onLogin: (userId: string, isAdmin: boolean) => void }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const adminId = "admin";
  const adminPw = "admin123";

  const handleSubmit = async () => {
    if (userId === adminId && password === adminPw) {
      onLogin(userId, true);
      return;
    }

    const payload = { userId, password };
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (data.success) {
      onLogin(data.userId, false);
    } else {
      setError("아이디 또는 비밀번호가 틀렸습니다.");
    }
  };

  return (
    <div className="max-w-sm mx-auto p-4 border rounded space-y-4">
      <input
        type="text"
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="w-full border rounded p-2"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
