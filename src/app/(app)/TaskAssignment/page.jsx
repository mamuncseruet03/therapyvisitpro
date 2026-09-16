"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getTasks, createTask, updateTaskStatus, deleteTask, getUsersForSelect } from "@/lib/api-client/tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, ClipboardList, Calendar, User, Flag } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const priorityColor = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};
const statusColor = {
  pending: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
};

const EMPTY = { title: "", description: "", assigned_to: "", assigned_to_name: "", due_date: "", priority: "medium", task_type: "assigned" };

export default function TaskAssignment() {
  const effectiveUser = useCurrentUser();
  const isAdmin = ["admin", "superuser"].includes(effectiveUser?.role) || ["admin", "superuser"].includes(effectiveUser?.user_type);
  const isTherapist = effectiveUser?.role === "therapist" || effectiveUser?.user_type === "therapist";
  const canAssign = isAdmin || isTherapist;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [filterStatus, setFilterStatus] = useState("all");
  const [taskType, setTaskType] = useState("assigned");
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [taskData, userData] = await Promise.all([getTasks(), getUsersForSelect()]);
      setTasks(taskData);
      setUsers(userData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const [creating, setCreating] = useState(false);
  const handleCreateTask = async (data) => {
    setCreating(true);
    try {
      const result = await createTask(data);
      if (result?.success) {
        setShowForm(false);
        setForm(EMPTY);
        toast.success("Task created");
        loadData();
      }
    } catch (err) {
      toast.error("Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const result = await deleteTask(id);
      if (result?.success) {
        toast.success("Task deleted");
        loadData();
      }
    } catch (err) {
      toast.error("Failed to delete task");
    }
  };

  const handleUpdateStatus = async ({ id, status }) => {
    try {
      await updateTaskStatus(id, status);
      loadData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  if (!canAssign) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">Only admins and therapists can access this page.</p>
      </div>
    );
  }

  const filtered = filterStatus === "all" ? tasks : tasks.filter(t => t.status === filterStatus);

  const handleUserSelect = (userId) => {
    const user = users.find(u => u.id === userId);
    setForm(p => ({ ...p, assigned_to: user?.email || "", assigned_to_name: user?.full_name || "" }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Task Assignment</h1>
          <p className="text-slate-500 text-sm mt-1">Assign and track tasks for your team</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-teal-600 hover:bg-teal-700 gap-2">
          <Plus className="w-4 h-4" /> New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "in_progress", "completed"].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterStatus === s ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"}`}
          >
            {s === "all" ? "All" : s.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
            {s !== "all" && <span className="ml-1 opacity-70">({tasks.filter(t => t.status === s).length})</span>}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {isLoading ? (
        <div className="text-center py-16 text-slate-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No tasks found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <Card key={task.id} className={task.status === "completed" ? "opacity-70" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className={`font-medium text-slate-900 ${task.status === "completed" ? "line-through text-slate-400" : ""}`}>{task.title}</p>
                      <Badge variant="outline" className={`text-xs ${priorityColor[task.priority]}`}>
                        <Flag className="w-3 h-3 mr-1" />{task.priority}
                      </Badge>
                    </div>
                    {task.description && <p className="text-sm text-slate-500 mb-2">{task.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      {task.assigned_to_name && (
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{task.assigned_to_name}</span>
                      )}
                      {task.due_date && (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(task.due_date), "MMM d, yyyy")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={task.status} onValueChange={(v) => handleUpdateStatus({ id: task.id, status: v })}>
                      <SelectTrigger className="h-7 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => { if (confirm("Delete this task?")) handleDeleteTask(task.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setForm(EMPTY); setTaskType("assigned"); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Task type toggle */}
            <div>
              <Label className="mb-2 block">Task Type</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTaskType("assigned")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    taskType === "assigned" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"
                  }`}
                >
                  Assigned Task
                </button>
                <button
                  onClick={() => setTaskType("daily")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    taskType === "daily" ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"
                  }`}
                >
                  Daily Recurring
                </button>
              </div>
            </div>

            <div>
              <Label className="mb-1 block">Title *</Label>
              <Input placeholder="Task title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1 block">Description</Label>
              <Input placeholder="Optional details" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <Label className="mb-1 block">Assign To *</Label>
              <Select onValueChange={handleUserSelect}>
                <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                <SelectContent>
                  {users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.email})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className={`grid gap-4 ${taskType === "assigned" ? "grid-cols-2" : "grid-cols-1"}`}>
              {taskType === "assigned" && (
                <div>
                  <Label className="mb-1 block">Due Date</Label>
                  <Input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} />
                </div>
              )}
              <div>
                <Label className="mb-1 block">Priority</Label>
                <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY); setTaskType("assigned"); }}>Cancel</Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              disabled={!form.title || !form.assigned_to || creating}
              onClick={() => {
                const payload = taskType === "daily"
                  ? { ...form, is_daily_recurring: true, due_date: "" }
                  : { ...form, is_daily_recurring: false };
                handleCreateTask(payload);
              }}
            >
              {creating ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
