-- Waste-to-Energy (WtE) Power Plant Progress Report Database Schema
-- Compatible with PostgreSQL and Supabase

-- Drop tables if they exist (for easy re-runs)
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS projects;

-- 1. Projects Table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Activities Table (Supports WBS Hierarchy)
CREATE TABLE activities (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    activity_name VARCHAR(255) NOT NULL,
    plan_start DATE, -- Nullable for summary groups
    plan_end DATE,   -- Nullable for summary groups
    actual_start DATE,
    actual_end DATE,
    is_group BOOLEAN DEFAULT FALSE,
    parent_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_plan_dates CHECK (plan_start IS NULL OR plan_end IS NULL OR plan_end >= plan_start),
    CONSTRAINT chk_actual_dates CHECK (actual_end IS NULL OR actual_start IS NULL OR actual_end >= actual_start)
);

-- Add indexes for optimized queries
CREATE INDEX idx_activities_project_id ON activities(project_id);
CREATE INDEX idx_activities_parent_id ON activities(parent_id);

-- 3. Seed Projects
INSERT INTO projects (id, name) VALUES 
(1, 'TSE'),
(2, 'GSE'),
(3, 'TPP'),
(4, 'MKP'),
(5, 'PWW1'),
(6, 'PWW2'),
(7, 'SRF')
ON CONFLICT (id) DO NOTHING;

-- Reset serial sequence after manual ID insertion
ALTER SEQUENCE projects_id_seq RESTART WITH 8;

-- 4. Seed Structured Activities (WBS Hierarchy: Phase > Sub-phase > Leaf Task)
-- We will seed a standard WBS structure for Project 1 (TSE), and similar groups for others.

-- =========================================================================
-- PROJECT 1: TSE (Saraburi Project 1)
-- =========================================================================

-- LEVEL 1: Phased Groups
INSERT INTO activities (project_id, activity_name, is_group, parent_id, sort_order) VALUES
(1, 'Engineering & Procurement Phase', TRUE, NULL, 10),
(1, 'Civil & Construction Phase', TRUE, NULL, 20),
(1, 'Commissioning & COD Phase', TRUE, NULL, 30);

