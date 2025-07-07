"use client";

import React from "react";

type CardContentProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

export function CardContent({ className = "", children, ...props }: CardContentProps) {
  return (
    <div className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  );
}
