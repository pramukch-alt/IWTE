import { supabase } from './supabaseClient'
import { initialProjects, initialActivities } from './mockData'

// Constants for local storage keys
const PROJECTS_KEY = 'wte_projects_v5'
const ACTIVITIES_KEY = 'wte_activities_v5'

// In-memory session fallback in case localStorage is blocked/unavailable (e.g. security settings, iframe sandbox)
const memoryStore = {
  [PROJECTS_KEY]: JSON.stringify(initialProjects),
  [ACTIVITIES_KEY]: JSON.stringify(initialActivities)
}

// Safe Storage helper
const safeStorage = {
  getItem(key) {
    try {
      const val = localStorage.getItem(key)
      // If key exists but is corrupt (e.g. "undefined" or invalid JSON), we handle it
      if (val) {
        try {
          JSON.parse(val)
          return val
        } catch (e) {
          console.warn(`Corrupt localStorage key "${key}" detected, resetting.`, e)
          this.removeItem(key)
        }
      }
      return val
    } catch (e) {
      console.warn('localStorage is blocked or unavailable. Using in-memory fallback.', e)
      return memoryStore[key] || null
    }
  },

  setItem(key, value) {
    try {
      localStorage.setItem(key, value)
    } catch (e) {
      console.warn('localStorage.setItem failed. Using in-memory fallback.', e)
      memoryStore[key] = value
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      delete memoryStore[key]
    }
  }
}

// Initialize safe database
const initSafeDB = () => {
  if (!safeStorage.getItem(PROJECTS_KEY)) {
    safeStorage.setItem(PROJECTS_KEY, JSON.stringify(initialProjects))
  }
  if (!safeStorage.getItem(ACTIVITIES_KEY)) {
    safeStorage.setItem(ACTIVITIES_KEY, JSON.stringify(initialActivities))
  }
}

// Run initialization
initSafeDB()

