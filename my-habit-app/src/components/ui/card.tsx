// src/components/ui/card.tsx

"use client";

import React from "react";

export function Card({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

// CardContent 컴포넌트도 export 해야 합니다
export function CardContent({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
