"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getUsers, inviteUser, updateUser, syncTherapistsToUsers } from "@/lib/api-client/users";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pencil, UserPlus, RefreshCw, Link2 } from "lucide-react";
import UserProfileBadge from "@/components/users/UserProfileBadge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [inviteForm, setInviteForm] = useState({ email: "", user_type: "therapist" });
  const [editForm, setEditForm] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleUpdateUser = async ({ id, data }) => {
    const result = await updateUser({ id, data });
    if (result.error) { toast.error(result.error); return; }
    toast.success("User updated");
    setEditOpen(false);
    setEditingUser(null);
    loadUsers();
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncTherapistsToUsers();
      toast.success(`Sync complete: ${result.created} created, ${result.linked} linked`);
      loadUsers();
    } catch (err) {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleInvite = async () => {
    try {
      const result = await inviteUser({ email: inviteForm.email, userType: inviteForm.user_type });
      if (result.error) { toast.error(result.error); return; }
      setInviteOpen(false);
      setInviteForm({ email: "", user_type: "therapist" });
      toast.success(`Invite sent to ${inviteForm.email}`);
      loadUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to send invite: " + (err?.message || "Unknown error"));
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      user_type: user.user_type || "therapist",
      phone: user.phone || "",
      credentials: user.credentials || "",
      license_number: user.license_number || "",
      discipline: user.discipline || "",
    });
    setEditOpen(true);
  };

  const handleUpdate = () => {
    // Keep role in sync with user_type for permission checks
    const roleMap = { superuser: "superuser", admin: "admin", therapist: "user", coordinator: "user", hr: "user" };
    const data = { ...editForm, role: roleMap[editForm.user_type] || editForm.user_type };
    handleUpdateUser({ id: editingUser.id, data });
  };

  const filtered = users.filter((u) => {
    const matchSearch = `${u.full_name} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || u.user_type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 text-sm mt-1">{users.length} total users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSync()} disabled={syncing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync Therapists
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 gap-2" onClick={() => setInviteOpen(true)}>
            <UserPlus className="w-4 h-4" /> Invite User
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search users…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="superuser">Superuser</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="therapist">Therapist</SelectItem>
            <SelectItem value="guest">Guest</SelectItem>
            <SelectItem value="client">Agency</SelectItem>
            <SelectItem value="coordinator">Coordinator</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>User Type</TableHead>
              <TableHead className="hidden md:table-cell">Credentials</TableHead>
              <TableHead className="hidden md:table-cell">Discipline</TableHead>
              <TableHead className="hidden md:table-cell">Therapist Profile</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">Loading…</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-400">No users found</TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => (
                <TableRow key={u.id} className="hover:bg-slate-50/60">
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="text-sm text-slate-500">{u.email}</TableCell>
                  <TableCell>
                    <UserProfileBadge userType={u.user_type || "therapist"} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-slate-500">{u.credentials || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-slate-500">{u.discipline || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {u.therapist_id ? (
                      <span className="inline-flex items-center gap-1 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
                        <Link2 className="w-3 h-3" /> Linked
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(u)}>
                      <Pencil className="w-3.5 h-3.5 text-slate-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label>User Type</Label>
              <Select value={inviteForm.user_type} onValueChange={(v) => setInviteForm({ ...inviteForm, user_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superuser">Superuser</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="therapist">Therapist</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!inviteForm.email} className="bg-teal-600 hover:bg-teal-700">
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>User Type</Label>
              <Select value={editForm.user_type} onValueChange={(v) => setEditForm({ ...editForm, user_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superuser">Superuser</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="therapist">Therapist</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="coordinator">Coordinator</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.user_type === "therapist" && (
              <>
                <div>
                  <Label>Phone</Label>
                  <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Credentials</Label>
                    <Input placeholder="PT, DPT" value={editForm.credentials} onChange={(e) => setEditForm({ ...editForm, credentials: e.target.value })} />
                  </div>
                  <div>
                    <Label>License #</Label>
                    <Input value={editForm.license_number} onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Discipline</Label>
                  <Select value={editForm.discipline} onValueChange={(v) => setEditForm({ ...editForm, discipline: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                      <SelectItem value="Occupational Therapy">Occupational Therapy</SelectItem>
                      <SelectItem value="Speech Therapy">Speech Therapy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} className="bg-teal-600 hover:bg-teal-700">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}