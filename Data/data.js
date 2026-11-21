"use strict";

/* ============================================================
   Anonymous Feedback and Issue Dashboard  (ITM 1131, Group 12)
   Browser-side only. Sample data + localStorage.
   ============================================================ */

const STORAGE_KEY = "itm1131_group12_feedback";

const CATEGORIES = ["Academics", "Facilities", "ICT and Wi-Fi", "Library", "Hostels and Welfare", "Administration"];
const AUDIENCES = ["Student", "Lecturer", "Administrative staff", "Library staff"];
const STATUSES = ["Open", "Under review", "Resolved"];

const SAMPLE_FEEDBACK = [
  { id: 1,  category: "ICT and Wi-Fi",       audience: "Student",              status: "Open",         rating: 2,    date: "2026-10-18", message: "Wi-Fi in the main lecture hall drops every few minutes during online quizzes." },
  { id: 2,  category: "Library",             audience: "Student",              status: "Under review", rating: 3,    date: "2026-10-15", message: "Please extend library opening hours during the examination period." },
  { id: 3,  category: "Facilities",          audience: "Lecturer",             status: "Resolved",     rating: 4,    date: "2026-10-10", message: "The projector in Room B2 was repaired quickly, thank you to the maintenance team." },
  { id: 4,  category: "Academics",           audience: "Student",              status: "Open",         rating: 3,    date: "2026-10-17", message: "Course outlines should be shared in the first week so we can plan our reading." },
  { id: 5,  category: "Hostels and Welfare", audience: "Student",              status: "Under review", rating: 2,    date: "2026-10-12", message: "Water supply in the hostel is unreliable in the evenings." },
  { id: 6,  category: "Administration",      audience: "Administrative staff", status: "Resolved",     rating: 5,    date: "2026-10-05", message: "The new online registration queue system has reduced waiting time a lot." },
  { id: 7,  category: "ICT and Wi-Fi",       audience: "Lecturer",             status: "Under review", rating: 3,    date: "2026-10-14", message: "Computer lab machines need updated software for the programming practicals." },
  { id: 8,  category: "Library",             audience: "Library staff",        status: "Open",         rating: null, date: "2026-10-19", message: "We need more copies of the first-year Information Systems textbooks." },
  { id: 9,  category: "Facilities",          audience: "Student",              status: "Open",         rating: 1,    date: "2026-10-20", message: "Some toilets near the science block have been locked for two weeks." },
  { id: 10, category: "Academics",           audience: "Lecturer",             status: "Resolved",     rating: 4,    date: "2026-10-02", message: "The timetable clash for Web Development and Databases was fixed fast." }
];

/* ---------- State ---------- */
let feedbackList = loadFeedback();

/* ---------- Storage helpers ---------- */
function loadFeedback() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) { /* storage unavailable: fall back to sample data */ }
  return SAMPLE_FEEDBACK.map(function (item) { return Object.assign({}, item); });
}

function saveFeedback() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbackList)); }
  catch (err) { /* ignore: data stays in memory for this session */ }
}

/* ---------- DOM shortcuts ---------- */
const $ = function (id) { return document.getElementById(id); };

/* Escape text before inserting into HTML (prevents script injection) */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = String(text);
  return div.innerHTML;
}

function statusClass(status) {
  if (status === "Open") return "status-open";
  if (status === "Under review") return "status-review";
  return "status-resolved";
}

function starsFor(rating) {
  if (!rating) return "No rating";
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ============================================================
   FUNCTION 1: filterAndSortFeedback  (search / filter / sort)
   ============================================================ */
function filterAndSortFeedback() {
  const term = $("search").value.trim().toLowerCase();
  const category = $("filter-category").value;
  const audience = $("filter-audience").value;
  const status = $("filter-status").value;
  const sortBy = $("sort-by").value;

  const results = feedbackList.filter(function (item) {
    const matchesText = term === "" ||
      item.message.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term);
    const matchesCategory = category === "all" || item.category === category;
    const matchesAudience = audience === "all" || item.audience === audience;
    const matchesStatus = status === "all" || item.status === status;
    return matchesText && matchesCategory && matchesAudience && matchesStatus;
  });

  results.sort(function (a, b) {
    if (sortBy === "oldest") return a.date.localeCompare(b.date) || a.id - b.id;
    if (sortBy === "rating-high") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "rating-low") return (a.rating || 6) - (b.rating || 6);
    return b.date.localeCompare(a.date) || b.id - a.id; // newest
  });

  return results;
}