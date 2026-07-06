import React, { useRef, useEffect, useState } from 'react';
import { Calendar, ZoomIn, ZoomOut, AlertTriangle, CheckCircle, Clock, ChevronUp, ChevronDown, ChevronRight, ArrowDownAZ } from 'lucide-react';

// Hardcoded current date based on system metadata: 2026-06-26
const CURRENT_DATE = new Date(2026, 5, 26);

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

export default function GanttChart({
  activities,
  selectedActivities,
  onSelectActivity,
  zoom,
  setZoom,
  onMoveActivity,
  onSortByPlannedStart,
  isOverallView,
  collapsedGroups,
  onToggleGroupCollapse,
  customStart = null,
  customEnd = null
}) {
  const [viewDate, setViewDate] = useState('2026-06-26');
  const timelineRef = useRef(null);
  const hasActivities = activities && activities.length > 0;

  // Helper: Parse YYYY-MM-DD date string as local date (avoiding UTC offset shifts)
  const parseLocalDate = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) {
      return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
    }
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      return new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10)
      );
    }
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  };

  // Helper: Format date for display on Gantt timeline
  const formatPlanDate = (dateStr) => {
    if (!dateStr) return '';
    const d = parseLocalDate(dateStr);
    if (!d) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  };

  // 1. Calculate timeline range safely
  let timelineStart, timelineEnd;

  if (customStart && customEnd) {
    const startParts = customStart.split('-');
    const startYear = parseInt(startParts[0], 10);
    const startMonth = parseInt(startParts[1], 10) - 1;
    timelineStart = new Date(startYear, startMonth, 1);

    const endParts = customEnd.split('-');
    const endYear = parseInt(endParts[0], 10);
    const endMonth = parseInt(endParts[1], 10) - 1;
    timelineEnd = new Date(endYear, endMonth + 1, 0);
  } else {
    const dates = hasActivities ? activities.flatMap(act => {
      const list = [];
      if (act.plan_start) { const d = parseLocalDate(act.plan_start); if (d) list.push(d); }
      if (act.plan_end) { const d = parseLocalDate(act.plan_end); if (d) list.push(d); }
      if (act.actual_start) { const d = parseLocalDate(act.actual_start); if (d) list.push(d); }
      if (act.actual_end) { const d = parseLocalDate(act.actual_end); if (d) list.push(d); }
      return list;
    }) : [];

    const validDates = dates.filter(d => !isNaN(d.getTime()));
    const minDateVal = validDates.length > 0 ? new Date(Math.min(...validDates)) : new Date();
    const maxDateVal = validDates.length > 0 ? new Date(Math.max(...validDates)) : new Date();

    // Round timeline boundaries to start of the first month and end of the last month
    timelineStart = new Date(minDateVal.getFullYear(), minDateVal.getMonth(), 1);
    timelineEnd = new Date(maxDateVal.getFullYear(), maxDateVal.getMonth() + 1, 0);

    // Buffer: Ensure timeline has at least 3 months, and extends to cover CURRENT_DATE
    if (timelineStart > CURRENT_DATE) {
      timelineStart.setFullYear(CURRENT_DATE.getFullYear());
      timelineStart.setMonth(CURRENT_DATE.getMonth() - 1);
    } else {
      // Ensure at least 1 month buffer before CURRENT_DATE
      const minStartLimit = new Date(CURRENT_DATE.getFullYear(), CURRENT_DATE.getMonth() - 1, 1);
      if (timelineStart > minStartLimit) {
        timelineStart.setMonth(minStartLimit.getMonth());
        timelineStart.setFullYear(minStartLimit.getFullYear());
      }
    }

    if (timelineEnd < CURRENT_DATE) {
      timelineEnd.setFullYear(CURRENT_DATE.getFullYear());
      timelineEnd.setMonth(CURRENT_DATE.getMonth() + 2);
    } else {
      // Ensure at least 2 months buffer after CURRENT_DATE
      const minEndLimit = new Date(CURRENT_DATE.getFullYear(), CURRENT_DATE.getMonth() + 2, 0);
      if (timelineEnd < minEndLimit) {
        timelineEnd.setMonth(minEndLimit.getMonth());
        timelineEnd.setFullYear(minEndLimit.getFullYear());
      }
    }
  }

  const totalTimeMs = timelineEnd.getTime() - timelineStart.getTime();

  // Helper: Get position percentage for a given date
  const getPositionPercent = (dateInput) => {
    if (!dateInput) return 0;
    const date = parseLocalDate(dateInput);
    if (!date) return 0;
    const offsetMs = date.getTime() - timelineStart.getTime();
    return Math.min(Math.max((offsetMs / totalTimeMs) * 100, 0), 100);
  };

  // Helper: Get width percentage for a date range
  const getWidthPercent = (startDateInput, endDateInput) => {
    if (!startDateInput || !endDateInput) return 0;
    const start = parseLocalDate(startDateInput);
    const end = parseLocalDate(endDateInput);
    if (!start || !end) return 0;
    const durationMs = end.getTime() - start.getTime() + 86400000; // include end day
    return Math.min(Math.max((durationMs / totalTimeMs) * 100, 0.5), 100);
  };

  // 2. Generate timeline headers based on zoom level
  const timelineHeaders = [];
  const currentDatePointer = new Date(timelineStart);

  if (zoom === 'month') {
    while (currentDatePointer <= timelineEnd) {
      timelineHeaders.push({
        label: currentDatePointer.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        key: `m-${currentDatePointer.getFullYear()}-${currentDatePointer.getMonth()}`,
        widthPercent: (30.4 * 24 * 60 * 60 * 1000 / totalTimeMs) * 100
      });
      currentDatePointer.setMonth(currentDatePointer.getMonth() + 1);
    }
  } else {
    // Zoom is 'week'
    // Stagger week headers (every week start)
    while (currentDatePointer <= timelineEnd) {
      timelineHeaders.push({
        label: currentDatePointer.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        key: `w-${currentDatePointer.getFullYear()}-${currentDatePointer.getMonth()}-${currentDatePointer.getDate()}`,
        widthPercent: (7 * 24 * 60 * 60 * 1000 / totalTimeMs) * 100
      });
      currentDatePointer.setDate(currentDatePointer.getDate() + 7);
    }
  }

  // Width of the scrollable timeline container based on columns count
  const columnWidth = zoom === 'month' ? 140 : 80;
  const timelineWidth = timelineHeaders.length * columnWidth;

  // Scroll to viewDate area on mount or viewDate change
  useEffect(() => {
    if (timelineRef.current && hasActivities) {
      const todayOffsetPercent = getPositionPercent(viewDate) / 100;
      const scrollPosition = (timelineWidth * todayOffsetPercent) - 200; // center it slightly
      timelineRef.current.scrollLeft = Math.max(scrollPosition, 0);
    }
  }, [zoom, timelineWidth, hasActivities, viewDate]);

  // If there are no activities, show an empty state safely here
  if (!hasActivities) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-2xl shadow-sm text-center h-full">
        <Calendar className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-700">No Activities Found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          There are no activities registered for this project yet. Use the "Add Activity" button to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full w-full">
      
      {/* Chart Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-200/50 px-2.5 py-1 rounded-full">
            Gantt Chart
          </span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100/50">
            <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse-subtle print:hidden"></span>
            <span>View Date:</span>
            <input
              type="date"
              value={viewDate}
              onChange={(e) => {
                if (e.target.value) setViewDate(e.target.value);
              }}
              className="bg-transparent border-0 focus:ring-0 p-0 text-teal-750 font-bold w-[105px] cursor-pointer focus:outline-hidden text-xs print:hidden"
            />
            <span className="hidden print:inline font-bold text-slate-700">
              {new Date(viewDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Zoom Controls & Legend */}
        <div className="flex items-center flex-wrap gap-6">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-slate-300 rounded-sm"></span>
              <span>Plan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-emerald-500 rounded-sm"></span>
              <span>Actual (On Track)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-rose-500 rounded-sm"></span>
              <span>Actual (Delayed)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 border-b-2 border-dashed border-teal-500"></span>
              <span>In Progress</span>
            </div>
          </div>

          {/* Sort Button (Hidden in overall integrated view) */}
          {!isOverallView && onSortByPlannedStart && (
            <button
              onClick={onSortByPlannedStart}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer print:hidden"
              title="Sort activities chronologically by planned start date"
            >
              <ArrowDownAZ className="w-3.5 h-3.5 text-slate-400" />
              Sort by Plan Start
            </button>
          )}

          {/* Toggle buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 print:hidden">
            <button
              onClick={() => setZoom('month')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                zoom === 'month'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ZoomOut className="w-3.5 h-3.5" />
              Monthly
            </button>
            <button
              onClick={() => setZoom('week')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                zoom === 'week'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ZoomIn className="w-3.5 h-3.5" />
              Weekly
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Chart Body */}
      <div className="overflow-x-auto flex-1 flex flex-col custom-scrollbar" ref={timelineRef}>
        
        {/* Timeline Grid Table */}
        <div style={{ width: `${timelineWidth + 280}px` }} className="flex-1 flex flex-col select-none">
          
          {/* Header Row */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 h-12 items-stretch z-10 sticky top-0">
            {/* Sticky Sidebar Header Column */}
            <div className="w-[280px] min-w-[280px] bg-slate-50 border-r border-slate-200 sticky left-0 flex items-center px-6 z-20 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.12)] print:relative print:shadow-none print:border-r print:border-slate-200">
              Activity Description
            </div>
            {/* Timeline columns */}
            <div className="flex-1 flex relative">
              {timelineHeaders.map((hdr, idx) => (
                <div
                  key={hdr.key}
                  style={{ width: `${columnWidth}px` }}
                  className={`flex-none border-r border-slate-200/50 flex items-center justify-center text-center px-1 font-medium ${
                    idx % 2 === 0 ? 'bg-slate-50/20' : 'bg-slate-50/50'
                  }`}
                >
                  {hdr.label}
                </div>
              ))}
            </div>
          </div>

          {/* Activity Rows */}
          <div className="flex-1 divide-y divide-slate-100 bg-white relative">
            
            {/* Today vertical line overlay */}
            <div
              style={{
                left: `${280 + (timelineWidth * (getPositionPercent(viewDate) / 100))}px`
              }}
              className="absolute top-0 bottom-0 w-[2px] bg-teal-500/40 z-1 pointer-events-none"
            >
              <div className="absolute -top-1.5 -left-[5px] w-3 h-3 rounded-full bg-teal-500 shadow-sm border border-white"></div>
            </div>

            {/* Render rows */}
            {activities.map((act, idx) => {
              const planStartPercent = getPositionPercent(act.plan_start);
              const planWidthPercent = getWidthPercent(act.plan_start, act.plan_end);

              const hasActualStart = act.actual_start && act.actual_start !== '';
              const hasActualEnd = act.actual_end && act.actual_end !== '';

              let actualStartPercent = 0;
              let actualWidthPercent = 0;
              let isDelayed = false;
              let delayDays = 0;
              let isCompleted = false;
              let isInProgress = false;

              if (hasActualStart) {
                actualStartPercent = getPositionPercent(act.actual_start);
                
                if (hasActualEnd) {
                  // Completed
                  isCompleted = true;
                  actualWidthPercent = getWidthPercent(act.actual_start, act.actual_end);
                  const planEnd = parseLocalDate(act.plan_end);
                  const actualEnd = parseLocalDate(act.actual_end);
                  delayDays = (planEnd && actualEnd) ? Math.round((actualEnd - planEnd) / (1000 * 60 * 60 * 24)) : 0;
                  isDelayed = delayDays > 0;
                } else {
                  // In Progress: Draw bar up to today's date (or plan_end, whichever is larger, but mark as in progress)
                  isInProgress = true;
                  const planEnd = parseLocalDate(act.plan_end);
                  const endDateToUse = (planEnd && CURRENT_DATE > planEnd) ? CURRENT_DATE : planEnd;
                  actualWidthPercent = getWidthPercent(act.actual_start, endDateToUse);
                  
                  // Overdue calculation
                  if (planEnd && CURRENT_DATE > planEnd) {
                    delayDays = Math.round((CURRENT_DATE - planEnd) / (1000 * 60 * 60 * 24));
                    isDelayed = delayDays > 0;
                  }
                }
              }

              const isSelected = selectedActivities.some(a => Number(a.id) === Number(act.id));
              const selectionIndex = selectedActivities.findIndex(a => Number(a.id) === Number(act.id)) + 1;

              return (
                <div
                  key={act.id}
                  onClick={() => onSelectActivity(act)}
                  className={`flex group items-stretch min-h-[58px] transition-colors duration-150 cursor-pointer print:break-inside-avoid print:bg-white ${
                    isSelected 
                      ? 'bg-brand-50/80 hover:bg-brand-100/60' 
                      : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div
                    className={`w-[280px] min-w-[280px] border-r border-slate-200/80 sticky left-0 py-2 flex flex-col justify-center gap-0.5 z-10 transition-colors shadow-[4px_0_10px_-4px_rgba(0,0,0,0.12)] print:relative print:shadow-none print:border-r print:border-slate-200/50 ${
                      isSelected 
                        ? 'bg-brand-50 border-r-2 border-r-brand-500' 
                        : 'bg-white group-hover:bg-slate-50/80'
                    }`}
                    style={{ paddingLeft: `${24 + (act.depth || 0) * 16}px`, paddingRight: '24px' }}
                  >
                    <div className="flex items-start justify-between w-full gap-2">
                      <div className="flex items-start gap-2 whitespace-normal break-words w-full">
                        {/* Expand/Collapse Chevron for Group Tasks */}
                        {act.is_group && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleGroupCollapse(act.id);
                            }}
                            className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors mr-0.5 cursor-pointer flex-shrink-0 mt-0.5"
                            title={collapsedGroups?.includes(act.id) ? "Expand Group" : "Collapse Group"}
                          >
                            {collapsedGroups?.includes(act.id) ? (
                              <ChevronRight className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}

                        {/* Selection order indicator */}
                        {isSelected && (
                          <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold mt-0.5">
                            {selectionIndex}
                          </span>
                        )}
                        <span className={`text-xs leading-tight whitespace-normal break-words ${act.is_group ? 'font-extrabold text-slate-800' : 'font-semibold text-slate-600'} ${isSelected ? 'text-slate-900' : ''} flex items-start gap-1.5 w-full`}>
                          {act.project_name && (
                            <span className="flex-shrink-0 text-teal-600 font-extrabold bg-teal-50/80 border border-teal-200/60 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider mt-0.5">
                              {act.project_name}
                            </span>
                          )}
                          <span 
                            className="w-2 h-2 rounded-full flex-shrink-0 border border-slate-200/40 shadow-3xs mt-1"
                            style={{ backgroundColor: act.color || '#0D9488' }}
                          />
                          {!act.is_group && (
                            <span className="flex-shrink-0 mt-0.5" title={act.is_critical ? "Locked (Critical Path)" : "Unlocked"}>
                              {act.is_critical ? (
                                <LockIcon className="w-3.5 h-3.5" />
                              ) : (
                                <UnlockIcon className="w-3.5 h-3.5" />
                              )}
                            </span>
                          )}
                          <span className="whitespace-normal break-words flex-1">{act.activity_name}</span>
                        </span>
                      </div>

                      {/* Reordering Controls (Only in individual project view, hidden in overall integrated view) */}
                      {!act.project_name && onMoveActivity && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveActivity('up', idx);
                            }}
                            disabled={idx === 0}
                            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400 rounded transition-colors"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveActivity('down', idx);
                            }}
                            disabled={idx === activities.length - 1}
                            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-400 rounded transition-colors"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {(isDelayed || (isCompleted && !isDelayed)) && (
                      <div className="flex items-center gap-2.5 text-[10px] font-medium mt-1">
                        {isDelayed && (
                          <span className="flex items-center gap-0.5 text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-sm">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            +{delayDays}d
                          </span>
                        )}
                        {isCompleted && !isDelayed && (
                          <span className="flex items-center gap-0.5 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                            <CheckCircle className="w-2.5 h-2.5" />
                            Done
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Relative timeline canvas */}
                  <div className="flex-1 relative flex items-center min-h-full py-2 bg-slate-50/5">
                    
                    {/* Background grid vertical stripes */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {timelineHeaders.map((hdr) => (
                        <div
                          key={`bg-${hdr.key}`}
                          style={{ width: `${columnWidth}px` }}
                          className="flex-none border-r border-slate-100 h-full"
                        />
                      ))}
                    </div>

                    {/* Dual bar wrapper */}
                    <div className="w-full relative h-11">
                      
                      {/* Plan date text above the plan bar */}
                      {act.plan_start && act.plan_end && (
                        <div
                          style={{
                            left: `${planStartPercent}%`,
                          }}
                          className="absolute top-0 text-[9px] font-bold text-slate-450 whitespace-nowrap print:text-slate-500"
                        >
                          Plan: {formatPlanDate(act.plan_start)} - {formatPlanDate(act.plan_end)}
                        </div>
                      )}

                      {act.is_group ? (
                        <>
                          {/* SUMMARY BAR: Planned (Top Bar - Dark slate-gray bracket) */}
                          {act.plan_start && act.plan_end && (
                            <div
                              style={{
                                left: `${planStartPercent}%`,
                                width: `${planWidthPercent}%`
                              }}
                              className="absolute top-[14px] h-2 bg-slate-800 rounded-sm z-2"
                              title={`[Phase Plan] ${act.activity_name}\nStart: ${act.plan_start}\nEnd: ${act.plan_end}`}
                            >
                              {/* Left downward triangle/bracket */}
                              <div className="absolute left-0 top-0 w-1.5 h-3 bg-slate-800 rounded-bl-sm -translate-x-[1px]" />
                              {/* Right downward triangle/bracket */}
                              <div className="absolute right-0 top-0 w-1.5 h-3 bg-slate-800 rounded-br-sm translate-x-[1px]" />
                            </div>
                          )}

                          {/* SUMMARY BAR: Actual (Bottom Bar - Teal/Rose bracket) */}
                          {hasActualStart && (
                            <div
                              style={{
                                left: `${actualStartPercent}%`,
                                width: `${actualWidthPercent}%`
                              }}
                              className={`absolute bottom-0.5 h-2 rounded-sm z-2 ${isDelayed ? 'bg-rose-500' : 'bg-teal-600'}`}
                              title={`[Phase Actual] ${act.activity_name}\nStart: ${act.actual_start}\nEnd: ${act.actual_end || 'In Progress'}`}
                            >
                              {/* Left downward bracket */}
                              <div className={`absolute left-0 top-0 w-1.5 h-3 rounded-bl-sm -translate-x-[1px] ${isDelayed ? 'bg-rose-500' : 'bg-teal-600'}`} />
                              {/* Right downward bracket */}
                              <div className={`absolute right-0 top-0 w-1.5 h-3 rounded-br-sm translate-x-[1px] ${isDelayed ? 'bg-rose-500' : 'bg-teal-600'}`} />
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* PLAN BAR (Top Bar - Custom Color with Opacity) */}
                          {act.plan_start && act.plan_end && (
                            <div
                              style={{
                                left: `${planStartPercent}%`,
                                width: `${planWidthPercent}%`,
                                backgroundColor: `${act.color || '#cbd5e1'}cc`,
                                borderColor: act.color || '#cbd5e1'
                              }}
                              title={`[Plan] ${act.activity_name}\nStart: ${act.plan_start}\nEnd: ${act.plan_end}`}
                              className={`absolute top-[14px] h-3 rounded-md border group-hover:opacity-90 transition-all z-2 shadow-2xs`}
                            >
                              <div className="w-full h-full flex items-center px-2 overflow-hidden">
                                <span className={`text-[8px] font-bold truncate select-none opacity-0 group-hover:opacity-100 transition-opacity ${
                                  act.color === '#F6BB00' ? 'text-slate-800' : 'text-white'
                                }`}>
                                  Plan
                                </span>
                              </div>
                            </div>
                          )}

                          {/* ACTUAL BAR (Bottom Bar) */}
                          {hasActualStart && (
                            <div
                              style={{
                                left: `${actualStartPercent}%`,
                                width: `${actualWidthPercent}%`,
                                ...(isDelayed ? {} : {
                                  backgroundColor: act.color || '#0d9488',
                                  borderColor: act.color || '#0d9488'
                                })
                              }}
                              title={`[Actual] ${act.activity_name}\nStart: ${act.actual_start}\nEnd: ${act.actual_end || 'In Progress'}\nStatus: ${isInProgress ? 'In Progress' : 'Completed'}`}
                              className={`absolute bottom-0.5 h-3 rounded-md transition-all z-2 shadow-2xs border flex items-center justify-between px-1.5 overflow-hidden ${
                                isDelayed
                                  ? 'bg-rose-500/90 text-white border-rose-600/30 hover:bg-rose-500'
                                  : 'text-white hover:opacity-95'
                              } ${isInProgress ? 'border-dashed border-2 animate-pulse-subtle' : ''}`}
                            >
                              {/* Inner status and label */}
                              <div className="flex items-center gap-1 overflow-hidden">
                                <span className="text-[8px] font-extrabold uppercase tracking-wide truncate">
                                  {isInProgress ? 'Active' : 'Actual'}
                                </span>
                              </div>

                              {/* Delay badge floating at the end of the actual bar */}
                              {isDelayed && (
                                <span className="absolute -right-1 translate-x-full ml-2 bg-rose-100 text-rose-700 border border-rose-200 text-[8px] font-black px-1.5 py-0.2 rounded shadow-2xs whitespace-nowrap z-20">
                                  +{delayDays}d Delay
                                </span>
                              )}
                              {isCompleted && !isDelayed && (
                                <span className="text-[8px] font-extrabold uppercase tracking-wide text-white truncate">
                                  Done
                                </span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table Legend/Tips footer */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 bg-brand-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold">✓</span>
          <span>Click on any activity row to select it for the <strong>Activity Gap Calculator</strong>.</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 border border-dashed border-teal-500 rounded-xs bg-teal-50"></span>
            <span>Dashed bar = In progress</span>
          </span>
          <span>Double-click a row to deselect all.</span>
        </div>
      </div>

    </div>
  );
}
