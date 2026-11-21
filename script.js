"use strict";

const STORAGE_KEY = "itm1131_group12_feedback";
const CATEGORIES = ["Academics", "Facilities", "ICT and Wi-Fi", "Library", "Hostels and Welfare", "Administration"];
const AUDIENCES = ["Student", "Lecturer", "Administrative staff", "Library staff"];
const STATUSES = ["Open", "Under review", "Resolved"];

const SAMPLE_FEEDBACK = [
  { id: 1, category: "ICT and Wi-Fi", audience: "Student", status: "Open", rating: 2, date: "2026-10-18", message: "Wi-Fi in the main lecture hall drops every few minutes during online quizzes." },
  { id: 2, category: "Library", audience: "Student", status: "Under review", rating: 3, date: "2026-10-15", message: "Please extend library opening hours during the examination period." },
  { id: 3, category: "Facilities", audience: "Lecturer", status: "Resolved", rating: 4, date: "2026-10-10", message: "The projector in Room B2 was repaired quickly, thank you to the maintenance team." },
  { id: 4, category: "Academics", audience: "Student", status: "Open", rating: 3, date: "2026-10-17", message: "Course outlines should be shared in the first week so we can plan our reading." },
  { id: 5, category: "Hostels and Welfare", audience: "Student", status: "Under review", rating: 2, date: "2026-10-12", message: "Water supply in the hostel is unreliable in the evenings." },
  { id: 6, category: "Administration", audience: "Administrative staff", status: "Resolved", rating: 5, date: "2026-10-05", message: "The new online registration queue system has reduced waiting time a lot." },
  { id: 7, category: "ICT and Wi-Fi", audience: "Lecturer", status: "Under review", rating: 3, date: "2026-10-14", message: "Computer lab machines need updated software for the programming practicals." },
  { id: 8, category: "Library", audience: "Library staff", status: "Open", rating: null, date: "2026-10-19", message: "We need more copies of the first-year Information Systems textbooks." },
  { id: 9, category: "Facilities", audience: "Student", status: "Open", rating: 1, date: "2026-10-20", message: "Some toilets near the science block have been locked for two weeks." },
  { id: 10, category: "Academics", audience: "Lecturer", status: "Resolved", rating: 4, date: "2026-10-02", message: "The timetable clash for Web Development and Databases was fixed fast." }
];

function isValidFeedback(item) {
  return item && Number.isInteger(item.id) && CATEGORIES.includes(item.category) &&
    AUDIENCES.includes(item.audience) && STATUSES.includes(item.status) &&
    typeof item.message === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
    (item.rating === null || (Number.isInteger(item.rating) && item.rating >= 1 && item.rating <= 5));
}

function loadFeedback() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.every(isValidFeedback)) return parsed;
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    // Storage may be unavailable; sample data remains usable.
  }
  return SAMPLE_FEEDBACK.map(item => ({ ...item }));
}

let feedbackList = loadFeedback();

function saveFeedback() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbackList));
  } catch (error) {
    // The in-memory list remains usable for the current session.
  }
}

const $ = id => document.getElementById(id);

function escapeHtml(text) {
  const element = document.createElement("div");
  element.textContent = String(text);
  return element.innerHTML;
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
  const date = new Date(iso + "T00:00:00");
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function filterAndSortFeedback() {
  const term = $("search").value.trim().toLowerCase();
  const category = $("filter-category").value;
  const audience = $("filter-audience").value;
  const status = $("filter-status").value;
  const sortBy = $("sort-by").value;

  const results = feedbackList.filter(item => {
    const matchesText = term === "" || item.message.toLowerCase().includes(term) || item.category.toLowerCase().includes(term);
    return matchesText && (category === "all" || item.category === category) &&
      (audience === "all" || item.audience === audience) &&
      (status === "all" || item.status === status);
  });

  results.sort((a, b) => {
    if (sortBy === "oldest") return a.date.localeCompare(b.date) || a.id - b.id;
    if (sortBy === "rating-high") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "rating-low") return (a.rating || 6) - (b.rating || 6);
    return b.date.localeCompare(a.date) || b.id - a.id;
  });
  return results;
}

