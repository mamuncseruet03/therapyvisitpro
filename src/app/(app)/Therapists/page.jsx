"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getTherapists, createTherapist, updateTherapist, deleteTherapist } from "@/lib/api-client/therapists";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TherapistForm from "@/components/therapists/TherapistForm";

const discColor = {
  "Physical Therapy": "bg-blue-50 text-blue-700 border-blue-200",
  "Occupational Therapy": "bg-amber-50 text-amber-700 border-amber-200",
  "Speech Therapy": "bg-violet-50 text-violet-700 border-violet-200",
};

export default function Therapists() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDiscipline, setFilterDiscipline] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [therapists, setTherapists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTherapists = useCallback(async () => {
    try {
      const data = await getTherapists();
      setTherapists(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadTherapists(); }, [loadTherapists]);

  const handleCreate = async (d) => {
    try {
      const result = await createTherapist(d);
      if (result?.success) {
        toast.success("Therapist created");
        setFormOpen(false);
        loadTherapists();
      }
    } catch (err) {
      toast.error("Failed to create therapist");
    }
  };

  const handleUpdate = async (d) => {
    try {
      const result = await updateTherapist(editing.id, d);
      if (result?.success) {
        toast.success("Therapist updated");
        setEditing(null);
        loadTherapists();
      }
    } catch (err) {
      toast.error("Failed to update therapist");
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await deleteTherapist(id);
      if (result?.success) {
        toast.success("Therapist deleted");
        loadTherapists();
      }
    } catch (err) {
      toast.error("Failed to delete therapist");
    }
  };

  const filtered = therapists.filter((t) => {
    const matchSearch = `${t.full_name} ${t.credentials || ""} ${t.license_number || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchDiscipline = filterDiscipline === "all" || t.discipline === filterDiscipline;
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    return matchSearch && matchDiscipline && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Therapists</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} of {therapists.length} therapists</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2" onClick={() => setFormOpen(true)}>
          <Plus className="w-4 h-4" /> Add Therapist
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search by name, credentials…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterDiscipline} onValueChange={setFilterDiscipline}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Disciplines</SelectItem>
            <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
            <SelectItem value="Occupational Therapy">Occupational Therapy</SelectItem>
            <SelectItem value="Speech Therapy">Speech Therapy</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Discipline</TableHead>
              <TableHead className="hidden md:table-cell">Credentials</TableHead>
              <TableHead className="hidden md:table-cell">License #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No therapists found</TableCell></TableRow>
            ) : filtered.map((t) => (
              <TableRow key={t.id} className="hover:bg-slate-50/60">
                <TableCell className="font-medium">{t.full_name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${discColor[t.discipline] || ""}`}>
                    {t.discipline?.replace(" Therapy", "")}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-slate-500">{t.credentials || "—"}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-slate-500">{t.license_number || "—"}</TableCell>
                <TableCell>
                  <Badge className={`text-xs ${t.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {t.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(t)}>
                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {formOpen && <TherapistForm open={formOpen} onClose={() => setFormOpen(false)} onSave={(d) => handleCreate(d)} />}
      {editing && <TherapistForm open={!!editing} onClose={() => setEditing(null)} onSave={(d) => handleUpdate(d)} initial={editing} />}
    </div>
  );
}