export function downloadCSV(data: any[], filename: string) {
  if (!data || !data.length) return;

  const header = Object.keys(data[0]);
  
  // Format cells: prevent CSV formula injection and wrap in quotes
  const formatCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    // Prevent CSV Formula Injection (DDE / Excel formula execution)
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str.replace(/"/g, '""')}"`;
  };

  const csvContent = [
    header.map(h => formatCell(h)).join(','),
    ...data.map(row => header.map(fieldName => formatCell(row[fieldName])).join(','))
  ].join('\n');

  // Add BOM for UTF-8 to fix Excel encoding issues
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) { // feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
