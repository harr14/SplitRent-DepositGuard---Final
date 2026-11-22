export function formatDateTime(value) {
  if (!value) return 'Just now';

  let date;
  if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value);
  } else if (value?.toDate) {
    // Firestore Timestamp object
    date = value.toDate();
  } else if (typeof value?.seconds === 'number') {
    date = new Date(value.seconds * 1000);
  } else {
    date = new Date();
  }

  if (Number.isNaN(date.getTime())) return 'Just now';

  const day = date.toLocaleDateString('en-IN', {
    weekday: 'long',
    timeZone: 'Asia/Kolkata',
  });

  const dateStr = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  const timeStr = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  return `${day}, ${dateStr} • ${timeStr}`;
}