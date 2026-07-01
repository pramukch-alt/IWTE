import React, { useState } from 'react';
import { Trash2, Edit2, Check, X, Calendar, AlertCircle, CheckCircle, Play, Copy, ChevronUp, ChevronDown, ArrowDownAZ } from 'lucide-react';

export default function ActivityTable({ 
  activities, 
  onUpdateActivity, 
  onDeleteActivity, 
  onDuplicateClick,
  onMoveActivity,
  onSortByPlannedStart,
  isOverallView 
}) {
  // Track which activity is currently being edited inline
  const [editingId, setEditingId] = useState(null);
  
  // Inline edit state variables
  const [activityName, setActivityName] = useState('');
  const [planStart, setPlanStart] = useState('');
  const [planEnd, setPlanEnd] = useState('');
  const [actualStart, setActualStart] = useState('');
  const [actualEnd, setActualEnd] = useState('');

  const startInlineEdit = (act) => {
    setEditingId(act.id);
    setActivityName(act.activity_name);
    setPlanStart(act.plan_start);
    setPlanEnd(act.plan_end);
    setActualStart(act.actual_start || '');
    setActualEnd(act.actual_end || '');
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
    setActivityName('');
    setPlanStart('');
    setPlanEnd('');
    setActualStart('');
    setActualEnd('');
  };

  const handleSave = async (id) => {
    // Plan validations
    if (!activityName.trim()) {
      alert('Activity Name is required.');
      return;
    }
    if (!planStart) {
      alert('Planned Start Date is required.');
      return;
    }
    if (!planEnd) {
      alert('Planned End Date is required.');
      return;
    }
    if (new Date(planEnd) < new Date(planStart)) {
      alert('Planned End Date cannot be earlier than Planned Start Date.');
      return;
    }

    // Actual validations
    if (actualEnd && !actualStart) {
      alert('Actual Start Date must be set if Actual End Date is provided.');
      return;
    }
    if (actualStart && actualEnd && new Date(actualEnd) < new Date(actualStart)) {
      alert('Actual End Date cannot be earlier than Actual Start Date.');
      return;
    }

    const success = await onUpdateActivity(id, activityName.trim(), planStart, planEnd, actualStart, actualEnd);
    if (success) {
      setEditingId(null);
    }
  };

  const getStatusBadge = (act) => {
    const today = new Date('2026-06-26');
    const hasStart = act.actual_start && act.actual_start !== '';
    const hasEnd = act.actual_end && act.actual_end !== '';
    const planEnd = new Date(act.plan_end);

    if (!hasStart) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200/50">
          <Calendar className="w-3 h-3" />
          Not Started
        </span>
      );
    }

    if (hasStart && !hasEnd) {
      if (today > planEnd) {
        const overdueDays = Math.round((today - planEnd) / (1000 * 60 * 60 * 24));
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 animate-pulse-subtle">
            <AlertCircle className="w-3 h-3" />
            Overdue (+{overdueDays}d)
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">
          <Play className="w-3 h-3" />
          In Progress
        </span>
      );
    }

    // Completed
    const actualEnd = new Date(act.actual_end);
    const delayDays = Math.round((actualEnd - planEnd) / (1000 * 60 * 60 * 24));
    
    if (delayDays > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle className="w-3 h-3" />
          Delayed (+{delayDays}d)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle className="w-3 h-3" />
        Completed
      </span>
    );
  };

  // Helper for displaying dates nicely
  const formatDate = (dateString) => {
    if (!dateString) return <span className="text-slate-300 font-normal">—</span>;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper to calculate planned and actual durations in days
  const getDurationString = (act) => {
    // Planned Duration
    const planStart = new Date(act.plan_start);
    const planEnd = new Date(act.plan_end);
    const planDays = Math.round((planEnd - planStart) / (1000 * 60 * 60 * 24)) + 1;

    // Actual Duration
    let actualDaysStr = '—';
    if (act.actual_start) {
      const actStart = new Date(act.actual_start);
      if (act.actual_end) {
        const actEnd = new Date(act.actual_end);
        const days = Math.round((actEnd - actStart) / (1000 * 60 * 60 * 24)) + 1;
        actualDaysStr = `${days} Days`;
      } else {
        // In progress (active since actual_start up to current date 2026-06-26)
        const today = new Date('2026-06-26');
        const days = Math.round((today - actStart) / (1000 * 60 * 60 * 24)) + 1;
        actualDaysStr = `${days} Days (Active)`;
      }
    }

    return (
      <div className="flex flex-col gap-0.5 text-xs">
        <span className="font-semibold text-slate-700">Plan: <span className="font-normal text-slate-500">{planDays} Days</span></span>
        <span className="font-semibold text-slate-700">Actual: <span className="font-normal text-slate-500">{actualDaysStr}</span></span>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Activity Schedule & Records</h3>
          <p className="text-xs text-slate-500 mt-0.5">Manage planned schedules, edit activity names/dates, and update actual progress.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sort Button (Hidden in overall view) */}
          {!isOverallView && onSortByPlannedStart && (
            <button
              onClick={onSortByPlannedStart}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer"
              title="Sort activities chronologically by planned start date"
            >
              <ArrowDownAZ className="w-3.5 h-3.5 text-slate-400" />
              Sort by Plan Start
            </button>
          )}
          <span className="text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200/50 px-2.5 py-1 rounded-md">
            Total Activities: {activities.length}
          </span>
        </div>
      </div>

      {/* Responsive Wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/30 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-6 py-3.5 font-bold">Activity Name</th>
              <th className="px-6 py-3.5 font-bold">Planned Schedule</th>
              <th className="px-6 py-3.5 font-bold">Actual Start Date</th>
              <th className="px-6 py-3.5 font-bold">Actual End Date</th>
              <th className="px-6 py-3.5 font-bold">Duration</th>
              <th className="px-6 py-3.5 font-bold">Status & Delay</th>
              <th className="px-6 py-3.5 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
            {activities.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-8 text-slate-400">
                  No activities. Click "Add Activity" above to create one.
                </td>
              </tr>
            ) : (
              activities.map((act, idx) => {
                const isEditing = editingId === act.id;

                return (
                  <tr key={act.id} className="hover:bg-slate-50/40 transition-colors duration-150">
                    
                    {/* Activity Name (Editable) */}
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {isEditing ? (
                        <input
                          type="text"
                          value={activityName}
                          onChange={(e) => setActivityName(e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 w-full max-w-[280px]"
                          required
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {isOverallView && act.project_name && (
                            <span className="flex-shrink-0 text-teal-600 font-extrabold bg-teal-50 border border-teal-200/60 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                              {act.project_name}
                            </span>
                          )}
                          <span className="truncate">{act.activity_name}</span>
                        </div>
                      )}
                    </td>

                    {/* Planned Schedule Range (Editable) */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-1.5 max-w-[150px]">
                          <input
                            type="date"
                            value={planStart}
                            onChange={(e) => setPlanStart(e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] text-slate-700 focus:outline-hidden focus:border-teal-500 w-full"
                            required
                          />
                          <input
                            type="date"
                            value={planEnd}
                            onChange={(e) => setPlanEnd(e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] text-slate-700 focus:outline-hidden focus:border-teal-500 w-full"
                            required
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-medium text-slate-600">
                            {formatDate(act.plan_start)}
                          </span>
                          <span className="text-slate-400">
                            to {formatDate(act.plan_end)}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Actual Start Date (Editable) */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="date"
                          value={actualStart}
                          onChange={(e) => setActualStart(e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 w-full max-w-[150px]"
                        />
                      ) : (
                        <span className="font-medium text-slate-700">
                          {formatDate(act.actual_start)}
                        </span>
                      )}
                    </td>

                    {/* Actual End Date (Editable) */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        <input
                          type="date"
                          value={actualEnd}
                          onChange={(e) => setActualEnd(e.target.value)}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 w-full max-w-[150px]"
                          disabled={!actualStart} // disable end date input if start is empty
                          placeholder={!actualStart ? 'Set start first' : ''}
                        />
                      ) : (
                        <span className="font-medium text-slate-700">
                          {formatDate(act.actual_end)}
                        </span>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="px-6 py-4">
                      {getDurationString(act)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {getStatusBadge(act)}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSave(act.id)}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            title="Save Changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelInlineEdit}
                            className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                            title="Cancel Edit"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reordering Buttons (Hidden in overall integrated view) */}
                          {!isOverallView && onMoveActivity && (
                            <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5 mr-1">
                              <button
                                onClick={() => onMoveActivity('up', idx)}
                                disabled={idx === 0}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400 rounded transition-colors"
                                title="Move Up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onMoveActivity('down', idx)}
                                disabled={idx === activities.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400 rounded transition-colors"
                                title="Move Down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* Duplicate button (Hidden in integrated overall view) */}
                          {!isOverallView && (
                            <button
                              onClick={() => onDuplicateClick(act)}
                              className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-teal-600 rounded-lg border border-slate-200/80 transition-colors"
                              title="Duplicate to Other Projects"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => startInlineEdit(act)}
                            className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-brand-600 rounded-lg border border-slate-200/80 transition-colors"
                            title="Edit Activity"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete activity "${act.activity_name}"?`)) {
                                onDeleteActivity(act.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-lg border border-rose-200/40 transition-colors"
                            title="Delete Activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
