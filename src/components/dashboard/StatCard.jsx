import { Card } from "@/components/ui/card";

export default function StatCard({ label, value, icon: Icon, accent = "bg-teal-50 text-teal-600" }) {
  return (
    <Card className="p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`rounded-xl p-3 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      </div>
    </Card>
  );
}
