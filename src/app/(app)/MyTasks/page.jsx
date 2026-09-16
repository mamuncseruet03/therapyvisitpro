"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "@/components/layout/UserContext";
import { getMyTasks, updateTaskStatus } from "@/lib/api-client/tasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock, AlertCircle, ClipboardList } from "lucide-react";
import { toast } from "sonner";

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

export default function MyTasks() {
  const effectiveUser = useCurrentUser();
  const [notes, setNotes] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    if (!effectiveUser?.email) return;
    try {
      const data = await getMyTasks(effectiveUser.email);
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUser?.email]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleUpdate = async ({ id, data }) => {
    try {
      await updateTaskStatus(id, data.status);
      toast.success("Task updated");
      loadTasks();
    } catch (err) {
      toast.error("Failed to update task");
    }
  };

  const markComplete = (task) => {
    handleUpdate({
      id: task.id,
      data: { ...task, status: "completed", notes: notes[task.id] || task.notes || "" },
    });
    setExpandedId(null);
  };

  const markInProgress = (task) => {
    handleUpdate({ id: task.id, data: { ...task, status: "in_progress" } });
  };

  const pending = tasks.filter(t => t.status !== "completed");
  const completed = tasks.filter(t => t.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Tasks</h1>
        <p className="text-slate-500 text-sm mt-1">{pending.length} pending · {completed.length} completed</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400">Loading tasks…</div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No tasks assigned to you.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Pending & In Progress</h2>
              {pending.map(task => (
                <Card key={task.id} className="border-l-4 border-l-amber-400">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {statusIcon[task.status]}
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{task.title}</p>
                          {task.description && <p className="text-sm text-slate-500 mt-1">{task.description}</p>}
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className={`text-xs ${priorityStyle[task.priority]}`}>{task.priority}</Badge>
                            {task.due_date && <Badge variant="outline" className="text-xs text-slate-500">Due: {task.due_date}</Badge>}
                            <Badge variant="outline" className="text-xs capitalize">{task.status.replace("_", " ")}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {task.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => markInProgress(task)}>Start</Button>
                        )}
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}>
                          Complete
                        </Button>
                      </div>
                    </div>
                    {expandedId === task.id && (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          placeholder="Add completion notes (optional)…"
                          value={notes[task.id] || ""}
                          onChange={e => setNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => markComplete(task)}>Mark Complete</Button>
                          <Button size="sm" variant="outline" onClick={() => setExpandedId(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Completed</h2>
              {completed.map(task => (
                <Card key={task.id} className="border-l-4 border-l-green-400 opacity-70">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {statusIcon.completed}
                      <div>
                        <p className="font-medium text-slate-700 line-through">{task.title}</p>
                        {task.notes && <p className="text-sm text-slate-500 mt-1">Notes: {task.notes}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}