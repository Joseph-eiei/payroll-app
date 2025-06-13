export function formatThaiMonth(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const beYear = parseInt(year, 10) + 543;
  const thMonths = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];
  const mIndex = parseInt(month, 10) - 1;
  return `${thMonths[mIndex]} ${beYear}`;
}

export function getNextMonth(monthStr) {
  if (!monthStr) return new Date().toISOString().slice(0, 7);
  const date = new Date(`${monthStr}-01`);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().slice(0, 7);
}