function calculateSummary(list) {
  const summary = { total: list.length, open: 0, review: 0, resolved: 0, average: null, byCategory: {} };
  let ratingSum = 0;
  let ratingCount = 0;

  CATEGORIES.forEach(category => {
    summary.byCategory[category] = { total: 0, open: 0, sum: 0, count: 0 };
  });

  list.forEach(item => {
    if (item.status === "Open") summary.open++;
    else if (item.status === "Under review") summary.review++;
    else if (item.status === "Resolved") summary.resolved++;

    if (Number.isInteger(item.rating)) {
      ratingSum += item.rating;
      ratingCount++;
    }

    const bucket = summary.byCategory[item.category];
    if (bucket) {
      bucket.total++;
      if (item.status === "Open") bucket.open++;
      if (Number.isInteger(item.rating)) {
        bucket.sum += item.rating;
        bucket.count++;
      }
    }
  });

  summary.average = ratingCount ? ratingSum / ratingCount : null;
  return summary;
}

function addFeedback(data) {
  const nextId = feedbackList.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const entry = {
    id: nextId,
    category: data.category,
    audience: data.audience,
    status: "Open",
    rating: data.rating,
    date: new Date().toISOString().slice(0, 10),
    message: data.message
  };
  feedbackList.push(entry);
  saveFeedback();
  return entry;
}

function updateStatus(id, newStatus) {
  const item = feedbackList.find(feedback => feedback.id === id);
  if (!item || !STATUSES.includes(newStatus)) return false;
  item.status = newStatus;
  saveFeedback();
  return true;
}

function containsPersonalInfo(text) {
  const email = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  const phone = /(?:\+?\d[\d\s().-]{8,}\d)/;
  const regNo = /\b\d{2,4}[/-][A-Z]{2,5}[/-]\d{2,6}\b/i;
  return email.test(text) || phone.test(text) || regNo.test(text);
}

function renderSummary() {
  const summary = calculateSummary(feedbackList);
  const average = summary.average === null ? "N/A" : summary.average.toFixed(1) + " / 5";

  $("summary-cards").innerHTML =
    '<div class="stat stat-total"><p class="stat-value">' + summary.total + '</p><p class="stat-label">Total feedback</p></div>' +
    '<div class="stat stat-rating"><p class="stat-value">' + average + '</p><p class="stat-label">Average rating</p></div>' +
    '<div class="stat stat-open"><p class="stat-value">' + summary.open + '</p><p class="stat-label">Open issues</p></div>' +
    '<div class="stat stat-review"><p class="stat-value">' + summary.review + '</p><p class="stat-label">Under review</p></div>' +
    '<div class="stat stat-resolved"><p class="stat-value">' + summary.resolved + '</p><p class="stat-label">Resolved</p></div>';

  $("category-table").querySelector("tbody").innerHTML = CATEGORIES.map(category => {
    const bucket = summary.byCategory[category];
    const categoryAverage = bucket.count ? (bucket.sum / bucket.count).toFixed(1) : "N/A";
    return '<tr><th scope="row">' + escapeHtml(category) + '</th><td>' + bucket.total + '</td><td>' + bucket.open + '</td><td>' + categoryAverage + '</td></tr>';
  }).join("");
}

function renderList() {
  const results = filterAndSortFeedback();
  const staffMode = $("staff-mode").checked;
  const container = $("feedback-list");

  $("result-count").textContent = "Showing " + results.length + " of " + feedbackList.length + " feedback items";
  $("empty-state").hidden = results.length !== 0;

  container.innerHTML = results.map(item => {
    let actions = "";
    if (staffMode) {
      const options = STATUSES.map(status => '<option value="' + escapeHtml(status) + '"' + (status === item.status ? " selected" : "") + ">" + escapeHtml(status) + "</option>").join("");
      actions = '<div class="card-actions"><label for="status-' + item.id + '" class="sr-only">Change status for feedback ' + item.id + '</label><select id="status-' + item.id + '" data-id="' + item.id + '" class="status-select">' + options + '</select></div>';
    }

    return '<article class="card" aria-label="Feedback ' + item.id + '">' +
      '<div class="card-top"><span class="tag">' + escapeHtml(item.category) + '</span><span class="tag ' + statusClass(item.status) + '">' + escapeHtml(item.status) + '</span></div>' +
      '<p class="card-message">' + escapeHtml(item.message) + '</p>' +
      '<div class="card-meta"><span>' + escapeHtml(item.audience) + ' &middot; ' + formatDate(item.date) + '</span><span class="stars" aria-label="Rating: ' + (item.rating ? item.rating + ' out of 5' : 'none') + '">' + starsFor(item.rating) + '</span></div>' + actions + '</article>';
  }).join("");
}

