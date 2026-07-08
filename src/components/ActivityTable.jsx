import React, { useState } from 'react';
import { Trash2, Edit2, Check, X, Calendar, AlertCircle, CheckCircle, Play, Copy, ChevronUp, ChevronDown, ChevronRight, ArrowDownAZ } from 'lucide-react';

const PALETTE_COLORS = [
  { hex: '#0D9488', name: 'Teal' },
  { hex: '#5648E0', name: 'Blue' },
  { hex: '#F6BB00', name: 'Yellow' },
  { hex: '#D81B60', name: 'Pink' },
  { hex: '#616161', name: 'Dark Grey' },
  { hex: '#4285F4', name: 'Light Blue' },
  { hex: '#D5250D', name: 'Red' },
  { hex: '#C0CA33', name: 'Lime' },
  { hex: '#AD1457', name: 'Maroon' },
  { hex: '#B39DDB', name: 'Lavender' },
  { hex: '#E67C73', name: 'Salmon' },
  { hex: '#F4511E', name: 'Deep Orange' },
  { hex: '#EF6C00', name: 'Orange' },
  { hex: '#0B8043', name: 'Forest Green' },
  { hex: '#3F51B5', name: 'Royal Blue' },
  { hex: '#BFBFBF', name: 'Light Grey' }
];

const LockIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M5.25 10.0546V8C5.25 4.27208 8.27208 1.25 12 1.25C15.7279 1.25 18.75 4.27208 18.75 8V10.0546C19.8648 10.1379 20.5907 10.348 21.1213 10.8787C22 11.7574 22 13.1716 22 16C22 18.8284 22 20.2426 21.1213 21.1213C20.2426 22 18.8284 22 16 22H8C5.17157 22 3.75736 22 2.87868 21.1213C2 20.2426 2 18.8284 2 16C2 13.1716 2 11.7574 2.87868 10.8787C3.40931 10.348 4.13525 10.1379 5.25 10.0546ZM6.75 8C6.75 5.10051 9.10051 2.75 12 2.75C14.8995 2.75 17.25 5.10051 17.25 8V10.0036C16.867 10 16.4515 10 16 10H8C7.54849 10 7.13301 10 6.75 10.0036V8ZM14 16C14 17.1046 13.1046 18 12 18C10.8954 18 10 17.1046 10 16C10 14.8954 10.8954 14 12 14C13.1046 14 14 14.8954 14 16Z" fill="#bd2828"/>
  </svg>
);

const UnlockIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M6.75 8C6.75 5.10051 9.10051 2.75 12 2.75C14.4453 2.75 16.5018 4.42242 17.0846 6.68694C17.1879 7.08808 17.5968 7.32957 17.9979 7.22633C18.3991 7.12308 18.6405 6.7142 18.5373 6.31306C17.788 3.4019 15.1463 1.25 12 1.25C8.27208 1.25 5.25 4.27208 5.25 8V10.0546C4.13525 10.1379 3.40931 10.348 2.87868 10.8787C2 11.7574 2 13.1716 2 16C2 18.8284 2 20.2426 2.87868 21.1213C3.75736 22 5.17157 22 8 22H16C18.8284 22 20.2426 22 21.1213 21.1213C22 20.2426 22 18.8284 22 16C22 13.1716 22 11.7574 21.1213 10.8787C20.2426 10 18.8284 10 16 10H8C7.54849 10 7.13301 10 6.75 10.0036V8ZM14 16C14 17.1046 13.1046 18 12 18C10.8954 18 10 17.1046 10 16C10 14.8954 10.8954 14 12 14C13.1046 14 14 14.8954 14 16Z" fill="#257432"/>
  </svg>
);

