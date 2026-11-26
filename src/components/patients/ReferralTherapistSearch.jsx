"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findReferralTherapists } from "./match-therapist-actions";

export default function ReferralTherapistSearch({ form, onChange, children }) {
  const { address, city, state, zip, therapy_types, agency, insurance } = form;
  const addressZip = address?.trim().match(/(?:,\s*|\b[A-Z]{2}\s+)(\d{5}(?:-\d{4})?)$/i)?.[1];
  const searchZip = zip?.trim() || addressZip || "";
  const input = { zip: searchZip, city: city || "", state: state || "", therapyTypes: therapy_types, agency, insurance };
  const key = JSON.stringify(input);
  const [search, setSearch] = useState(null);
  const [busy, setBusy] = useState(false);
  const current = search?.key === key ? search : null;

  async function find() {
    setBusy(true);
    try {
      const result = await findReferralTherapists(input);
      setSearch({ key, result });
    } catch {
      setSearch({ key, error: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Find Therapist" className="space-y-3 rounded-lg border p-3">
      <h3 className="font-semibold">Patient Address</h3>
      <label className="block text-sm">Street address
        <Input value={address || ""} onChange={(e) => onChange("address", e.target.value)} />
      </label>
      <div className="grid gap-2 sm:grid-cols-3">
        {[["city", "City"], ["state", "State"], ["zip", "ZIP code"]].map(([field, label]) => (
          <label key={field} className="text-sm">{label}
            <Input value={form[field] || ""} onChange={(e) => onChange(field, e.target.value)} />
          </label>
        ))}
      </div>
      {children}
      <Button type="button" variant="outline" disabled={busy || !therapy_types?.length || !(searchZip || (city?.trim() && state?.trim()))} onClick={find}>
        {busy ? "Searching…" : "Find Therapist"}
      </Button>
      <p className="text-xs text-slate-600">Matches use ZIP code or city and state. Map matches use the postal area center.</p>
      {current?.error && <p role="alert" className="text-sm text-red-700">Therapist search failed. Try again.</p>}
      {current?.result && (
        <div aria-live="polite" className="space-y-2">
          <p className="text-sm">{!current.result.location ? "Address could not be located. Showing eligible therapists for the selected therapy types with coverage unverified." :
            current.result.matches.length ? `Matches for ${current.result.location}` : `No therapists cover ${current.result.location} for the selected therapy types.`}</p>
          {current.result.matches.map((match) => (
            <article key={match.id} className="space-y-2 rounded border p-2">
              <p className="font-medium">{match.name} ({match.credentials || match.discipline})</p>
              <ul className="text-sm text-slate-600">
                {match.reasons.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
              <div className="flex flex-wrap gap-2">
                {[["evaluating", "Evaluating"], ["treating", "Treating"]].map(([role, label]) => {
                  if (!match[role]) return null;
                  const field = `${role}_therapist_${match.discipline.toLowerCase()}`;
                  const selected = form[field] === match.name;
                  return <Button key={role} type="button" size="sm" variant="outline" aria-pressed={selected}
                    onClick={() => onChange(field, match.name)}>{selected ? `Selected as ${label}` : `Select as ${label}`}</Button>;
                })}
              </div>
            </article>
          ))}
        </div>
      )}
      <a href="https://www.geonames.org/export/zip/" target="_blank" rel="noreferrer" className="text-xs underline">Postal data by GeoNames (CC BY 4.0)</a>
    </section>
  );
}
