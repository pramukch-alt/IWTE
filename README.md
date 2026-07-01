# Waste-to-Energy (WtE) Power Plant Progress Report Web Application

An executive-grade, high-fidelity project management and progress reporting web application tailored for 7 Waste-to-Energy (WtE) power plant facilities (**TSE, GSE, TPP, MKP, PWW1, PWW2, and SRF**). 

The application is built using **React, Vite, and Tailwind CSS**, featuring a **Dual-Mode Database Service** designed for production-ready **Supabase / PostgreSQL** integration with a seamless **localStorage fallback** that runs instantly out-of-the-box in the browser.

---

## 🚀 Core Features

### 1. Custom Interactive Gantt Chart
- **Dual-Bar Schedule Visualization:**
  - *Planned Schedule (Top Bar):* Soft slate-blue/gray bar representing the plan timeline.
  - *Actual Progress (Bottom Bar):* Emerald-green/teal bar when completed on schedule, and solid pastel red when delayed or overdue. Active on-site tasks display a pulsing, dashed-border execution bar.
- **Automatic Delay Tracking:** Computes delay days ($Actual\_End - Plan\_End$) dynamically and overlays warning badges (e.g. `+12 Days Delay`) at the end of the actual bar.
- **Scroll & Zoom:** Features **Monthly** and **Weekly** zoom levels with automatic scrolling to the current date (June 26, 2026).
- **Interactive Tooltips:** Displays exact start/end dates, durations, and statuses on hover.

### 2. Overall IWTE Integrated View (Master Dashboard)
- **Unified Timeline:** Allows selecting and overlaying activities from different plant sites on a single master timeline to compare schedules and progress side-by-side.
- **Integrated Selector Panel:** A vertical side pane grouped by project site featuring:
  - **Tri-State Checkboxes:** Indeterminate state support (visual dash indicator if only some sub-activities are checked) and clicking project headers toggles all sub-activities.
  - **Count Badges:** Displays real-time selection counts (e.g., `3/12` activities compared).
  - **Bulk Toggles:** Quick "All" and "None" helpers.
- **Cross-Project Gap Analyzer:** Select any two activities in the Gantt Chart (even across different projects) to calculate the planned schedule buffer and actual execution gap.
- **Aggregated Portfolio KPIs:** Dynamic KPI cards displaying overall progress, schedule adherence, active delays, and active workload across the selected portfolio.

### 3. Comprehensive Data Management Table
- **Full Inline Editing:** Direct inputs inside the table cells allow modifying the **Activity Name**, **Planned Start/End Dates**, and **Actual Start/End Dates** inline, providing a rapid data-entry workflow.
- **Duplication to Multiple Projects:** Click the duplicate icon to open a modal, allowing you to clone an activity's planned schedule to one or more other projects simultaneously. Actual dates are reset to null in duplicates for independent tracking.
- **Inline Deletion:** Quick delete button with confirmation dialog.
- **Date Validations:** Strict validations (e.g., planned end must be after start, actual start is required if actual end is provided).

---

## 🛠️ Tech Stack & Architecture

- **Frontend Core:** React 18, Vite (Fast Bundling), Tailwind CSS (Professional Styling), Lucide React (Executive Iconography).
- **Database Backend:** PostgreSQL / Supabase.
- **Dual-Mode Database Service (`src/services/dbService.js`):**
  - *Supabase Mode:* Active if `.env` variables are present; performs relational joins and direct API transactions.
  - *LocalStorage Sandbox:* Fallback mode if credentials are absent. Automatically seeds the database structure and projects (**TSE, GSE, TPP, MKP, PWW1, PWW2, SRF**) and persists all user additions, inline edits, duplications, and deletions inside the browser's local storage.
  - *Resiliency:* Built-in safe-storage try-catch blocks and self-healing JSON parsers prevent crashes in private-browsing modes or under corrupt local cache states.

---

## 📂 Repository File Structure

```text
├── dist/                  # Production build output (ignored by Git)
├── node_modules/          # Project dependencies (ignored by Git)
├── src/
│   ├── components/
│   │   ├── GanttChart.jsx     # Timeline headers, dual-bars, and click handlers
│   │   ├── ActivityTable.jsx  # Grid table with full inline editing and badges
│   │   ├── ActivityForm.jsx   # Modal dialog for adding new activities
│   │   └── DuplicateModal.jsx # Modal dialog for cloning activities to other projects
│   ├── services/
│   │   ├── dbService.js       # Dual-mode client (Supabase + localStorage fallback)
│   │   ├── mockData.js        # Initial projects (1 to 7) and empty slate seeds
│   │   └── supabaseClient.js  # Supabase JS client initializer
│   ├── App.jsx            # Dashboard shell, KPI metrics, and integrated selector
│   ├── index.css          # Tailwind imports and custom scrollbar classes
│   └── main.jsx           # React bootstrapper
├── .gitignore             # Excludes node_modules, build assets, and secrets
├── index.html             # HTML entry point linking Google Fonts (Inter)
├── package.json           # React, Tailwind, Lucide, and Supabase dependencies
├── postcss.config.js      # PostCSS bundler configuration
├── tailwind.config.js     # Custom color palettes and typography scanning
├── vite.config.js         # Vite dev server and port configurations
└── schema.sql             # PostgreSQL DDL schema and project seed data
```

---

## ⚙️ Quick Start Installation

### 1. Clone & Install
```bash
# 1. Initialize your git repository (or clone this repository once pushed)
git init

# 2. Install package dependencies
npm install
```

### 2. Run Locally in Sandboxed Mode
```bash
# Start the local development server on http://localhost:3000
npm run dev
```
Open your browser to `http://localhost:3000`. The application runs entirely in sandboxed mode, pre-seeded with the 7 projects, persisting your edits immediately.

### 3. Connect to a Live Supabase Database
1. **Initialize Database:**
   - Log in to your [Supabase Dashboard](https://supabase.com/).
   - Open the **SQL Editor** in your project.
   - Copy the contents of [schema.sql](./schema.sql) and run it. This creates the tables, indexes, and seeds the 7 projects.
2. **Setup Environment Variables:**
   - Create a `.env` file in the root directory.
   - Add your credentials:
     ```env
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```
3. **Restart Server:**
   - Run `npm run dev` again. The app will automatically connect to your live Supabase database.

---

## 🛠️ Production Build & Verification

To compile the application for production deployment:
```bash
npm run build
```
This generates a minified, production-ready bundle in the `dist/` directory:
- `dist/index.html` (1.00 kB)
- `dist/assets/index.css` (25.73 kB) - Minified Tailwind utilities.
- `dist/assets/index.js` (200.71 kB) - Minified React, Lucide, and Supabase bundle.
