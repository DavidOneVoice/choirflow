export function getCreateLineupDraftKey() {
  return "choirflow:create-lineup:draft";
}

export function getEditLineupDraftKey(lineupId) {
  return `choirflow:edit-lineup:${lineupId}:draft`;
}

export function saveDraft(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save draft:", err);
  }
}

export function loadDraft(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Failed to load draft:", err);
    return null;
  }
}

export function clearDraft(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error("Failed to clear draft:", err);
  }
}
