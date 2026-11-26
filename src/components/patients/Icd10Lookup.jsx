"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchIcd10 } from "./icd10-actions";

export default function Icd10Lookup({ onSelect }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState("idle");

  async function search() {
    setStatus("loading");
    setResults(null);
    try {
      setResults(await searchIcd10(term));
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="col-span-full space-y-1">
      <div className="flex gap-2">
        <Input aria-label="Search ICD-10 codes or diagnoses" placeholder="Search by ICD-10 code or diagnosis" value={term} disabled={status === "loading"} onChange={(event) => {
          setTerm(event.target.value);
          setResults(null);
          setStatus("idle");
        }} onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          if (term.trim().length >= 2 && status !== "loading") void search();
        }} maxLength={100} />
        <Button type="button" variant="outline" onClick={search} disabled={term.trim().length < 2 || status === "loading"}>
          {status === "loading" ? "Searching…" : "Search"}
        </Button>
      </div>
      {status === "error" && <p role="alert" className="text-sm text-red-700">Diagnosis search is unavailable. Try again or enter the code manually.</p>}
      {results?.length === 0 && <p role="status" className="text-sm text-slate-600">No matching diagnoses.</p>}
      {results?.length > 0 && (
        <ul aria-label="Matching diagnoses" className="max-h-48 overflow-y-auto rounded border">
          {results.map(({ code, description }) => (
            <li key={code}>
              <button type="button" className="w-full p-2 text-left text-sm hover:bg-slate-100" onClick={() => {
                onSelect({ diagnosis: description, icd10_code: code });
                setTerm("");
                setResults(null);
              }}><strong>{code}</strong> {description}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
