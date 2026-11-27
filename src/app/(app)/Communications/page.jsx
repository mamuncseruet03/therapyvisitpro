import Link from "next/link";
import { revalidatePath } from "next/cache";
import { loadVitalAlerts, resolveVitalAlert } from "./actions";

export default async function CommunicationsPage() {
  let alerts;
  try {
    alerts = await loadVitalAlerts();
  } catch (error) {
    if (error?.code !== "P2022") throw error;
    return <main className="space-y-2">
      <h1 className="text-2xl font-bold">Communications</h1>
      <p role="alert">Vital alerts are unavailable until the database update is applied.</p>
    </main>;
  }
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-bold">Communications</h1>
      {[false, true].map((resolved) => {
        const matching = alerts.filter((alert) => Boolean(alert.resolvedAt) === resolved);
        return (
          <section key={String(resolved)} className="space-y-3">
            <h2 className="text-lg font-semibold">{resolved ? "Resolved" : "Urgent Vital Alerts"}</h2>
            {matching.length === 0 && <p className="text-sm text-slate-600">No alerts.</p>}
            {matching.map((alert) => (
              <article key={alert.id} className="space-y-2 rounded-lg border bg-white p-4">
                <Link className="font-semibold text-teal-700 underline" href={`/VisitNoteDetail?id=${alert.vitalVisitId}`}>
                  {alert.patientName}
                </Link>
                <p className="text-sm">{alert.note}</p>
                {resolved ? <p className="whitespace-pre-wrap text-sm">{alert.resolution}</p> : (
                  <form className="space-y-2" action={async (form) => {
                    "use server";
                    await resolveVitalAlert(alert.id, form.get("resolution"));
                    revalidatePath("/Communications");
                  }}>
                    <label className="block text-sm">
                      Resolution note for the therapist
                      <textarea name="resolution" required maxLength={2000} className="mt-1 block w-full rounded border p-2" />
                    </label>
                    <button className="rounded bg-teal-700 px-3 py-2 text-sm text-white">Resolve and Notify Therapist</button>
                  </form>
                )}
              </article>
            ))}
          </section>
        );
      })}
    </main>
  );
}
