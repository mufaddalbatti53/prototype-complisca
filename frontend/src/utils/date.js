//date formatting
export function formatIST(dateStr, includeSeconds = true) {
  if (!dateStr) return '-';
  try {
    let s = String(dateStr).trim();
    if (!s.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(s)) {
      s += 'Z';
    }
    const date = new Date(s);
    if (isNaN(date.getTime())) return String(dateStr);

    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: includeSeconds ? '2-digit' : undefined,
      hour12: true
    }) + ' IST';
  } catch (e) {
    return String(dateStr);
  }
}

export function formatISTDate(dateStr) {
  if (!dateStr) return '-';
  try {
    let s = String(dateStr).trim();
    if (!s.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(s)) {
      s += 'Z';
    }
    const date = new Date(s);
    if (isNaN(date.getTime())) return String(dateStr);

    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return String(dateStr);
  }
}
