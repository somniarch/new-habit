// src/components/ui/checkbox.tsx
import * as React from "react";

export function Checkbox({
  checked,
  onCheckedChange
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="w-4 h-4"
    />
  );
}
