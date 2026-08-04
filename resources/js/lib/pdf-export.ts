import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type PdfExportOptions = {
    title: string;
    subtitle?: string;
    headers: string[];
    rows: (string | number)[][];
    filename: string;
    orientation?: 'portrait' | 'landscape';
};

export function exportPdf({ title, subtitle, headers, rows, filename, orientation = 'portrait' }: PdfExportOptions) {
    const doc = new jsPDF({ orientation });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, 20, { align: 'center' });

    if (subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(subtitle, pageWidth / 2, 28, { align: 'center' });
    }

    const startY = subtitle ? 36 : 28;

    autoTable(doc, {
        startY,
        head: [headers],
        body: rows,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 255] },
        margin: { left: 14, right: 14 },
    });

    doc.save(`${filename}.pdf`);
}

export function exportAttendancePdf({
    title,
    section,
    subject,
    date,
    headers,
    rows,
    filename,
}: {
    title: string;
    section?: string;
    subject?: string;
    date?: string;
    headers: string[];
    rows: (string | number)[][];
    filename: string;
}) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    let y = 28;

    if (section) {
 doc.text(`Section: ${section}`, 14, y); y += 6; 
}

    if (subject) {
 doc.text(`Subject: ${subject}`, 14, y); y += 6; 
}

    if (date) {
 doc.text(`Date: ${date}`, 14, y); y += 6; 
}

    autoTable(doc, {
        startY: y + 4,
        head: [headers],
        body: rows,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [139, 92, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 245, 255] },
        margin: { left: 14, right: 14 },
    });

    doc.save(`${filename}.pdf`);
}
