// All calculations here use the server's local time (Date's local getters, not UTC/ISO),
// since the payout cutoff is configured and must be enforced in server local time.

// "YYYY-MM-DD" in server local time.
function dateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// The exact Date instant today's configured "HH:mm" cutoff falls on, in server local time.
function todayCutoffInstant(cutoffTimeStr, now = new Date()) {
  const [hours, minutes] = cutoffTimeStr.split(':').map(Number);
  const cutoff = new Date(now);
  cutoff.setHours(hours, minutes, 0, 0);
  return cutoff;
}

// Classifies "now" against today's cutoff and determines which payout cycle
// (today's or tomorrow's) a withdrawal requested at "now" belongs to.
function getCutoffInfo(cutoffTimeStr, now = new Date()) {
  const cutoffAt = todayCutoffInstant(cutoffTimeStr, now);
  const isBeforeCutoff = now < cutoffAt;
  const payoutCycleDate = isBeforeCutoff ? dateKey(now) : dateKey(addDays(now, 1));
  return {
    cutoffAt,
    isBeforeCutoff,
    cutoffBucket: isBeforeCutoff ? 'before_cutoff' : 'after_cutoff',
    payoutCycleDate,
    todayKey: dateKey(now),
  };
}

module.exports = { dateKey, todayCutoffInstant, getCutoffInfo };
