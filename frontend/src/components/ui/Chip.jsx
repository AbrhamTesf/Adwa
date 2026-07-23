import React from "react";
export default function Chip({ label, active, onClick, icon }) {
  return (
    <button className="adwa-chip" data-active={active} onClick={onClick}>
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </button>
  );
}