export const dbService = {
  // Check if we are using the live Supabase database or local storage
  isSupabaseActive: () => {
    return supabase !== null
  },

  // 1. Fetch all projects
  async getProjects() {
    if (supabase) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('id')
      if (error) throw error
      return data
    } else {
      try {
        const projects = safeStorage.getItem(PROJECTS_KEY)
        return JSON.parse(projects || '[]')
      } catch (e) {
        console.error('Error parsing projects, returning initial data.', e)
        return initialProjects
      }
    }
  },

  // 2. Fetch activities for a specific project
  async getActivities(projectId) {
    const pid = Number(projectId)
    if (supabase) {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('project_id', pid)
        .order('sort_order', { ascending: true })
        .order('plan_start', { ascending: true })
      if (error) throw error
      return data
    } else {
      try {
        const activities = JSON.parse(safeStorage.getItem(ACTIVITIES_KEY) || '[]')
        return activities
          .filter(act => Number(act.project_id) === pid)
          // Sort by sort_order ascending, fallback to plan_start chronologically if equal
          .sort((a, b) => {
            const orderA = a.sort_order || 0
            const orderB = b.sort_order || 0
            if (orderA !== orderB) return orderA - orderB
            return new Date(a.plan_start) - new Date(b.plan_start)
          })
      } catch (e) {
        console.error('Error parsing activities, returning empty array.', e)
        return []
      }
    }
  },

  // 3. Insert a new activity
  async addActivity(projectId, activityName, planStart, planEnd, isGroup = false, parentId = null, color = '#0D9488') {
    const pid = Number(projectId)
    if (supabase) {
      // Find current maximum sort_order for this project
      const { data: currentActs, error: fetchErr } = await supabase
        .from('activities')
        .select('sort_order')
        .eq('project_id', pid)
      
      const maxSort = currentActs && currentActs.length > 0
        ? Math.max(...currentActs.map(a => a.sort_order || 0))
        : 0

      const { data, error } = await supabase
        .from('activities')
        .insert([
          {
            project_id: pid,
            activity_name: activityName,
            plan_start: planStart || null,
            plan_end: planEnd || null,
            actual_start: null,
            actual_end: null,
            is_group: isGroup,
            parent_id: parentId ? Number(parentId) : null,
            sort_order: maxSort + 1,
            color: color
          }
        ])
        .select()
      if (error) throw error
      return data[0]
    } else {
      try {
        const activities = JSON.parse(safeStorage.getItem(ACTIVITIES_KEY) || '[]')
        const projActs = activities.filter(a => Number(a.project_id) === pid)
        const maxSort = projActs.length > 0
          ? Math.max(...projActs.map(a => a.sort_order || 0))
          : 0

        // Generate a simple numeric ID
        const newId = activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1
        const newActivity = {
          id: newId,
          project_id: pid,
          activity_name: activityName,
          plan_start: planStart || null,
          plan_end: planEnd || null,
          actual_start: null,
          actual_end: null,
          is_group: isGroup,
          parent_id: parentId ? Number(parentId) : null,
          sort_order: maxSort + 1,
          color: color,
          created_at: new Date().toISOString()
        }
        activities.push(newActivity)
        safeStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities))
        return newActivity
      } catch (e) {
        console.error('Error adding activity to storage:', e)
        throw e
      }
    }
  },

  // 4. Update an activity's details (both plan and actual dates/names)
  async updateActivity(activityId, name, planStart, planEnd, actualStart, actualEnd, isGroup = false, parentId = null, color = '#0D9488') {
    const aid = Number(activityId)
    // Normalize empty strings or empty values to null
    const normActualStart = actualStart && actualStart !== '' ? actualStart : null
    const normActualEnd = actualEnd && actualEnd !== '' ? actualEnd : null

    if (supabase) {
      const { data, error } = await supabase
        .from('activities')
        .update({
          activity_name: name,
          plan_start: planStart || null,
          plan_end: planEnd || null,
          actual_start: normActualStart,
          actual_end: normActualEnd,
          is_group: isGroup,
          parent_id: parentId ? Number(parentId) : null,
          color: color
        })
        .eq('id', aid)
        .select()
      if (error) throw error
      return data[0]
    } else {
      try {
        const activities = JSON.parse(safeStorage.getItem(ACTIVITIES_KEY) || '[]')
        const index = activities.findIndex(a => Number(a.id) === aid)
        if (index === -1) throw new Error('Activity not found')
        
        const updatedActivity = {
          ...activities[index],
          activity_name: name,
          plan_start: planStart || null,
          plan_end: planEnd || null,
          actual_start: normActualStart,
          actual_end: normActualEnd,
          is_group: isGroup,
          parent_id: parentId ? Number(parentId) : null,
          color: color
        }
        activities[index] = updatedActivity
        safeStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities))
        return updatedActivity
      } catch (e) {
        console.error('Error updating activity in storage:', e)
        throw e
      }
    }
  },

  // 5. Duplicate an activity to other projects
  async duplicateActivity(activityId, targetProjectIds) {
    const aid = Number(activityId)
    const targetPids = targetProjectIds.map(Number)

    if (supabase) {
      // Fetch source activity details
      const { data: source, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('id', aid)
        .single()
      if (fetchError) throw fetchError

      // Prepare duplicates
      const newRows = targetPids.map(pid => ({
        project_id: pid,
        activity_name: source.activity_name,
        plan_start: source.plan_start,
        plan_end: source.plan_end,
        actual_start: null,
        actual_end: null,
        is_group: source.is_group || false,
        parent_id: null,
        color: source.color || '#0D9488'
      }))

      const { error: insertError } = await supabase
        .from('activities')
        .insert(newRows)
      if (insertError) throw insertError
      return true
    } else {
      try {
        const activities = JSON.parse(safeStorage.getItem(ACTIVITIES_KEY) || '[]')
        const source = activities.find(a => Number(a.id) === aid)
        if (!source) throw new Error('Source activity not found')

        let nextId = activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1
        
        targetPids.forEach(pid => {
          activities.push({
            id: nextId++,
            project_id: pid,
            activity_name: source.activity_name,
            plan_start: source.plan_start,
            plan_end: source.plan_end,
            actual_start: null,
            actual_end: null,
            is_group: source.is_group || false,
            parent_id: null,
            color: source.color || '#0D9488',
            created_at: new Date().toISOString()
          })
        })

        safeStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities))
        return true
      } catch (e) {
        console.error('Error duplicating activity in storage:', e)
        throw e
      }
    }
  },

  // 5. Delete an activity by ID
  async deleteActivity(activityId) {
    const aid = Number(activityId)
    if (supabase) {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', aid)
      if (error) throw error
      return true
    } else {
      try {
        const activities = JSON.parse(safeStorage.getItem(ACTIVITIES_KEY) || '[]')
        const filtered = activities.filter(a => Number(a.id) !== aid)
        safeStorage.setItem(ACTIVITIES_KEY, JSON.stringify(filtered))
        return true
      } catch (e) {
        console.error('Error deleting activity from storage:', e)
        throw e
      }
    }
  },

  // 6. Fetch all activities across all projects (with relational join on project names)
  async getAllActivities() {
    if (supabase) {
      const { data, error } = await supabase
        .from('activities')
        .select('*, projects(name)')
        .order('plan_start', { ascending: true })
      if (error) throw error
      return data.map(act => ({
        ...act,
        project_name: act.projects?.name || ''
      }))
    } else {
      try {
        const activities = JSON.parse(safeStorage.getItem(ACTIVITIES_KEY) || '[]')
        const projects = JSON.parse(safeStorage.getItem(PROJECTS_KEY) || '[]')
        return activities.map(act => {
          const proj = projects.find(p => Number(p.id) === Number(act.project_id))
          return {
            ...act,
            project_name: proj ? proj.name : ''
          }
        }).sort((a, b) => new Date(a.plan_start) - new Date(b.plan_start))
      } catch (e) {
        console.error('Error parsing activities:', e)
        return []
      }
    }
  },

  // 7. Update sort order for activities
  async updateActivitiesOrder(activitiesList) {
    if (supabase) {
      for (let i = 0; i < activitiesList.length; i++) {
        const act = activitiesList[i]
        const { error } = await supabase
          .from('activities')
          .update({ sort_order: i })
          .eq('id', Number(act.id))
        if (error) throw error
      }
      return true
    } else {
      try {
        const activities = JSON.parse(safeStorage.getItem(ACTIVITIES_KEY) || '[]')
        const orderMap = {}
        activitiesList.forEach((act, idx) => {
          orderMap[Number(act.id)] = idx
        })

        const updated = activities.map(act => {
          const aid = Number(act.id)
          if (aid in orderMap) {
            return {
              ...act,
              sort_order: orderMap[aid]
            }
          }
          return act
        })

        safeStorage.setItem(ACTIVITIES_KEY, JSON.stringify(updated))
        return true
      } catch (e) {
        console.error('Error updating activities order:', e)
        throw e
      }
    }
  }
}
