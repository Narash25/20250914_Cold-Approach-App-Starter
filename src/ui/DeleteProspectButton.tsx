"use client";
import { useState } from "react";

export default function DeleteProspectButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (!confirm("Delete this prospect and all its touches?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/prospects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          alert(data?.error ?? `Delete failed (${res.status})`);
        } catch {
          alert(`Delete failed (${res.status}): ${text}`);
        }
        return;
      }
      window.location.href = "/prospects";
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn-danger" onClick={onDelete} disabled={loading}>
      {loading ? "Deleting..." : "Delete"}
    </button>
  );
}
