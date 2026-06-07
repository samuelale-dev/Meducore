// ============================================================
// EduCore: Admin Dashboard — Full Featured
// File: src/pages/dashboard/AdminDashboard.tsx
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardShell from '../../components/DashboardShell';
import { tenantApi, studentsApi } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type UserRole =
  | 'ADMIN' | 'TEACHER' | 'HOMEROOM_TEACHER'
  | 'STUDENT' | 'LIBRARY_ASSISTANT' | 'MEAL_RECORDER';

interface AppUser {
  id: string; email: string; fullName: string;
  role: UserRole; createdAt: string;
}

interface UserProfile extends AppUser {
  mealsReceived?: number;
  lastActive?: string;
}

const ALL_ROLES: UserRole[] = [
  'ADMIN','TEACHER','HOMEROOM_TEACHER',
  'STUDENT','LIBRARY_ASSISTANT','MEAL_RECORDER',
];

const ROLE_STYLE: Record<UserRole,{bg:string;color:string;border:string}> = {
  ADMIN:             {bg:'rgba(224,92,92,0.12)',  color:'#e05c5c', border:'rgba(224,92,92,0.28)'},
  TEACHER:           {bg:'rgba(139,92,246,0.12)', color:'#a78bfa', border:'rgba(139,92,246,0.28)'},
  HOMEROOM_TEACHER:  {bg:'rgba(168,85,247,0.12)', color:'#c084fc', border:'rgba(168,85,247,0.28)'},
  STUDENT:           {bg:'rgba(78,201,148,0.12)', color:'#4ec994', border:'rgba(78,201,148,0.28)'},
  LIBRARY_ASSISTANT: {bg:'rgba(201,168,76,0.14)', color:'#c9a84c', border:'rgba(201,168,76,0.3)'},
  MEAL_RECORDER:     {bg:'rgba(96,165,250,0.12)', color:'#7ec8f5', border:'rgba(96,165,250,0.28)'},
};

const FD = "'Cormorant Garamond', Georgia, serif";
const FM = "'Space Mono', 'Courier New', monospace";

// ─── CSV Template ─────────────────────────────────────────────────────────────
const CSV_TEMPLATE = `fullName,email,role
Abebe Girma,abebe@school.edu.et,TEACHER
Fatuma Hassan,fatuma@school.edu.et,STUDENT
Kedir Tessema,kedir@school.edu.et,HOMEROOM_TEACHER`;