export default function ActivityTable({ 
  activities, 
  onUpdateActivity, 
  onDeleteActivity, 
  onDuplicateClick,
  onMoveActivity,
  onSortByPlannedStart,
  isOverallView,
  collapsedGroups,
  onToggleGroupCollapse,
  parentGroups,
  isOverallSorted = false
}) {
  // Track which activity is currently being edited inline
  const [editingId, setEditingId] = useState(null);
  
  // Inline edit state variables
  const [activityName, setActivityName] = useState('');
  const [planStart, setPlanStart] = useState('');
  const [planEnd, setPlanEnd] = useState('');
  const [actualStart, setActualStart] = useState('');
  const [actualEnd, setActualEnd] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [parentId, setParentId] = useState(null);
  const [color, setColor] = useState('#0D9488');
  const [isCritical, setIsCritical] = useState(false);

  const startInlineEdit = (act) => {
    setEditingId(act.id);
    setActivityName(act.activity_name);
    setPlanStart(act.plan_start || '');
    setPlanEnd(act.plan_end || '');
    setActualStart(act.actual_start || '');
    setActualEnd(act.actual_end || '');
    setIsGroup(act.is_group || false);
    setParentId(act.parent_id || null);
    setColor(act.color || '#0D9488');
    setIsCritical(act.is_critical || false);
  };

  const cancelInlineEdit = () => {
    setEditingId(null);
    setActivityName('');
    setPlanStart('');
    setPlanEnd('');
    setActualStart('');
    setActualEnd('');
    setIsGroup(false);
    setParentId(null);
    setColor('#0D9488');
    setIsCritical(false);
  };

  const handleSave = async (id) => {
    // Plan validations
    if (!activityName.trim()) {
      alert('Activity Name is required.');
      return;
    }
    if (!isGroup) {
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

    const success = await onUpdateActivity(id, activityName.trim(), planStart, planEnd, actualStart, actualEnd, isGroup, parentId, color, isCritical);
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
          {/* Sort Button */}
          {onSortByPlannedStart && (
            <button
              onClick={onSortByPlannedStart}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border shadow-2xs transition-all cursor-pointer ${
                isOverallView && isOverallSorted
                  ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100/50'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
              title="Sort activities chronologically by planned start date"
            >
              <ArrowDownAZ className={`w-3.5 h-3.5 ${isOverallView && isOverallSorted ? 'text-teal-600' : 'text-slate-400'}`} />
              Sort by Plan Start {isOverallView && isOverallSorted ? '(Active)' : ''}
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
                const isCollapsed = collapsedGroups?.includes(act.id);

                return (
                  <tr 
                    key={act.id} 
                    className={`hover:bg-slate-50/40 transition-colors duration-150 ${
                      act.is_group ? 'bg-slate-50/40 font-bold' : ''
                    }`}
                  >
                    
                    {/* Activity Name (Editable) */}
                    <td 
                      className="px-6 py-4 font-semibold text-slate-800"
                      style={{ paddingLeft: `${24 + (act.depth || 0) * 16}px` }}
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-1.5 w-full max-w-[280px]">
                          <input
                            type="text"
                            value={activityName}
                            onChange={(e) => setActivityName(e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 w-full"
                            required
                          />
                          {/* Parent group select dropdown */}
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Parent Category</span>
                            <select
                              value={parentId || ''}
                              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-hidden focus:border-teal-500 w-full"
                            >
                              <option value="">No Parent (Top Level)</option>
                              {(parentGroups || [])
                                .filter(g => Number(g.id) !== Number(act.id))
                                .map(grp => (
                                  <option key={grp.id} value={grp.id}>{grp.activity_name}</option>
                                ))}
                            </select>
                          </div>
                          {/* Critical Path Lock Selector */}
                          {!isGroup && (
                            <div className="flex flex-col gap-1 mt-1">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Critical Path (Lock Dates)</span>
                              <div className="flex items-center gap-4 bg-slate-50 p-1.5 border border-slate-200 rounded-lg">
                                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`critical-${act.id}`}
                                    checked={isCritical}
                                    onChange={() => setIsCritical(true)}
                                    className="text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <span>Yes</span>
                                </label>
                                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                                  <input
                                    type="radio"
                                    name={`critical-${act.id}`}
                                    checked={!isCritical}
                                    onChange={() => setIsCritical(false)}
                                    className="text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <span>No</span>
                                </label>
                              </div>
                            </div>
                          )}
                          {/* Inline Color selector */}
                          <div className="flex flex-col gap-1 mt-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Color</span>
                            <div className="bg-slate-50 p-1.5 border border-slate-200 rounded-lg">
                              <div className="grid grid-cols-8 gap-1.5">
                                {PALETTE_COLORS.map(c => (
                                  <button
                                    key={c.hex}
                                    type="button"
                                    onClick={() => setColor(c.hex)}
                                    style={{ backgroundColor: c.hex }}
                                    className={`w-4 h-4 rounded-full transition-all flex items-center justify-center hover:scale-110 cursor-pointer mx-auto ${
                                      color === c.hex
                                        ? 'ring-2 ring-teal-500/20 scale-105 border border-white'
                                        : 'border border-slate-300'
                                    }`}
                                    title={c.name}
                                  >
                                    {color === c.hex && (
                                      <span className="w-1 h-1 bg-white rounded-full" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {act.is_group && (
                            <button
                              type="button"
                              onClick={() => onToggleGroupCollapse(act.id)}
                              className="p-0.5 hover:bg-slate-250 rounded text-slate-400 hover:text-slate-650 transition-colors mr-0.5 cursor-pointer flex-shrink-0"
                            >
                              {isCollapsed ? (
                                <ChevronRight className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          {isOverallView && act.project_name && (
                            <span className="flex-shrink-0 text-teal-600 font-extrabold bg-teal-50 border border-teal-200/60 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                              {act.project_name}
                            </span>
                          )}
                          <span 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-slate-200/40 shadow-2xs" 
                            style={{ backgroundColor: act.color || '#0D9488' }}
                          />
                          {!act.is_group && (
                            <span className="flex-shrink-0 mr-0.5" title={act.is_critical ? "Locked (Critical Path)" : "Unlocked"}>
                              {act.is_critical ? (
                                <LockIcon className="w-3.5 h-3.5" />
                              ) : (
                                <UnlockIcon className="w-3.5 h-3.5" />
                              )}
                            </span>
                          )}
                          <span className={act.is_group ? "font-extrabold text-slate-800 truncate" : "truncate"}>
                            {act.activity_name}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Planned Schedule Range (Editable) */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        isGroup ? (
                          <span className="text-xs text-slate-400 italic font-medium">Auto-calculated</span>
                        ) : (
                          <div className="flex flex-col gap-1.5 max-w-[150px]">
                            <input
                              type="date"
                              value={planStart}
                              onChange={(e) => setPlanStart(e.target.value)}
                              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] text-slate-700 focus:outline-hidden focus:border-teal-500 w-full disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                              required
                              disabled={isCritical}
                            />
                            <input
                              type="date"
                              value={planEnd}
                              onChange={(e) => setPlanEnd(e.target.value)}
                              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] text-slate-700 focus:outline-hidden focus:border-teal-500 w-full disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                              required
                              disabled={isCritical}
                            />
                          </div>
                        )
                      ) : (
                        act.plan_start && act.plan_end ? (
                          <div className="flex flex-col gap-0.5 text-xs">
                            <span className="font-medium text-slate-600">
                              {formatDate(act.plan_start)}
                            </span>
                            <span className="text-slate-400">
                              to {formatDate(act.plan_end)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )
                      )}
                    </td>

                    {/* Actual Start Date (Editable) */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        isGroup ? (
                          <span className="text-xs text-slate-400 italic font-medium">Auto-calculated</span>
                        ) : (
                          <input
                            type="date"
                            value={actualStart}
                            onChange={(e) => setActualStart(e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 w-full max-w-[150px]"
                          />
                        )
                      ) : (
                        <span className="font-medium text-slate-700">
                          {formatDate(act.actual_start)}
                        </span>
                      )}
                    </td>

                    {/* Actual End Date (Editable) */}
                    <td className="px-6 py-4">
                      {isEditing ? (
                        isGroup ? (
                          <span className="text-xs text-slate-400 italic font-medium">Auto-calculated</span>
                        ) : (
                          <input
                            type="date"
                            value={actualEnd}
                            onChange={(e) => setActualEnd(e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 w-full max-w-[150px]"
                            disabled={!actualStart} // disable end date input if start is empty
                            placeholder={!actualStart ? 'Set start first' : ''}
                          />
                        )
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
