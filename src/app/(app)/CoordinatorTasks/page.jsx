"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getMyTasks, createTask, updateTask, updateTaskStatus, escalateTask, deleteTask, getUsersForSelect } from "@/lib/api-client/tasks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, AlertCircle, ClipboardList, Plus, Trash2, Sun, Inbox, Circle, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import EscalateTaskDialog from "@/components/tasks/EscalateTaskDialog";

const priorityStyle = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-50 text-slate-600 border-slate-200",
};

const statusIcon = {
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  in_progress: <AlertCircle className="w-4 h-4 text-blue-500" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
};

const EMPTY_FORM = { title: "", description: "", priority: "medium", due_date: "", assigned_to: "", assigned_to_name: "" };

export default function CoordinatorTasks() {
  const [creating, setCreating] = useState(false);
  const effectiveUser = useCurrentUser();

  const isAdmin = ["admin", "superuser"].includes(effectiveUser?.user_type) || ["admin", "superuser"].includes(effectiveUser?.role);

  const [activeTab, setActiveTab] = useState("daily");
  const [notes, setNotes] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [showDailyForm, setShowDailyForm] = useState(false);
  const [taskType, setTaskType] = useState("daily");
  const [dailyForm, setDailyForm] = useState(EMPTY_FORM);
  const [escalateTask, setEscalateTask] = useState(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const [allTasks, setAllTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const loadData = useCallback(async () => {
    if (!effectiveUser?.email) return;
    try {
      const [taskData, userData] = await Promise.all([
        getMyTasks(effectiveUser.email),
        getUsersForSelect(),
      ]);
      setAllTasks(taskData);
      setUsers(userData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUser?.email]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleUpdate = async ({ id, data }) => {
    try {
      await updateTask(id, {
        status: data.status,
        notes: data.notes,
        completed_date: data.completed_date,
      });
      toast.success("Task updated");
      loadData();
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  const handleCreate = async (data) => {
    try {
      const result = await createTask(data);
      if (result?.success) {
        setShowDailyForm(false);
        setDailyForm(EMPTY_FORM);
        setTaskType("daily");
        toast.success("Task added");
        loadData();
      }
    } catch (err) {
      toast.error("Failed to create task");
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

  const handleEscalateTask = async ({ task, escalatedTo, escalatedToName, reason, followUpDate }) => {
    try {
      const result = await escalateTask({
        taskId: task.id,
        escalatedTo,
        escalatedToName,
        reason,
        followUpDate,
        createdByEmail: effectiveUser?.email,
        createdByName: effectiveUser?.full_name,
      });
      if (result?.success) {
        setEscalateTask(null);
        toast.success("Task escalated and follow-up reminder created");
        loadData();
      }
    } catch (err) {
      toast.error("Failed to escalate task");
    }
  };

  const markComplete = (task) => {
    handleUpdate({ id: task.id, data: { ...task, status: "completed", completed_date: today, notes: notes[task.id] || task.notes || "" } });
    setExpandedId(null);
  };

  const toggleComplete = (task) => {
    // For daily recurring tasks: just record completed_date = today (hides today, reappears tomorrow)
    if (task.is_daily_recurring) {
      handleUpdate({ id: task.id, data: { ...task, completed_date: today } });
    } else {
      handleUpdate({ id: task.id, data: { ...task, status: "completed", completed_date: today } });
    }
  };

  const markInProgress = (task) => {
    handleUpdate({ id: task.id, data: { ...task, status: "in_progress" } });
  };

  // Daily tasks: is_daily_recurring OR due today
  // For recurring tasks: hide if completed_date === today (they'll reappear tomorrow)
  const dailyTasks = allTasks.filter(t => t.is_daily_recurring || t.due_date === today);
  const visibleDailyTasks = dailyTasks.filter(t => {
    if (t.is_daily_recurring) return t.completed_date !== today;
    return t.status !== "completed";
  });

  // Assigned tasks: created by someone else (admin assigned), not recurring daily
  const assignedTasks = allTasks.filter(t => !t.is_daily_recurring && t.due_date !== today && t.created_by_id !== effectiveUser?.id);

  const addTask = () => {
    if (!dailyForm.title.trim()) return;
    if (taskType === "daily") {
      handleCreate({
        title: dailyForm.title,
        description: dailyForm.description,
        priority: dailyForm.priority,
        assigned_to: effectiveUser?.email,
        assigned_to_name: effectiveUser?.full_name,
        is_daily_recurring: true,
      });
    } else {
      if (!dailyForm.assigned_to) return;
      handleCreate({
        title: dailyForm.title,
        description: dailyForm.description,
        priority: dailyForm.priority,
        due_date: dailyForm.due_date,
        assigned_to: dailyForm.assigned_to,
        assigned_to_name: dailyForm.assigned_to_name,
        is_daily_recurring: false,
      });
    }
  };

  const handleUserSelect = (userId) => {
    const user = users.find(u => u.id === userId);
    setDailyForm(p => ({ ...p, assigned_to: user?.email || "", assigned_to_name: user?.full_name || "" }));
  };

  const TaskCard = ({ task, showDelete = false, isDaily = false }) => {
    const isPending = task.status !== "completed" && task.status !== "escalated";
    const isEscalated = task.status === "escalated";
    const borderColor = isEscalated ? "border-l-orange-400" : "border-l-amber-400";
    return (
      <Card className={`border-l-4 ${borderColor}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button
              className="mt-0.5 shrink-0"
              onClick={() => isDaily ? toggleComplete(task) : (!isEscalated && setExpandedId(expandedId === task.id ? null : task.id))}
              title="Mark complete"
            >
              <Circle className="w-5 h-5 text-slate-300 hover:text-teal-500 transition-colors" />
            </button>
            <div className="flex-1">
              <p className="font-medium text-slate-800">{task.title}</p>
              {task.description && <p className="text-sm text-slate-500 mt-0.5">{task.description}</p>}
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className={`text-xs ${priorityStyle[task.priority]}`}>{task.priority}</Badge>
                {task.due_date && <Badge variant="outline" className="text-xs text-slate-500">Due: {task.due_date}</Badge>}
                {isEscalated && (
                  <Badge className="text-xs bg-orange-50 text-orange-700 border border-orange-200">
                    Escalated → {task.escalated_to_name || task.escalated_to}
                  </Badge>
                )}
              </div>
              {isEscalated && task.escalation_reason && (
                <p className="text-xs text-orange-600 mt-1.5 italic">"{task.escalation_reason}"</p>
              )}
              {isEscalated && task.follow_up_date && (
                <p className="text-xs text-slate-400 mt-0.5">Follow-up reminder: {task.follow_up_date}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              {!isDaily && !isEscalated && task.status !== "completed" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 px-2"
                  title="Escalate task"
                  onClick={() => setEscalateTask(task)}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                </Button>
              )}
              {showDelete && isAdmin && (
                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
                  onClick={() => { if (confirm("Delete this task?")) handleDeleteTask(task.id); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
          {!isDaily && expandedId === task.id && isPending && (
            <div className="mt-3 space-y-2">
              <Textarea
                placeholder="Add completion notes (optional)..."
                value={notes[task.id] || ""}
                onChange={e => setNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => markComplete(task)}>Mark Complete</Button>
                <Button size="sm" variant="ghost" className="text-orange-600 hover:bg-orange-50 gap-1"
                  onClick={() => { setExpandedId(null); setEscalateTask(task); }}>
                  <ArrowUpCircle className="w-3.5 h-3.5" /> Escalate
                </Button>
                <Button size="sm" variant="outline" onClick={() => setExpandedId(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const tabs = [
    { key: "daily", label: "Daily Tasks", icon: Sun },
    { key: "assigned", label: "Assigned Tasks", icon: Inbox },
  ];

  const handleEscalate = ({ escalatedTo, escalatedToName, reason, followUpDate }) => {
    handleEscalateTask({ task: escalateTask, escalatedTo, escalatedToName, reason, followUpDate });
  };

  const allUsers = users;

  return (
    <div className="space-y-6">
      {escalateTask && (
        <EscalateTaskDialog
          open={!!escalateTask}
          onClose={() => setEscalateTask(null)}
          task={escalateTask}
          users={allUsers}
          onEscalate={handleEscalate}
          isPending={false}
        />
      )}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Tasks</h1>
        <p className="text-slate-500 text-sm mt-1">
          {visibleDailyTasks.length} daily tasks remaining today
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${
              activeTab === tab.key ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-500"
            }`}>
              {tab.key === "daily" ? visibleDailyTasks.length : assignedTasks.length}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading tasks...</div>
      ) : (
        <>
          {/* Daily Tasks Tab */}
          {activeTab === "daily" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Tasks for today — {format(new Date(), "MMMM d, yyyy")}</p>
                {isAdmin && (
                  <Button size="sm" onClick={() => setShowDailyForm(!showDailyForm)} className="bg-teal-600 hover:bg-teal-700 gap-2">
                    <Plus className="w-4 h-4" /> Add Task
                  </Button>
                )}
              </div>

              {showDailyForm && (
                <Card className="border-teal-200 bg-teal-50/30">
                  <CardContent className="p-4 space-y-3">
                    {/* Task type toggle */}
                    <div>
                      <Label className="mb-2 block text-sm">Task Type</Label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setTaskType("daily")}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                            taskType === "daily"
                              ? "bg-teal-600 text-white border-teal-600"
                              : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"
                          }`}
                        >
                          Daily Recurring
                        </button>
                        <button
                          onClick={() => setTaskType("assigned")}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                            taskType === "assigned"
                              ? "bg-teal-600 text-white border-teal-600"
                              : "bg-white text-slate-600 border-slate-200 hover:border-teal-400"
                          }`}
                        >
                          Assigned Task
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-1 block text-sm">Task Title *</Label>
                      <Input placeholder="What needs to be done?" value={dailyForm.title}
                        onChange={e => setDailyForm(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div>
                      <Label className="mb-1 block text-sm">Description</Label>
                      <Input placeholder="Optional details" value={dailyForm.description}
                        onChange={e => setDailyForm(p => ({ ...p, description: e.target.value }))} />
                    </div>
                    <div className="w-40">
                      <Label className="mb-1 block text-sm">Priority</Label>
                      <Select value={dailyForm.priority} onValueChange={v => setDailyForm(p => ({ ...p, priority: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Assigned task extra fields */}
                    {taskType === "assigned" && (
                      <>
                        <div>
                          <Label className="mb-1 block text-sm">Assign To *</Label>
                          <Select onValueChange={handleUserSelect}>
                            <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                            <SelectContent>
                              {users.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.full_name} ({u.email})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="mb-1 block text-sm">Due Date</Label>
                          <Input type="date" value={dailyForm.due_date}
                            onChange={e => setDailyForm(p => ({ ...p, due_date: e.target.value }))} />
                        </div>
                      </>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700"
                        disabled={!dailyForm.title.trim() || (taskType === "assigned" && !dailyForm.assigned_to) || creating}
                        onClick={addTask}>
                        {creating ? "Adding..." : "Add Task"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setShowDailyForm(false); setDailyForm(EMPTY_FORM); setTaskType("daily"); }}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {visibleDailyTasks.length === 0 ? (
                <Card>
                  <CardContent className="py-14 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30 text-green-400" />
                    <p className="font-medium text-slate-500">All done for today!</p>
                    <p className="text-sm mt-1">Tasks will reset tomorrow.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {visibleDailyTasks.map(t => <TaskCard key={t.id} task={t} showDelete isDaily />)}
                </div>
              )}
            </div>
          )}

          {/* Assigned Tasks Tab */}
          {activeTab === "assigned" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Tasks assigned to you by an admin or therapist</p>
              {assignedTasks.length === 0 ? (
                <Card>
                  <CardContent className="py-14 text-center text-slate-400">
                    <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No assigned tasks at the moment.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {assignedTasks.filter(t => t.status !== "completed" && t.status !== "escalated").map(t => <TaskCard key={t.id} task={t} />)}
                  {assignedTasks.filter(t => t.status === "escalated").length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide pt-2">Escalated</p>
                      {assignedTasks.filter(t => t.status === "escalated").map(t => <TaskCard key={t.id} task={t} />)}
                    </>
                  )}
                  {assignedTasks.filter(t => t.status === "completed").length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide pt-2">Completed</p>
                      {assignedTasks.filter(t => t.status === "completed").map(t => <TaskCard key={t.id} task={t} />)}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
