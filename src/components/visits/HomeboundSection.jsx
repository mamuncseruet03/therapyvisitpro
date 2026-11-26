import { Input } from "@/components/ui/input";

export default function HomeboundSection({ form, set }) {
  return (
    <div className="border rounded-lg p-4 bg-slate-50 space-y-3">
      <h4 className="font-semibold text-slate-800">Homebound <span className="text-red-500">★</span></h4>
      <div className="border-t pt-3">
        <p className="text-sm font-medium text-slate-700 mb-2">Homebound Reason</p>
        <div className="space-y-2">
          {["Medical Restriction", "Needs assistance for all activities", "Residual Weakness", "Severe SOB, SOB upon exertion", "Confusion, unable to go out of home alone", "Dependent upon adaptive devices", "Requires assistance to ambulate", "Pain with ambulation", "Unable to safely leave home unassisted", "Not Homebound"].map((reason) => {
            const checked = (form.homebound_reasons || []).includes(reason);
            return (
              <label key={reason} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={checked} onChange={(e) => { const current = form.homebound_reasons || []; set("homebound_reasons", e.target.checked ? [...current, reason] : current.filter((r) => r !== reason)); }} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
                <span className="text-sm text-slate-700">{reason}</span>
              </label>
            );
          })}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={!!(form.homebound_other !== undefined && form.homebound_other !== null)} onChange={(e) => set("homebound_other", e.target.checked ? "" : null)} className="w-4 h-4 rounded border-slate-300 text-teal-600 cursor-pointer" />
            <span className="text-sm text-slate-700">Other</span>
            {(form.homebound_other !== undefined && form.homebound_other !== null) && (
              <div className="flex-1 relative">
                <input type="text" maxLength={100} value={form.homebound_other || ""} onChange={(e) => set("homebound_other", e.target.value)} className="w-full h-8 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
                <span className="absolute right-2 bottom-1 text-[10px] text-slate-400">{(form.homebound_other || "").length}/100</span>
              </div>
            )}
          </label>
        </div>
      </div>
    </div>
  );
}