// ─── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Space+Mono:wght@400;700&display=swap');

  .adm { display:flex; flex-direction:column; gap:22px; }

  .adm-sec {
    font-family:${FM}; font-size:8.5px; letter-spacing:0.26em;
    color:rgba(240,236,227,0.25); text-transform:uppercase;
    margin-bottom:10px; display:flex; align-items:center; gap:10px;
  }
  .adm-sec::after { content:''; flex:1; height:1px; background:linear-gradient(90deg,rgba(201,168,76,0.15),transparent); }

  /* Stats */
  .adm-stats { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .adm-stat {
    padding:16px 16px 14px; border-radius:16px;
    background:rgba(255,255,255,0.042); backdrop-filter:blur(20px);
    -webkit-backdrop-filter:blur(20px);
    border:1px solid rgba(255,255,255,0.07);
    position:relative; overflow:hidden;
    transition:border-color 0.2s, transform 0.2s; cursor:default;
  }
  .adm-stat:hover { border-color:rgba(201,168,76,0.18); transform:translateY(-1px); }
  .adm-stat-accent { position:absolute; left:0; top:0; bottom:0; width:2px; border-radius:2px 0 0 2px; }
  .adm-stat-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px; }
  .adm-stat-label { font-family:${FM}; font-size:8px; letter-spacing:0.2em; color:rgba(240,236,227,0.3); text-transform:uppercase; }
  .adm-stat-icon { font-size:15px; opacity:0.4; }
  .adm-stat-val { font-family:${FD}; font-size:38px; font-weight:300; color:#f0ece3; line-height:1; letter-spacing:-0.02em; }
  .adm-stat-tenant { font-family:${FM}; font-size:10.5px; color:#c9a84c; font-weight:700; letter-spacing:0.05em; line-height:1.4; word-break:break-all; }
  .adm-stat-sub { font-family:${FM}; font-size:8.5px; color:rgba(240,236,227,0.2); letter-spacing:0.1em; margin-top:4px; }

  /* Quick actions */
  .adm-qa { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .adm-qa-card {
    padding:14px 14px 13px; border-radius:14px;
    background:rgba(255,255,255,0.04); backdrop-filter:blur(16px);
    -webkit-backdrop-filter:blur(16px);
    border:1px solid rgba(255,255,255,0.07);
    cursor:pointer; text-align:left; transition:all 0.2s;
    position:relative; overflow:hidden;
    display:flex; flex-direction:column; gap:5px;
  }
  .adm-qa-card:hover { transform:translateY(-2px); border-color:rgba(255,255,255,0.14); }
  .adm-qa-card:active { transform:scale(0.97); }
  .adm-qa-card::before {
    content:''; position:absolute; inset:0;
    background:radial-gradient(circle at top left, var(--qa-glow,transparent), transparent 70%);
    opacity:0; transition:opacity 0.2s;
  }
  .adm-qa-card:hover::before { opacity:1; }
  .adm-qa-icon { font-size:20px; line-height:1; margin-bottom:2px; }
  .adm-qa-label { font-family:${FD}; font-size:14px; font-weight:600; color:#f0ece3; letter-spacing:0.01em; line-height:1.1; }
  .adm-qa-sub { font-family:${FM}; font-size:9px; color:rgba(240,236,227,0.3); letter-spacing:0.06em; line-height:1.4; }
  .adm-qa-arrow { position:absolute; right:12px; top:12px; font-size:11px; opacity:0.2; transition:opacity 0.2s, transform 0.2s; }
  .adm-qa-card:hover .adm-qa-arrow { opacity:0.7; transform:translate(2px,-2px); }

  /* Panel */
  .adm-panel {
    border-radius:18px; background:rgba(255,255,255,0.042);
    backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
    border:1px solid rgba(201,168,76,0.22);
    box-shadow:0 0 0 1px rgba(201,168,76,0.05) inset, 0 20px 60px rgba(0,0,0,0.4);
    overflow:hidden;
  }
  .adm-panel-head {
    display:flex; align-items:center; justify-content:space-between;
    padding:16px 18px; border-bottom:1px solid rgba(255,255,255,0.06);
  }
  .adm-panel-title { font-family:${FD}; font-size:18px; font-weight:600; color:#f0ece3; letter-spacing:0.01em; }
  .adm-panel-count { font-family:${FM}; font-size:9px; color:rgba(240,236,227,0.25); letter-spacing:0.12em; margin-top:1px; }

  /* Tab bar */
  .adm-tabs { display:flex; gap:4px; padding:12px 18px; border-bottom:1px solid rgba(255,255,255,0.05); }
  .adm-tab {
    padding:6px 14px; border-radius:8px; cursor:pointer;
    font-family:${FM}; font-size:9px; letter-spacing:0.12em; text-transform:uppercase;
    border:1px solid transparent; transition:all 0.18s; color:rgba(240,236,227,0.35); background:none;
  }
  .adm-tab:hover { background:rgba(255,255,255,0.04); color:rgba(240,236,227,0.6); }
  .adm-tab.active { background:rgba(201,168,76,0.12); border-color:rgba(201,168,76,0.25); color:#c9a84c; }

  /* Search */
  .adm-search-wrap { padding:12px 18px; border-bottom:1px solid rgba(255,255,255,0.05); position:relative; }
  .adm-search-icon { position:absolute; left:30px; top:50%; transform:translateY(-50%); font-size:12px; color:rgba(240,236,227,0.2); pointer-events:none; }
  .adm-search {
    width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
    border-radius:10px; color:#f0ece3; font-family:${FM}; font-size:11.5px;
    letter-spacing:0.04em; padding:9px 14px 9px 34px; outline:none;
    transition:border-color 0.2s, box-shadow 0.2s; box-sizing:border-box;
  }
  .adm-search::placeholder { color:rgba(240,236,227,0.18); }
  .adm-search:focus { border-color:rgba(201,168,76,0.4); box-shadow:0 0 0 3px rgba(201,168,76,0.06); }

  /* Add btn */
  .adm-btn-add {
    display:flex; align-items:center; gap:6px; padding:8px 15px; border-radius:10px;
    background:rgba(201,168,76,0.13); border:1px solid rgba(201,168,76,0.28);
    color:#c9a84c; font-family:${FM}; font-size:9px; letter-spacing:0.14em;
    text-transform:uppercase; font-weight:700; cursor:pointer; transition:all 0.2s;
  }
  .adm-btn-add:hover { background:rgba(201,168,76,0.22); box-shadow:0 0 16px rgba(201,168,76,0.18); }

  /* Single user form */
  .adm-form {
    padding:16px 18px; border-bottom:1px solid rgba(255,255,255,0.05);
    background:rgba(201,168,76,0.02); display:flex; flex-direction:column; gap:11px;
    animation:adm-drop 0.22s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes adm-drop { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
  .adm-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .adm-input {
    width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
    border-radius:11px; color:#f0ece3; font-family:${FM}; font-size:11.5px;
    letter-spacing:0.03em; padding:11px 13px; outline:none;
    transition:border-color 0.2s, box-shadow 0.2s; box-sizing:border-box;
  }
  .adm-input::placeholder { color:rgba(240,236,227,0.2); }
  .adm-input:focus { border-color:rgba(201,168,76,0.45); box-shadow:0 0 0 3px rgba(201,168,76,0.07); }
  .adm-input option { background:#0e0e1a; }

  /* CSV import area */
  .adm-csv-area {
    padding:16px 18px; border-bottom:1px solid rgba(255,255,255,0.05);
    background:rgba(78,201,148,0.02); display:flex; flex-direction:column; gap:12px;
    animation:adm-drop 0.22s cubic-bezier(0.16,1,0.3,1) both;
  }
  .adm-csv-label { font-family:${FM}; font-size:9px; letter-spacing:0.16em; color:rgba(240,236,227,0.35); text-transform:uppercase; }
  .adm-csv-textarea {
    width:100%; min-height:110px; background:rgba(255,255,255,0.04);
    border:1px solid rgba(78,201,148,0.2); border-radius:12px;
    color:#f0ece3; font-family:${FM}; font-size:10.5px; letter-spacing:0.03em;
    padding:12px 14px; outline:none; resize:vertical;
    transition:border-color 0.2s, box-shadow 0.2s; box-sizing:border-box;
    line-height:1.7;
  }
  .adm-csv-textarea::placeholder { color:rgba(240,236,227,0.15); }
  .adm-csv-textarea:focus { border-color:rgba(78,201,148,0.4); box-shadow:0 0 0 3px rgba(78,201,148,0.06); }
  .adm-csv-hint { font-family:${FM}; font-size:9px; color:rgba(240,236,227,0.2); letter-spacing:0.06em; line-height:1.7; }
  .adm-csv-hint span { color:rgba(78,201,148,0.6); }
  .adm-csv-preview { display:flex; flex-direction:column; gap:4px; }
  .adm-csv-row-preview {
    display:flex; align-items:center; gap:8px; padding:7px 10px;
    border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05);
  }
  .adm-csv-row-name { font-family:${FD}; font-size:13px; font-weight:600; color:#f0ece3; flex:1; min-width:0; }
  .adm-csv-row-email { font-family:${FM}; font-size:9px; color:rgba(240,236,227,0.3); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .adm-csv-row-err { font-family:${FM}; font-size:9px; color:#e05c5c; }

  /* Primary button */
  .adm-btn-primary {
    padding:12px; border-radius:11px;
    background:linear-gradient(135deg,rgba(201,168,76,0.9),rgba(175,135,45,0.9));
    color:#080810; font-family:${FM}; font-size:10px; font-weight:700;
    letter-spacing:0.16em; text-transform:uppercase; border:none; cursor:pointer;
    transition:opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow:0 0 24px rgba(201,168,76,0.2), inset 0 1px 0 rgba(255,255,255,0.2);
    display:flex; align-items:center; justify-content:center; gap:8px; width:100%;
  }
  .adm-btn-primary:hover:not(:disabled) { opacity:0.88; box-shadow:0 0 36px rgba(201,168,76,0.36), inset 0 1px 0 rgba(255,255,255,0.2); }
  .adm-btn-primary:active:not(:disabled) { transform:scale(0.985); }
  .adm-btn-primary:disabled { opacity:0.32; cursor:not-allowed; }

  /* Ghost btn */
  .adm-btn-ghost {
    padding:10px; border-radius:10px; background:transparent;
    border:1px solid rgba(255,255,255,0.08); color:rgba(240,236,227,0.4);
    font-family:${FM}; font-size:9.5px; letter-spacing:0.12em; text-transform:uppercase;
    cursor:pointer; transition:all 0.18s; width:100%; display:flex; align-items:center; justify-content:center; gap:6px;
  }
  .adm-btn-ghost:hover { border-color:rgba(201,168,76,0.3); color:#c9a84c; }

  .adm-err { font-family:${FM}; font-size:10px; color:#e05c5c; letter-spacing:0.06em; }

  /* User rows */
  .adm-user-row {
    display:flex; align-items:center; gap:11px; padding:13px 18px;
    border-bottom:1px solid rgba(255,255,255,0.03); transition:background 0.15s; cursor:pointer;
  }
  .adm-user-row:last-child { border-bottom:none; }
  .adm-user-row:hover { background:rgba(255,255,255,0.025); }
  .adm-user-ava {
    width:36px; height:36px; border-radius:10px;
    background:linear-gradient(135deg,rgba(201,168,76,0.2),rgba(201,168,76,0.04));
    border:1px solid rgba(201,168,76,0.14);
    display:flex; align-items:center; justify-content:center;
    font-family:${FD}; font-size:13px; font-weight:600; color:#c9a84c; flex-shrink:0;
  }
  .adm-user-name { font-family:${FD}; font-size:13.5px; font-weight:600; color:#f0ece3; letter-spacing:0.01em; }
  .adm-user-email { font-family:${FM}; font-size:9.5px; color:rgba(240,236,227,0.25); letter-spacing:0.04em; margin-top:1px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .adm-user-date { font-family:${FM}; font-size:8px; color:rgba(240,236,227,0.15); letter-spacing:0.08em; margin-top:2px; }
  .adm-role-badge {
    display:inline-flex; align-items:center; padding:4px 9px; border-radius:99px;
    font-family:${FM}; font-size:8px; font-weight:700; letter-spacing:0.12em;
    text-transform:uppercase; border:1px solid; white-space:nowrap; flex-shrink:0;
  }
  .adm-row-arrow { color:rgba(240,236,227,0.15); font-size:11px; flex-shrink:0; }

  /* Empty / loading */
  .adm-empty { padding:40px 18px; text-align:center; font-family:${FM}; font-size:10.5px; color:rgba(240,236,227,0.18); letter-spacing:0.12em; }
  .adm-loading { padding:40px; display:flex; align-items:center; justify-content:center; }
  .adm-ring { width:26px; height:26px; border:2px solid rgba(201,168,76,0.18); border-top-color:rgba(201,168,76,0.7); border-radius:50%; animation:adm-spin 0.8s linear infinite; }
  @keyframes adm-spin { to{transform:rotate(360deg)} }
  .adm-spin-sm { display:inline-block; width:11px; height:11px; border:2px solid rgba(8,8,16,0.3); border-top-color:rgba(8,8,16,0.8); border-radius:50%; animation:adm-spin 0.7s linear infinite; }

  /* Footer */
  .adm-foot { padding:10px 18px; border-top:1px solid rgba(255,255,255,0.04); font-family:${FM}; font-size:8.5px; letter-spacing:0.16em; color:rgba(240,236,227,0.16); text-transform:uppercase; display:flex; align-items:center; justify-content:space-between; }

  /* Toast */
  .adm-toast { position:fixed; top:72px; right:16px; z-index:200; display:flex; align-items:center; gap:9px; padding:12px 16px; border-radius:13px; background:rgba(10,10,20,0.97); border:1px solid rgba(255,255,255,0.08); backdrop-filter:blur(20px); font-family:${FM}; font-size:11px; color:#f0ece3; letter-spacing:0.04em; box-shadow:0 8px 32px rgba(0,0,0,0.5); min-width:220px; animation:adm-toast-in 0.3s cubic-bezier(0.16,1,0.3,1) both; }
  @keyframes adm-toast-in { from{opacity:0;transform:translateX(16px) scale(0.95)} to{opacity:1;transform:translateX(0) scale(1)} }
  .adm-toast-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .adm-toast.ok  .adm-toast-dot { background:#4ec994; box-shadow:0 0 8px #4ec994; }
  .adm-toast.err .adm-toast-dot { background:#e05c5c; box-shadow:0 0 8px #e05c5c; }
  .adm-toast.ok  { border-color:rgba(78,201,148,0.2); }
  .adm-toast.err { border-color:rgba(224,92,92,0.2); }

  /* Activity feed */
  .adm-feed { display:flex; flex-direction:column; }
  .adm-feed-row { display:flex; align-items:flex-start; gap:12px; padding:12px 18px; border-bottom:1px solid rgba(255,255,255,0.03); }
  .adm-feed-row:last-child { border-bottom:none; }
  .adm-feed-dot { width:8px; height:8px; border-radius:50%; margin-top:3px; flex-shrink:0; }
  .adm-feed-msg { font-family:${FM}; font-size:10.5px; color:rgba(240,236,227,0.6); letter-spacing:0.03em; line-height:1.5; }
  .adm-feed-time { font-size:9px; color:rgba(240,236,227,0.2); letter-spacing:0.08em; margin-top:2px; }

  /* QR Scanner modal */
  .adm-qr-overlay {
    position:fixed; inset:0; z-index:150; background:rgba(0,0,0,0.75);
    backdrop-filter:blur(8px); display:flex; align-items:flex-end; justify-content:center;
    animation:adm-fade 0.2s ease both;
  }
  @keyframes adm-fade { from{opacity:0} to{opacity:1} }
  .adm-qr-sheet {
    width:100%; max-width:480px; max-height:92dvh; overflow-y:auto;
    background:rgba(10,10,18,0.98); backdrop-filter:blur(40px);
    border:1px solid rgba(201,168,76,0.18); border-bottom:none;
    border-radius:22px 22px 0 0;
    box-shadow:0 -20px 80px rgba(0,0,0,0.6);
    animation:adm-slide-up 0.32s cubic-bezier(0.16,1,0.3,1) both;
    padding-bottom:env(safe-area-inset-bottom, 20px);
  }
  @keyframes adm-slide-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .adm-qr-handle { width:36px; height:3px; border-radius:2px; background:rgba(255,255,255,0.12); margin:14px auto 0; }
  .adm-qr-head { padding:18px 20px 14px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.06); }
  .adm-qr-title { font-family:${FD}; font-size:19px; font-weight:600; color:#f0ece3; }
  .adm-qr-close { width:30px; height:30px; border-radius:9px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.09); color:rgba(240,236,227,0.5); font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.18s; }
  .adm-qr-close:hover { border-color:rgba(224,92,92,0.4); color:#e05c5c; }
  .adm-qr-body { padding:20px; display:flex; flex-direction:column; gap:16px; }

  /* QR Viewport */
  .adm-qr-viewport {
    width:100%; aspect-ratio:1; border-radius:16px; overflow:hidden;
    background:#000; position:relative;
    border:1px solid rgba(201,168,76,0.2);
  }
  .adm-qr-viewport video { width:100%; height:100%; object-fit:cover; }
  .adm-qr-corner {
    position:absolute; width:24px; height:24px;
    border-color:#c9a84c; border-style:solid; border-width:0;
  }
  .adm-qr-corner.tl { top:12px; left:12px; border-top-width:2px; border-left-width:2px; border-radius:3px 0 0 0; }
  .adm-qr-corner.tr { top:12px; right:12px; border-top-width:2px; border-right-width:2px; border-radius:0 3px 0 0; }
  .adm-qr-corner.bl { bottom:12px; left:12px; border-bottom-width:2px; border-left-width:2px; border-radius:0 0 0 3px; }
  .adm-qr-corner.br { bottom:12px; right:12px; border-bottom-width:2px; border-right-width:2px; border-radius:0 0 3px 0; }
  .adm-qr-scan-line {
    position:absolute; left:16px; right:16px; height:2px;
    background:linear-gradient(90deg, transparent, #c9a84c, transparent);
    box-shadow:0 0 8px rgba(201,168,76,0.6);
    animation:adm-scan 2s ease-in-out infinite;
  }
  @keyframes adm-scan {
    0%   { top:16px; opacity:1; }
    48%  { top:calc(100% - 16px); opacity:1; }
    50%  { opacity:0; }
    52%  { top:16px; opacity:0; }
    54%  { opacity:1; }
    100% { top:16px; opacity:1; }
  }
  .adm-qr-status { position:absolute; bottom:12px; left:0; right:0; text-align:center; font-family:${FM}; font-size:9px; letter-spacing:0.16em; text-transform:uppercase; color:rgba(201,168,76,0.7); }

  /* Manual input */
  .adm-qr-manual { display:flex; gap:8px; }
  .adm-qr-manual input {
    flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);
    border-radius:11px; color:#f0ece3; font-family:${FM}; font-size:11.5px;
    padding:11px 13px; outline:none; transition:border-color 0.2s;
    letter-spacing:0.04em;
  }
  .adm-qr-manual input::placeholder { color:rgba(240,236,227,0.2); }
  .adm-qr-manual input:focus { border-color:rgba(201,168,76,0.45); }
  .adm-qr-lookup {
    padding:11px 16px; border-radius:11px;
    background:rgba(201,168,76,0.15); border:1px solid rgba(201,168,76,0.3);
    color:#c9a84c; font-family:${FM}; font-size:9px; letter-spacing:0.12em;
    text-transform:uppercase; cursor:pointer; transition:all 0.2s; white-space:nowrap;
  }
  .adm-qr-lookup:hover { background:rgba(201,168,76,0.25); }

    /* Profile card (result) */
  .adm-profile-card {
    border-radius:16px; overflow:hidden;
    border:1px solid rgba(201,168,76,0.18);
    background:rgba(255,255,255,0.04);
    animation:adm-drop 0.25s cubic-bezier(0.16,1,0.3,1) both;
  }
  .adm-profile-banner {
    height:60px;
    background:linear-gradient(135deg, rgba(201,168,76,0.15), rgba(80,60,200,0.12));
    position:relative;
  }
  .adm-profile-ava {
    width:52px; height:52px; border-radius:14px;
    background:linear-gradient(135deg, rgba(201,168,76,0.3), rgba(201,168,76,0.08));
    border:2px solid rgba(201,168,76,0.3);
    display:flex; align-items:center; justify-content:center;
    font-family:${FD}; font-size:18px; font-weight:600; color:#c9a84c;
    position:absolute; bottom:-20px; left:18px;
    box-shadow:0 4px 20px rgba(0,0,0,0.4);
  }
  .adm-profile-info { padding:28px 18px 18px; display:flex; flex-direction:column; gap:4px; }
  .adm-profile-name { font-family:${FD}; font-size:20px; font-weight:600; color:#f0ece3; }
  .adm-profile-email { font-family:${FM}; font-size:10px; color:rgba(240,236,227,0.3); letter-spacing:0.06em; }
  .adm-profile-meta { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
  .adm-profile-chip {
    display:inline-flex; align-items:center; gap:5px; padding:4px 10px;
    border-radius:99px; font-family:${FM}; font-size:8.5px; letter-spacing:0.12em;
    border:1px solid; text-transform:uppercase;
  }
  .adm-profile-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; padding:0 18px 18px; }
  .adm-profile-stat { padding:10px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); text-align:center; }
  .adm-profile-stat-val { font-family:${FD}; font-size:20px; font-weight:300; color:#f0ece3; }
  .adm-profile-stat-label { font-family:${FM}; font-size:8px; color:rgba(240,236,227,0.25); letter-spacing:0.14em; text-transform:uppercase; margin-top:2px; }

  /* Import results */
  .adm-import-results { display:flex; flex-direction:column; gap:6px; }
  .adm-import-row { display:flex; align-items:center; gap:8px; padding:8px 10px; border-radius:9px; border:1px solid; }
  .adm-import-row.ok  { background:rgba(78,201,148,0.06);  border-color:rgba(78,201,148,0.15); }
  .adm-import-row.err { background:rgba(224,92,92,0.06);   border-color:rgba(224,92,92,0.15); }
  .adm-import-row-icon { font-size:13px; }
  .adm-import-row-name { font-family:${FD}; font-size:13px; font-weight:600; color:#f0ece3; flex:1; }
  .adm-import-row-msg  { font-family:${FM}; font-size:9px; color:rgba(240,236,227,0.3); letter-spacing:0.04em; }
`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toast({ msg, type, onDone }: { msg:string; type:'ok'|'err'; onDone:()=>void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return ()=>clearTimeout(t); }, []);
  return <div className={`adm-toast ${type}`}><span className="adm-toast-dot"/>{msg}</div>;
}

// ─── QR Scanner Modal ─────────────────────────────────────────────────────────
function QRScannerModal({ token, onClose }: { token:string; onClose:()=>void }) {
  const [manualId, setManualId]       = useState('');
  const [scanning, setScanning]       = useState(false);
  const [profile, setProfile]         = useState<UserProfile|null>(null);
  const [lookupErr, setLookupErr]     = useState('');
  const [looking, setLooking]         = useState(false);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);

  // Start html5-qrcode scanner
  useEffect(() => {
    let html5QrCode: any;
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      html5QrCode = new Html5Qrcode('adm-qr-video');
      scannerRef.current = html5QrCode;
      html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText: string) => { handleLookup(decodedText.trim()); },
        () => {}
      ).catch(() => setScanning(false));
      setScanning(true);
    }).catch(() => setScanning(false));
    return () => {
      scannerRef.current?.stop().catch(()=>{});
    };
  }, []);

  const handleLookup = useCallback(async (id: string) => {
    if (!id) return;
    setLooking(true); setLookupErr(''); setProfile(null);
    // Stop scanner once we get a result
    scannerRef.current?.pause?.();
    try {
      const result: any = await (tenantApi as any).getUserProfile(token, id);
      setProfile(result);
    } catch (e: any) {
      setLookupErr(e.message ?? 'User not found.');
    } finally {
      setLooking(false);
    }
  }, [token]);

  const initials = (name:string) => name.split(' ').map(n=>n[0]?.toUpperCase()??'').join('').slice(0,2);

  return (
    <div className="adm-qr-overlay" onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="adm-qr-sheet">
        <div className="adm-qr-handle" />
        <div className="adm-qr-head">
          <div className="adm-qr-title">QR Scanner</div>
          <button className="adm-qr-close" onClick={onClose}>×</button>
        </div>
        <div className="adm-qr-body">

          {/* Camera viewport */}
          <div className="adm-qr-viewport">
            <div id="adm-qr-video" style={{width:'100%',height:'100%'}} />
            <div className="adm-qr-corner tl"/><div className="adm-qr-corner tr"/>
            <div className="adm-qr-corner bl"/><div className="adm-qr-corner br"/>
            <div className="adm-qr-scan-line"/>
            <div className="adm-qr-status">
              {looking ? 'Looking up…' : scanning ? 'Point at QR code' : 'Camera loading…'}
            </div>
          </div>

          {/* Manual lookup */}
          <div>
            <div className="adm-csv-label" style={{marginBottom:8}}>Or enter ID manually</div>
            <div className="adm-qr-manual">
              <input
                value={manualId}
                onChange={e=>setManualId(e.target.value)}
                placeholder="Student ID or User ID"
                onKeyDown={e=>e.key==='Enter'&&handleLookup(manualId)}
              />
              <button className="adm-qr-lookup" onClick={()=>handleLookup(manualId)} disabled={!manualId||looking}>
                {looking ? '…' : 'Look up'}
              </button>
            </div>
          </div>

          {lookupErr && <p className="adm-err">⚠ {lookupErr}</p>}

          {/* Profile result */}
          {profile && (
            <div className="adm-profile-card">
              <div className="adm-profile-banner">
                <div className="adm-profile-ava">{initials(profile.fullName)}</div>
              </div>
              <div className="adm-profile-info">
                <div className="adm-profile-name">{profile.fullName}</div>
                <div className="adm-profile-email">{profile.email}</div>
                <div className="adm-profile-meta">
                  {(() => { const rs=ROLE_STYLE[profile.role]; return (
                    <span className="adm-profile-chip adm-role-badge"
                      style={{background:rs.bg,color:rs.color,borderColor:rs.border}}>
                      {profile.role.replace(/_/g,' ')}
                    </span>
                  );})()}
                  <span className="adm-profile-chip"
                    style={{background:'rgba(255,255,255,0.04)',color:'rgba(240,236,227,0.4)',borderColor:'rgba(255,255,255,0.08)'}}>
                    ID: {profile.id.slice(0,8)}…
                  </span>
                  {profile.createdAt && (
                    <span className="adm-profile-chip"
                      style={{background:'rgba(255,255,255,0.04)',color:'rgba(240,236,227,0.3)',borderColor:'rgba(255,255,255,0.07)'}}>
                      Joined {new Date(profile.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                    </span>
                  )}
                </div>
              </div>
              <div className="adm-profile-stats">
                <div className="adm-profile-stat">
                  <div className="adm-profile-stat-val">{profile.mealsReceived ?? '—'}</div>
                  <div className="adm-profile-stat-label">Meals</div>
                </div>
                <div className="adm-profile-stat">
                  <div className="adm-profile-stat-val" style={{fontSize:13}}>{profile.lastActive ?? '—'}</div>
                  <div className="adm-profile-stat-label">Last Active</div>
                </div>
                <div className="adm-profile-stat">
                  <div className="adm-profile-stat-val" style={{color:profile.role==='STUDENT'?'#4ec994':'#a78bfa',fontSize:15}}>
                    {profile.role==='STUDENT'?'🎓':'👤'}
                  </div>
                  <div className="adm-profile-stat-label">Type</div>
                </div>
              </div>
              <div style={{padding:'0 18px 18px'}}>
                <button className="adm-btn-ghost" onClick={()=>{ setProfile(null); scannerRef.current?.resume?.(); }}>
                  ↩ Scan Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Import Modal ────────────────────────────────────────────────────────
interface CsvRow { fullName:string; email:string; role:UserRole; err?:string; }
interface ImportResult { name:string; ok:boolean; msg:string; }

function BulkImportModal({ token, onClose, onDone }: { token:string; onClose:()=>void; onDone:(n:number)=>void }) {
  const [csv, setCsv]               = useState('');
  const [rows, setRows]             = useState<CsvRow[]>([]);
  const [importing, setImporting]   = useState(false);
  const [results, setResults]       = useState<ImportResult[]|null>(null);

  // Parse CSV live
  useEffect(() => {
    if (!csv.trim()) { setRows([]); return; }
    const lines = csv.trim().split('\n').filter(l=>l.trim());
    const start = lines[0].toLowerCase().includes('fullname') ? 1 : 0;
    const parsed: CsvRow[] = lines.slice(start).map(line => {
      const [fullName='', email='', role=''] = line.split(',').map(s=>s.trim());
      const validRole = ALL_ROLES.includes(role.toUpperCase() as UserRole)
        ? role.toUpperCase() as UserRole : null;
      return {
        fullName, email,
        role: (validRole ?? 'STUDENT') as UserRole,
        err: !fullName ? 'Missing name'
          : !email.includes('@') ? 'Invalid email'
          : !validRole ? `Unknown role "${role}"`
          : undefined,
      };
    });
    setRows(parsed);
  }, [csv]);

  const validRows  = rows.filter(r=>!r.err);
  const invalidRows = rows.filter(r=>r.err);

  const handleImport = async () => {
    if (!validRows.length) return;
    setImporting(true);
    const res: ImportResult[] = [];
    for (const row of validRows) {
      try {
        await tenantApi.createUser(token, { fullName:row.fullName, email:row.email, role:row.role });
        res.push({ name:row.fullName, ok:true, msg:'Created successfully' });
      } catch(e:any) {
        res.push({ name:row.fullName, ok:false, msg:e.message??'Failed' });
      }
    }
    setResults(res);
    setImporting(false);
    const created = res.filter(r=>r.ok).length;
    if (created > 0) onDone(created);
  };
    const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type:'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'educore-users-template.csv';
    a.click();
  };

  return (
    <div className="adm-qr-overlay" onClick={e=>{ if(e.target===e.currentTarget&&!importing) onClose(); }}>
      <div className="adm-qr-sheet">
        <div className="adm-qr-handle"/>
        <div className="adm-qr-head">
          <div className="adm-qr-title">Bulk Import Users</div>
          <button className="adm-qr-close" onClick={onClose} disabled={importing}>×</button>
        </div>
        <div className="adm-qr-body">

          {!results ? (
            <>
              {/* Instructions */}
              <div className="adm-csv-area" style={{animation:'none',border:'none',padding:0,background:'transparent'}}>
                <div className="adm-csv-hint">
                  Paste CSV below — one user per line.<br/>
                  Format: <span>fullName, email, role</span><br/>
                  Valid roles: <span>{ALL_ROLES.join(' · ')}</span>
                </div>
                <button className="adm-btn-ghost" onClick={downloadTemplate} style={{width:'auto',padding:'7px 14px'}}>
                  ↓ Download template CSV
                </button>
              </div>

              <div className="adm-csv-area" style={{animation:'none'}}>
                <div className="adm-csv-label">Paste CSV data</div>
                <textarea
                  className="adm-csv-textarea"
                  value={csv}
                  onChange={e=>setCsv(e.target.value)}
                  placeholder={`fullName,email,role\nAbebe Girma,abebe@school.edu.et,TEACHER\nFatuma Hassan,fatuma@school.edu.et,STUDENT`}
                />
              </div>

              {/* Preview */}
              {rows.length > 0 && (
                <div className="adm-csv-preview">
                  <div className="adm-csv-label" style={{marginBottom:4}}>
                    Preview — {validRows.length} valid · {invalidRows.length} errors
                  </div>
                  {rows.slice(0,8).map((r,i)=>(
                    <div key={i} className="adm-csv-row-preview">
                      <div className="adm-csv-row-name">{r.fullName||'—'}</div>
                      <div className="adm-csv-row-email">{r.email}</div>
                      {r.err
                        ? <div className="adm-csv-row-err">⚠ {r.err}</div>
                        : (() => { const rs=ROLE_STYLE[r.role]; return (
                            <span className="adm-role-badge"
                              style={{background:rs.bg,color:rs.color,borderColor:rs.border}}>
                              {r.role.replace(/_/g,' ')}
                            </span>
                          );})()
                      }
                    </div>
                  ))}
                  {rows.length > 8 && (
                    <div className="adm-csv-hint" style={{textAlign:'center'}}>+{rows.length-8} more rows</div>
                  )}
                </div>
              )}

              <button
                className="adm-btn-primary"
                disabled={!validRows.length || importing}
                onClick={handleImport}
              >
                {importing ? <><span className="adm-spin-sm"/>Importing…</> : `Import ${validRows.length} User${validRows.length!==1?'s':''} →`}
              </button>
            </>
          ) : (
            <>
              <div className="adm-csv-label">
                Import complete — {results.filter(r=>r.ok).length}/{results.length} succeeded
              </div>
              <div className="adm-import-results">
                {results.map((r,i)=>(
                  <div key={i} className={`adm-import-row ${r.ok?'ok':'err'}`}>
                    <span className="adm-import-row-icon">{r.ok?'✓':'✕'}</span>
                    <span className="adm-import-row-name">{r.name}</span>
                    <span className="adm-import-row-msg">{r.msg}</span>
                  </div>
                ))}
              </div>
              <button className="adm-btn-primary" onClick={onClose}>Done →</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type ModalType = 'none'|'add-single'|'bulk-import'|'qr';

export default function AdminDashboard() {
  const { session, appUser } = useAuth();
  const navigate = useNavigate();
  const token = session?.access_token ?? '';

  const [users, setUsers]               = useState<AppUser[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState<ModalType>('none');
  const [search, setSearch]             = useState('');
  const [filterRole, setFilterRole]     = useState<UserRole|'ALL'>('ALL');
  const [form, setForm]                 = useState({ email:'', fullName:'', role:'TEACHER' as UserRole });
  const [saving, setSaving]             = useState(false);
  const [formErr, setFormErr]           = useState('');
  const [toast, setToast]               = useState<{msg:string;type:'ok'|'err'}|null>(null);

  const showToast = (msg:string, type:'ok'|'err'='ok') => setToast({msg,type});

  // Inject styles
  useEffect(()=>{
    const el = document.createElement('style');
    el.id='adm-styles'; el.textContent=STYLES;
    if(!document.getElementById('adm-styles')) document.head.appendChild(el);
    return ()=>{ document.getElementById('adm-styles')?.remove(); };
  },[]);

  // Load data
  const loadData = useCallback(()=>{
    setLoading(true);
    Promise.all([tenantApi.listUsers(token), studentsApi.list(token)])
      .then(([u,s]:any)=>{ setUsers(u); setStudentCount(Array.isArray(s)?s.length:0); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[token]);

  useEffect(()=>{ loadData(); },[loadData]);

  async function handleSingleCreate(e:React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormErr('');
    try {
      const nu:any = await tenantApi.createUser(token, form);
      setUsers(u=>[nu,...u]);
      setForm({email:'',fullName:'',role:'TEACHER'});
      setModal('none');
      showToast(`${form.fullName} added successfully.`);
    } catch(e:any) { setFormErr(e.message); }
    finally { setSaving(false); }
  }

  const handleBulkDone = (count:number) => {
    showToast(`${count} user${count!==1?'s':''} imported successfully.`);
    loadData(); // refresh list
  };

  const initials = (name:string) => name.split(' ').map(n=>n[0]?.toUpperCase()??'').join('').slice(0,2)||'??';

  const filtered = users.filter(u=>{
    const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = filterRole==='ALL' || u.role===filterRole;
    return matchSearch && matchRole;
  });

  const stats = [
    { label:'Total Users', value:users.length,                                   accent:'#c9a84c', icon:'👥', sub:'All accounts' },
    { label:'Students',    value:studentCount,                                    accent:'#4ec994', icon:'🎓', sub:'Enrolled' },
    { label:'Staff',       value:users.filter(u=>u.role!=='STUDENT').length,      accent:'#7ec8f5', icon:'👔', sub:'Active staff' },
    { label:'Tenant',      value:null, tenant:appUser?.tenant?.subdomain??'—',    accent:'#f59e0b', icon:'🏫', sub:'Identifier' },
  ];

  const quickActions = [
    { icon:'▩', label:'QR Scanner',    sub:'Scan any user QR',         color:'#c9a84c', glow:'rgba(201,168,76,0.28)',  action:()=>setModal('qr') },
    { icon:'👤', label:'Add User',      sub:'Single user registration', color:'#a78bfa', glow:'rgba(139,92,246,0.28)', action:()=>setModal('add-single') },
    { icon:'📋', label:'Bulk Import',   sub:'CSV — many users at once', color:'#4ec994', glow:'rgba(78,201,148,0.28)', action:()=>setModal('bulk-import') },
    { icon:'🎓', label:'Students',      sub:'Browse student records',   color:'#4ec994', glow:'rgba(78,201,148,0.28)', action:()=>navigate('/dashboard/admin/students') },
    { icon:'📅', label:'Schedule',      sub:'Manage timetables',        color:'#7ec8f5', glow:'rgba(96,165,250,0.28)', action:()=>navigate('/dashboard/admin/schedule') },
    { icon:'⚙',  label:'Settings',      sub:'System configuration',     color:'#94a3b8', glow:'rgba(148,163,184,0.25)',action:()=>navigate('/dashboard/admin/settings') },
  ];

  const feed = [
    { msg:'Admin session started',               time:'Just now',   color:'#4ec994' },
    { msg:'Student QR generated',                time:'4 min ago',  color:'#c9a84c' },
    { msg:'Meal log submitted (Lunch)',           time:'22 min ago', color:'#7ec8f5' },
    { msg:'New teacher account created',         time:'1 hr ago',   color:'#a78bfa' },
    { msg:'Schedule updated — Grade 11A',        time:'3 hrs ago',  color:'#f59e0b' },
  ];

  return (
    <DashboardShell title="Admin Panel">
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)} />}
      {modal==='qr'         && <QRScannerModal   token={token} onClose={()=>setModal('none')} />}
      {modal==='bulk-import'&& <BulkImportModal  token={token} onClose={()=>setModal('none')} onDone={handleBulkDone} />}

      <div className="adm">

        {/* Stats */}
        <div>
          <div className="adm-sec">Overview</div>
          <div className="adm-stats">
            {stats.map(s=>(
              <div key={s.label} className="adm-stat">
                <div className="adm-stat-accent" style={{background:s.accent}} />
                <div className="adm-stat-top">
                  <div className="adm-stat-label">{s.label}</div>
                  <div className="adm-stat-icon">{s.icon}</div>
                </div>
                {s.tenant!==undefined
                  ? <div className="adm-stat-tenant">{loading?'—':s.tenant}</div>
                  : <div className="adm-stat-val">{loading?'—':s.value}</div>
                }
                <div className="adm-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <div className="adm-sec">Quick Actions</div>
          <div className="adm-qa">
            {quickActions.map(qa=>(
              <button key={qa.label} className="adm-qa-card"
                style={{'--qa-glow':qa.glow} as React.CSSProperties}
                onClick={qa.action}>
                <span className="adm-qa-arrow">↗</span>
                <div className="adm-qa-icon" style={{color:qa.color}}>{qa.icon}</div>
                <div className="adm-qa-label">{qa.label}</div>
                <div className="adm-qa-sub">{qa.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Users panel */}
        <div>
          <div className="adm-sec">User Management</div>
          <div className="adm-panel">
            <div className="adm-panel-head">
              <div>
                <div className="adm-panel-title">Users</div>
                <div className="adm-panel-count">
                  {users.length} total · {users.filter(u=>u.role==='STUDENT').length} students · {users.filter(u=>u.role!=='STUDENT').length} staff
                </div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button className="adm-btn-add" onClick={()=>setModal(m=>m==='add-single'?'none':'add-single')}>
                  {modal==='add-single'?'✕ Cancel':'+ Add User'}
                </button>
                <button className="adm-btn-add" onClick={()=>setModal('bulk-import')}
                  style={{background:'rgba(78,201,148,0.1)',borderColor:'rgba(78,201,148,0.25)',color:'#4ec994'}}>
                  ↑ Import
                </button>
              </div>
            </div>

            {/* Single add form */}
            {modal==='add-single' && (
              <form onSubmit={handleSingleCreate} className="adm-form">
                {formErr && <p className="adm-err">⚠ {formErr}</p>}
                <input className="adm-input" placeholder="Full name"
                  value={form.fullName} onChange={e=>setForm(f=>({...f,fullName:e.target.value}))} required />
                <input type="email" className="adm-input" placeholder="Email address"
                  value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required />
                <div className="adm-form-grid">
                  <select className="adm-input" value={form.role}
                    onChange={e=>setForm(f=>({...f,role:e.target.value as UserRole}))}>
                    {ALL_ROLES.map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
                  </select>
                  <button type="submit" className="adm-btn-primary" disabled={saving} style={{width:'auto'}}>
                    {saving&&<span className="adm-spin-sm"/>}
                    {saving?'Creating…':'Create →'}
                  </button>
                </div>
              </form>
            )}

            {/* Role filter tabs */}
            <div className="adm-tabs" style={{overflowX:'auto',flexWrap:'nowrap'}}>
              {(['ALL',...ALL_ROLES] as (UserRole|'ALL')[]).map(r=>(
                <button key={r} className={`adm-tab ${filterRole===r?'active':''}`}
                  onClick={()=>setFilterRole(r)}>
                  {r==='ALL'?'All':r.replace(/_/g,' ')}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="adm-search-wrap">
              <span className="adm-search-icon">🔍</span>
              <input className="adm-search" placeholder="Search by name or email…"
                value={search} onChange={e=>setSearch(e.target.value)} />
            </div>

            {/* List */}
            {loading ? (
              <div className="adm-loading"><div className="adm-ring"/></div>
            ) : filtered.length===0 ? (
              <div className="adm-empty">{search||filterRole!=='ALL'?'No users match your filters.':'No users yet.'}</div>
            ) : (
              <ul style={{listStyle:'none',margin:0,padding:0}}>
                {filtered.map(u=>{
                  const rs=ROLE_STYLE[u.role];
                  return (
                    <li key={u.id} className="adm-user-row">
                      <div className="adm-user-ava">{initials(u.fullName)}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="adm-user-name">{u.fullName}</div>
                        <div className="adm-user-email">{u.email}</div>
                        {u.createdAt&&<div className="adm-user-date">Joined {new Date(u.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div>}
                      </div>
                      <span className="adm-role-badge" style={{background:rs.bg,color:rs.color,borderColor:rs.border}}>
                        {u.role.replace(/_/g,' ')}
                      </span>
                      <span className="adm-row-arrow">›</span>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="adm-foot">
              <span>{filtered.length} of {users.length} users</span>
              <span>{new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div>
          <div className="adm-sec">Recent Activity</div>
          <div className="adm-panel">
            <div className="adm-feed">
              {feed.map((f,i)=>(
                <div key={i} className="adm-feed-row">
                  <div className="adm-feed-dot" style={{background:f.color,boxShadow:`0 0 6px ${f.color}`}}/>
                  <div>
                    <div className="adm-feed-msg">{f.msg}</div>
                    <div className="adm-feed-time">{f.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </DashboardShell>
  );
              }
