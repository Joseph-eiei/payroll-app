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