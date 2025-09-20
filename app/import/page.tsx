"use client";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useState } from "react";

// Accepts rows where either:
// - First Name / Last Name, or
// - Name (will be split by first space)
type Row = {
  "First Name"?: string;
  "Last Name"?: string;
  Name?: string;
  Company?: string;
  Email?: string;
  Phone?: string;
  "First Contact"?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  email?: string;
  phone?: string;
  first_contact?: string;
};

function excelSerialToISODate(value: any): string | null {
  if (typeof value === "number" && isFinite(value)) {
    const ms = (value - 25569) * 86400 * 1000;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

function toDdMYyyy(isoOrRaw: any): string {
  // already dd-m-yyyy?
  if (typeof isoOrRaw === "string" && /^\d{1,2}-\d{1,2}-\d{4}$/.test(isoOrRaw))
    return isoOrRaw;
  // ISO string?
  if (typeof isoOrRaw === "string") {
    const d = new Date(isoOrRaw);
    if (!isNaN(d.getTime()))
      return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  }
  // Excel serial?
  const serial = excelSerialToISODate(isoOrRaw);
  if (serial) {
    const d = new Date(serial);
    return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  }
  // fallback: today
  const t = new Date();
  return `${t.getDate()}-${t.getMonth() + 1}-${t.getFullYear()}`;
}

export default function ImportPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [importing, setImporting] = useState(false);

  const parseFile = (file: File) => {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".csv")) {
      Papa.parse<Row>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (res) => setRows(res.data),
        error: (err: Error) => alert("CSV parse error: " + err.message),
      });
      return;
    }
    // xlsx/xls
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const first = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Row>(first, { raw: true });
        setRows(json);
      } catch (err: any) {
        alert("Excel parse error: " + (err?.message ?? String(err)));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const doImport = async () => {
    setImporting(true);
    let created = 0;

    for (const r of rows) {
      // Name handling
      let firstName = (r["First Name"] ?? r.first_name ?? "") as string;
      let lastName = (r["Last Name"] ?? r.last_name ?? "") as string;

      if (!firstName && !lastName && r.Name) {
        const parts = String(r.Name).trim().split(/\s+/);
        firstName = parts.shift() || "";
        lastName = parts.join(" ");
      }

      if (!firstName || !lastName) continue; // require both

      const payload = {
        firstName,
        lastName,
        company: (r.Company ?? r.company ?? "") as string,
        email: (r.Email ?? r.email ?? "") as string,
        phone: (r.Phone ?? r.phone ?? "") as string,
        // send dd-m-yyyy to server
        firstContact: toDdMYyyy((r["First Contact"] ?? r.first_contact) as any),
        status: "Pending",
        notes: "",
      };

      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) created++;
    }

    setImporting(false);
    alert(`Imported ${created} prospect(s).`);
    window.location.href = "/prospects";
  };

  return (
    <div className="card p-4 max-w-2xl">
      <h3 className="font-semibold mb-3">Import Prospects (CSV / Excel)</h3>

      <input
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, .xlsx, .xls"
        onChange={(e) => e.target.files && parseFile(e.target.files[0])}
      />

      <div className="text-sm text-gray-600 mt-2">
        Supported: <b>.csv</b>, <b>.xlsx</b>, <b>.xls</b>. Columns:
        <div className="mt-1">
          Prefer <b>First Name</b>, <b>Last Name</b>, <b>Company</b>,{" "}
          <b>Email</b>, <b>Phone</b>, <b>First Contact</b> (dd-m-yyyy or Excel
          date).
          <br />
          If only <b>Name</b> is present, it will be split into first / last.
        </div>
      </div>

      <div className="mt-3">
        <button
          className="btn-primary"
          disabled={!rows.length || importing}
          onClick={doImport}
        >
          {importing ? "Importing..." : `Import ${rows.length} rows`}
        </button>
      </div>
    </div>
  );
}
