export function downloadCSV(data: any[], filename: string) {
  if (!data || !data.length) return;

  const header = Object.keys(data[0]);
  
  // Format cells: wrap in quotes to escape commas and quotes
  const formatCell = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`; // Wrapping everything in quotes is generally safer for CSV
  };

  const csvContent = [
    header.join(','),
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
  }
}
