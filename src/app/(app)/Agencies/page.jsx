"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAgencies, createAgency, updateAgency, deleteAgency } from "@/lib/api-client/agencies";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Pencil, Trash2, List, Plus, FileText } from "lucide-react";
import AgencyDocumentationSetup from "@/components/agencies/AgencyDocumentationSetup";
import AgencyForm from "@/components/agencies/AgencyForm";

const statusBadge = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function Agencies() {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [agencies, setAgencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAgencies = useCallback(async () => {
    try {
      const data = await getAgencies();
      setAgencies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAgencies(); }, [loadAgencies]);

  const handleCreate = async (data) => {
    try {
      const result = await createAgency(data);
      if (result?.success) {
        toast.success("Agency created");
        setFormOpen(false);
        loadAgencies();
      }
    } catch (err) {
      toast.error("Failed to create agency");
    }
  };

  const handleUpdate = async ({ id, data }) => {
    try {
      const result = await updateAgency(id, data);
      if (result?.success) {
        toast.success("Agency updated");
        setEditing(null);
        loadAgencies();
      }
    } catch (err) {
      toast.error("Failed to update agency");
    }
  };

  const handleDelete = async (id) => {
    try {
      const result = await deleteAgency(id);
      if (result?.success) {
        toast.success("Agency deleted");
        loadAgencies();
      }
    } catch (err) {
      toast.error("Failed to delete agency");
    }
  };

  const filtered = agencies.filter((a) =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.city?.toLowerCase().includes(search.toLowerCase()) ||
    a.contact_person?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agencies</h1>
        <p className="text-slate-500 text-sm mt-1">{agencies.length} total agencies</p>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3 h-auto">
          <TabsTrigger value="list" className="gap-2 py-2.5">
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Agency List</span>
          </TabsTrigger>
          <TabsTrigger value="add" className="gap-2 py-2.5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Agency</span>
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2 py-2.5">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Doc Setup</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search agencies…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agency Name</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden lg:table-cell">Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading…</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-400">No agencies found</TableCell></TableRow>
                ) : filtered.map((a) => (
                  <TableRow key={a.id} className="hover:bg-slate-50/60">
                    <TableCell>
                      <div className="font-medium text-slate-900">{a.name}</div>
                      {a.contacts && a.contacts.length > 0 && (
                        <div className="text-xs text-slate-500 mt-0.5">{a.contacts[0].name || "Contact added"}</div>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-500">
                      {a.city && a.state ? `${a.city}, ${a.state}` : a.city || a.state || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-slate-500">
                      {a.contacts && a.contacts.length > 0 ? a.contacts[0].email || "—" : a.email || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                      {a.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${statusBadge[a.status] || ""}`}>{a.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(a)}>
                          <Pencil className="w-3.5 h-3.5 text-slate-400" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(a.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <div className="max-w-2xl">
            <Card>
              <CardContent className="p-6">
                <Button className="w-full bg-teal-600 hover:bg-teal-700 gap-2" onClick={() => setFormOpen(true)}>
                  <Plus className="w-4 h-4" /> Add New Agency
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="docs">
          <AgencyDocumentationSetup agencies={agencies} />
        </TabsContent>
      </Tabs>

      {formOpen && <AgencyForm open={formOpen} onClose={() => setFormOpen(false)} onSave={(d) => handleCreate(d)} />}
      {editing && <AgencyForm open={!!editing} onClose={() => setEditing(null)} onSave={(d) => handleUpdate({ id: editing.id, data: d })} initial={editing} />}
    </div>
  );
}