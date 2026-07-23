import React from "react";
export default function PrimaryButton({ children, ...props }) {
  return (
    <button className="adwa-btn-primary" {...props}>
      {children}
    </button>
  );
}