-- LEVEL 2: Sub-Groups under Engineering & Procurement Phase
INSERT INTO activities (project_id, activity_name, is_group, parent_id, sort_order) VALUES
(1, 'Basic & Detailed Engineering', TRUE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Engineering & Procurement Phase' LIMIT 1), 11),
(1, 'Key Equipment Procurement', TRUE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Engineering & Procurement Phase' LIMIT 1), 12);

-- LEVEL 2: Sub-Groups under Civil & Construction Phase
INSERT INTO activities (project_id, activity_name, is_group, parent_id, sort_order) VALUES
(1, 'Civil Infrastructure Works', TRUE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Civil & Construction Phase' LIMIT 1), 21),
(1, 'Mechanical & Piping Installation', TRUE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Civil & Construction Phase' LIMIT 1), 22);

-- LEVEL 2: Sub-Groups under Commissioning & COD Phase (Cold & Hot Commissioning)
INSERT INTO activities (project_id, activity_name, is_group, parent_id, sort_order) VALUES
(1, 'Cold Commissioning Tests', TRUE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Commissioning & COD Phase' LIMIT 1), 31),
(1, 'Hot Commissioning & Handover', TRUE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Commissioning & COD Phase' LIMIT 1), 32);

-- LEVEL 3: Leaf Tasks under Engineering sub-group
INSERT INTO activities (project_id, activity_name, plan_start, plan_end, actual_start, actual_end, is_group, parent_id, sort_order) VALUES
(1, 'Project Kick-off & Basic Design', '2026-01-05', '2026-02-15', '2026-01-05', '2026-02-12', FALSE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Basic & Detailed Engineering' LIMIT 1), 101),
(1, 'Permitting and EIA Approvals', '2026-02-01', '2026-04-10', '2026-02-05', '2026-04-20', FALSE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Basic & Detailed Engineering' LIMIT 1), 102),
(1, 'Detailed Civil & Structural Engineering', '2026-02-16', '2026-05-15', '2026-02-16', '2026-05-15', FALSE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Basic & Detailed Engineering' LIMIT 1), 103);

-- LEVEL 3: Leaf Tasks under Procurement sub-group
INSERT INTO activities (project_id, activity_name, plan_start, plan_end, actual_start, actual_end, is_group, parent_id, sort_order) VALUES
(1, 'Procurement of Steam Turbine & Generator', '2026-02-01', '2026-07-31', '2026-01-28', '2026-07-28', FALSE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Key Equipment Procurement' LIMIT 1), 104);

-- LEVEL 3: Leaf Tasks under Civil Infrastructure sub-group
INSERT INTO activities (project_id, activity_name, plan_start, plan_end, actual_start, actual_end, is_group, parent_id, sort_order) VALUES
(1, 'Site Preparation & Piling Works', '2026-04-15', '2026-06-30', '2026-04-20', '2026-07-15', FALSE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Civil Infrastructure Works' LIMIT 1), 201),
(1, 'Boiler Foundation Casting', '2026-06-15', '2026-08-15', '2026-06-20', NULL, FALSE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Civil Infrastructure Works' LIMIT 1), 202),
(1, 'Waste Bunker Civil Construction', '2026-07-01', '2026-10-15', NULL, NULL, FALSE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Civil Infrastructure Works' LIMIT 1), 203);

-- LEVEL 3: Leaf Tasks under Mechanical/Piping sub-group
INSERT INTO activities (project_id, activity_name, plan_start, plan_end, actual_start, actual_end, is_group, parent_id, sort_order) VALUES
(1, 'Boiler Structural Steel Erection', '2026-08-16', '2026-11-30', NULL, NULL, FALSE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Mechanical & Piping Installation' LIMIT 1), 204),
(1, 'Piping & Auxiliaries Installation', '2026-10-01', '2026-12-15', NULL, NULL, FALSE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Mechanical & Piping Installation' LIMIT 1), 205),
(1, 'Electrical & Instrumentation Wiring', '2026-11-01', '2026-12-31', NULL, NULL, FALSE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Mechanical & Piping Installation' LIMIT 1), 206);

-- LEVEL 3: Leaf Tasks under Cold Commissioning sub-group
INSERT INTO activities (project_id, activity_name, plan_start, plan_end, actual_start, actual_end, is_group, parent_id, sort_order) VALUES
(1, 'Cold Commissioning & Pipe Flushing', '2026-12-15', '2027-01-31', NULL, NULL, FALSE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Cold Commissioning Tests' LIMIT 1), 301);

-- LEVEL 3: Leaf Tasks under Hot Commissioning sub-group
INSERT INTO activities (project_id, activity_name, plan_start, plan_end, actual_start, actual_end, is_group, parent_id, sort_order) VALUES
(1, 'First Fire & Hot Commissioning', '2027-02-01', '2027-03-15', NULL, NULL, FALSE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Hot Commissioning & Handover' LIMIT 1), 302),
(1, 'Reliability Test Run & COD', '2027-03-16', '2027-04-30', NULL, NULL, FALSE, (SELECT id FROM activities WHERE project_id = 1 AND activity_name = 'Hot Commissioning & Handover' LIMIT 1), 303);


-- =========================================================================
-- PROJECTS 2-7: Seed Flat Tasks (Can be grouped by user dynamically in UI)
-- =========================================================================

-- Project 2: GSE
INSERT INTO activities (project_id, activity_name, plan_start, plan_end, actual_start, actual_end, sort_order) VALUES
(2, 'Project Kick-off & Basic Design', '2026-02-02', '2026-03-15', '2026-02-02', '2026-03-14', 1),
(2, 'Detailed Engineering & Boiler Drawings', '2026-03-16', '2026-06-15', '2026-03-16', '2026-06-10', 2),
(2, 'EIA & Local Government Clearances', '2026-03-01', '2026-05-15', '2026-03-05', '2026-05-12', 3),
(2, 'Piling and Ground Improvement', '2026-05-16', '2026-07-31', '2026-05-18', NULL, 4),
(2, 'Foundation Casting (Boiler & Turbine)', '2026-07-15', '2026-09-30', NULL, NULL, 5),
(2, 'Steam Turbine Procurement & Delivery', '2026-03-01', '2026-08-31', '2026-03-01', NULL, 6),
(2, 'Boiler Pressure Parts Installation', '2026-09-01', '2026-12-15', NULL, NULL, 7),
(2, 'Flue Gas Treatment System Erection', '2026-10-01', '2026-12-31', NULL, NULL, 8),
(2, 'Water Steam Cycle Piping', '2026-11-15', '2027-02-15', NULL, NULL, 9),
(2, 'Electrical Systems & Substation Hookup', '2026-12-01', '2027-02-28', NULL, NULL, 10),
(2, 'Commissioning & Grid Synchronization', '2027-03-01', '2027-04-30', NULL, NULL, 11),
(2, 'COD (Commercial Operation Date)', '2027-05-01', '2027-05-31', NULL, NULL, 12);

-- Project 3: TPP
INSERT INTO activities (project_id, activity_name, plan_start, plan_end, actual_start, actual_end, sort_order) VALUES
(3, 'Project Kick-off & Site Survey', '2026-01-12', '2026-02-28', '2026-01-12', '2026-02-28', 1),
(3, 'Process & Thermal Design Approval', '2026-02-15', '2026-04-15', '2026-02-15', '2026-04-12', 2),
(3, 'Foundation Design & Civil Release', '2026-03-01', '2026-05-15', '2026-03-01', '2026-05-20', 3),
(3, 'Site Cleared & Earthworks', '2026-04-01', '2026-06-15', '2026-04-05', '2026-06-25', 4),
(3, 'Main Building Civil Works', '2026-06-01', '2026-09-30', '2026-06-10', NULL, 5),
(3, 'Procurement of Grate & Ash System', '2026-01-15', '2026-06-30', '2026-01-15', '2026-06-30', 6),
(3, 'Boiler Drum & Header Lifting', '2026-09-15', '2026-10-31', NULL, NULL, 7),
(3, 'Turbine Room Crane Installation', '2026-10-01', '2026-11-15', NULL, NULL, 8),
(3, 'Refractory Lining Installation', '2026-11-01', '2026-12-15', NULL, NULL, 9),
(3, 'Instruments & Controls Calibrations', '2026-12-01', '2027-01-31', NULL, NULL, 10),
(3, 'Refuse Incineration Commissioning', '2027-02-01', '2027-03-31', NULL, NULL, 11),
(3, 'Trial Operations & Handover', '2027-04-01', '2027-05-15', NULL, NULL, 12);

-- Project 4: MKP
INSERT INTO activities (project_id, activity_name, plan_start, plan_end, actual_start, actual_end, sort_order) VALUES
(4, 'Project Alignment & Feasibility', '2026-02-15', '2026-03-31', '2026-02-15', '2026-03-29', 1),
(4, 'EIA & Construction License Approval', '2026-03-01', '2026-06-15', '2026-03-05', '2026-06-22', 2),
(4, 'Equipment Layout Design', '2026-03-15', '2026-05-31', '2026-03-15', '2026-05-30', 3),
(4, 'Piling and Pile Cap Works', '2026-06-01', '2026-08-15', '2026-06-10', NULL, 4),
(4, 'Waste Storage Pit Civil Casting', '2026-07-15', '2026-10-31', NULL, NULL, 5),
(4, 'Boiler Support Steel Structure Erection', '2026-09-01', '2026-11-30', NULL, NULL, 6),
(4, 'Procurement of Air Cooled Condenser (ACC)', '2026-03-01', '2026-08-31', '2026-02-25', NULL, 7),
(4, 'Superheater & Economizer Installation', '2026-11-15', '2027-01-15', NULL, NULL, 8),
(4, 'Flue Gas Cleaning & Chimney Erection', '2026-12-01', '2027-02-15', NULL, NULL, 9),
(4, 'DCS (Distributed Control System) Startup', '2027-01-15', '2027-03-15', NULL, NULL, 10),
(4, 'Chemical Cleaning & Steam Blowing', '2027-03-01', '2027-04-15', NULL, NULL, 11),
(4, 'Performance Run & Grid Compliance', '2027-04-16', '2027-05-31', NULL, NULL, 12);

-- Project 5: PWW1
INSERT INTO activities (project_id, activity_name, plan_start, plan_end, actual_start, actual_end, sort_order) VALUES
(5, 'Contract Finalization & Engineering', '2026-01-05', '2026-02-20', '2026-01-05', '2026-02-18', 1),
(5, 'Civil Drawings & Soil Investigation', '2026-02-01', '2026-03-31', '2026-02-01', '2026-03-28', 2),
(5, 'Site Fencing and Mass Excavation', '2026-03-15', '2026-05-15', '2026-03-15', '2026-05-10', 3),
(5, 'Boiler House Piling & Foundation', '2026-05-01', '2026-07-15', '2026-05-01', '2026-07-25', 4),
(5, 'Turbine Table Foundation Pouring', '2026-06-15', '2026-08-15', '2026-06-20', NULL, 5),
(5, 'Boiler Steel Structure Fabrication & Assembly', '2026-02-15', '2026-07-31', '2026-02-15', '2026-07-30', 6),
(5, 'Waste Bunker Wall Casting', '2026-07-01', '2026-10-15', NULL, NULL, 7),
(5, 'Boiler Pressure Parts Welding', '2026-08-16', '2026-11-15', NULL, NULL, 8),
(5, 'FGT (Flue Gas Treatment) Construction', '2026-10-01', '2026-12-15', NULL, NULL, 9),
(5, 'Steam Turbine Generator Installation', '2026-09-15', '2026-11-30', NULL, NULL, 10),
(5, 'Cabling & Substation Integration', '2026-11-01', '2026-12-31', NULL, NULL, 11),
(5, 'Cold Testing & Hydrostatic Test', '2026-12-15', '2027-02-15', NULL, NULL, 12),
(5, 'Refuse Incineration & Trial Runs', '2027-02-16', '2027-04-15', NULL, NULL, 13),
(5, 'COD & Facility Handover', '2027-04-16', '2027-05-15', NULL, NULL, 14);

-- Project 6: PWW2
INSERT INTO activities (project_id, activity_name, plan_start, plan_end, actual_start, actual_end, sort_order) VALUES
(6, 'Contract Agreement & Initial Design', '2026-02-09', '2026-03-25', '2026-02-09', '2026-03-25', 1),
(6, 'Geotechnical Testing & Ground Prep', '2026-03-01', '2026-04-30', '2026-03-01', '2026-04-26', 2),
(6, 'Civil Infrastructure Planning', '2026-03-15', '2026-05-31', '2026-03-15', '2026-05-29', 3),
(6, 'Piling and Excavation Works', '2026-05-15', '2026-07-31', '2026-05-15', NULL, 4),
(6, 'Main Foundation Slabs Pouring', '2026-07-01', '2026-09-15', NULL, NULL, 5),
(6, 'Procurement of Flue Gas Components', '2026-03-01', '2026-08-31', '2026-03-01', NULL, 6),
(6, 'Boiler Pressure Vessel Assembly', '2026-09-01', '2026-12-15', NULL, NULL, 7),
(6, 'Turbine-Generator Assembly', '2026-10-01', '2026-12-31', NULL, NULL, 8),
(6, 'Water System & Condenser Piping', '2026-11-15', '2027-02-15', NULL, NULL, 9),
(6, 'DCS Calibration & Pre-commissioning', '2026-12-15', '2027-03-15', NULL, NULL, 10),
(6, 'Hot Trial Run & Power Production', '2027-03-16', '2027-05-15', NULL, NULL, 11),
(6, 'Commercial Operation Start', '2027-05-16', '2027-06-15', NULL, NULL, 12);

-- Project 7: SRF
INSERT INTO activities (project_id, activity_name, plan_start, plan_end, actual_start, actual_end, sort_order) VALUES
(7, 'Project Inception & Land Survey', '2026-03-02', '2026-04-15', '2026-03-02', '2026-04-10', 1),
(7, 'Detailed Engineering Specifications', '2026-04-16', '2026-07-15', '2026-04-16', NULL, 2),
(7, 'Government Permits & Clearances', '2026-04-01', '2026-06-30', NULL, NULL, 3),
(7, 'Civil Construction Ground Prep', '2026-07-16', '2026-09-30', NULL, NULL, 4);

-- 5. Disable Row Level Security (RLS) to allow public access for this reporting tool
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