function refreshAll() {
  renderSummary();
  renderList();
}

function fillSelect(selectElement, values, placeholder, allValue) {
  const options = ['<option value="' + allValue + '">' + escapeHtml(placeholder) + '</option>'];
  values.forEach(value => options.push('<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>'));
  selectElement.innerHTML = options.join("");
}

function setupDropdowns() {
  fillSelect($("filter-category"), CATEGORIES, "All categories", "all");
  fillSelect($("filter-audience"), AUDIENCES, "All audiences", "all");
  fillSelect($("filter-status"), STATUSES, "All statuses", "all");
}

function showFieldError(inputId, errorId, text) {
  const input = $(inputId);
  const error = $(errorId);
  if (text) {
    error.textContent = text;
    error.hidden = false;
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
  } else {
    error.hidden = true;
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
  }
}

function showFormMessage(type, text) {
  const box = $("form-message");
  box.textContent = text;
  box.className = "message " + type;
  box.hidden = false;
}

function validateForm() {
  let valid = true;
  let firstBad = null;

  function check(ok, inputId, errorId, text) {
    showFieldError(inputId, errorId, ok ? "" : text);
    if (!ok) {
      valid = false;
      if (!firstBad) firstBad = $(inputId);
    }
  }

  const message = $("message").value.trim();
  check(CATEGORIES.includes($("category").value), "category", "category-error", "Please choose a category.");
  check(AUDIENCES.includes($("audience").value), "audience", "audience-error", "Please choose who you are.");

  let messageError = "";
  if (message.length < 20) messageError = "Please write at least 20 characters.";
  else if (containsPersonalInfo(message)) messageError = "Remove emails, phone numbers or registration numbers to stay anonymous.";
  check(messageError === "", "message", "message-error", messageError);
  check($("confirm").checked, "confirm", "confirm-error", "Please confirm that your message has no personal information.");

  if (firstBad) firstBad.focus();
  return valid;
}

function handleSubmit(event) {
  event.preventDefault();
  $("form-message").hidden = true;

  if (!validateForm()) {
    showFormMessage("error", "Your feedback was not sent. Please fix the highlighted fields.");
    return;
  }

  const ratingInput = document.querySelector('input[name="rating"]:checked');
  addFeedback({
    category: $("category").value,
    audience: $("audience").value,
    message: $("message").value.trim(),
    rating: ratingInput ? Number(ratingInput.value) : null
  });

  event.target.reset();
  $("char-count").textContent = "0";
  ["category", "audience", "message", "confirm"].forEach(id => showFieldError(id, id + "-error", ""));
  refreshAll();
  showFormMessage("success", "Thank you! Your anonymous feedback was submitted and now appears on the board as Open.");
}

function setupEvents() {
  ["search", "filter-category", "filter-audience", "filter-status", "sort-by"].forEach(id => {
    $(id).addEventListener("input", renderList);
    $(id).addEventListener("change", renderList);
  });

  $("filter-form").addEventListener("submit", event => event.preventDefault());
  $("reset-filters").addEventListener("click", () => {
    $("filter-form").reset();
    renderList();
  });
  $("staff-mode").addEventListener("change", renderList);
  $("feedback-list").addEventListener("change", event => {
    if (event.target.classList.contains("status-select")) {
      updateStatus(Number(event.target.dataset.id), event.target.value);
      refreshAll();
    }
  });
  $("feedback-form").addEventListener("submit", handleSubmit);
  $("message").addEventListener("input", () => {
    $("char-count").textContent = $("message").value.length;
  });
  $("clear-rating").addEventListener("click", () => {
    document.querySelectorAll('input[name="rating"]').forEach(radio => { radio.checked = false; });
  });
}

setupDropdowns();
setupEvents();
refreshAll();
