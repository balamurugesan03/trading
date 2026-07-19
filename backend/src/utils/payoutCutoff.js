// All calculations here are anchored to India Standard Time (Asia/Kolkata, fixed UTC+05:30,
// no DST) regardless of the host server's OS timezone. Do NOT switch this back to host-local
// Date getters (getHours/setHours/getDate) - on a host whose OS timezone isn't IST (most cloud
// hosts default to UTC), a cutoff like "15:00" would silently be read as 15:00 UTC (8:30 PM
// IST) instead of 3 PM IST, so this must stay timezone-explicit rather than relying on wherever
// the process happens to be deployed.

const BUSINESS_TZ = 'Asia/Kolkata';

function partsInBusinessTz(date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
}

// "YYYY-MM-DD" in business (IST) local time.
function dateKey(date) {
  const { year, month, day } = partsInBusinessTz(date);
  return `${year}-${month}-${day}`;
}

function addDays(date, n) {
  return new Date(date.getTime() + n * 24 * 60 * 60 * 1000);
}

// The exact Date instant today's configured "HH:mm" cutoff falls on, in IST.
function todayCutoffInstant(cutoffTimeStr, now = new Date()) {
  const [hours, minutes] = cutoffTimeStr.split(':').map(Number);
  const { year, month, day } = partsInBusinessTz(now);
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return new Date(`${year}-${month}-${day}T${hh}:${mm}:00+05:30`);
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

// Start/end (as UTC instants) of the current business (IST) calendar day - for querying
// "today" data (e.g. today's credited payouts) consistently with how ROI crediting and the
// cutoff define "today", instead of drifting to the host/UTC calendar day.
function businessDayRange(now = new Date()) {
  const { year, month, day } = partsInBusinessTz(now);
  const start = new Date(`${year}-${month}-${day}T00:00:00+05:30`);
  const end = addDays(start, 1);
  return { start, end };
}

module.exports = { dateKey, todayCutoffInstant, getCutoffInfo, businessDayRange };
