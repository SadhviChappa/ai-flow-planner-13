import { jsPDF } from "jspdf";

export interface PdfReportData {
  date: string;
  hours: number;
  completed: number;
  pending: number;
  summary: string;
  productivityScore: number;
  strengths: string[];
  improvements: string[];
  tomorrowPlan: string[];
}

export function exportPdfReport(data: PdfReportData) {
  const doc = new jsPDF();

  let y = 20;

  doc.setFontSize(20);
  doc.text("AI Work Planner Report", 20, y);

  y += 15;
  doc.setFontSize(12);

  doc.text(`Date: ${data.date}`, 20, y);
  y += 8;

  doc.text(`Hours Worked: ${data.hours}`, 20, y);
  y += 8;

  doc.text(`Completed Tasks: ${data.completed}`, 20, y);
  y += 8;

  doc.text(`Pending Tasks: ${data.pending}`, 20, y);
  y += 12;

  doc.text("AI Summary:", 20, y);
  y += 8;

  const summaryLines = doc.splitTextToSize(data.summary, 170);
  doc.text(summaryLines, 20, y);
  y += summaryLines.length * 7 + 5;

  doc.text(`Productivity Score: ${data.productivityScore}%`, 20, y);
  y += 12;

  doc.text("Strengths:", 20, y);
  y += 8;

  data.strengths.forEach((item) => {
    doc.text(`• ${item}`, 25, y);
    y += 7;
  });

  y += 5;

  doc.text("Improvements:", 20, y);
  y += 8;

  data.improvements.forEach((item) => {
    doc.text(`• ${item}`, 25, y);
    y += 7;
  });

  y += 5;

  doc.text("Tomorrow Plan:", 20, y);
  y += 8;

  data.tomorrowPlan.forEach((item) => {
    doc.text(`• ${item}`, 25, y);
    y += 7;
  });

  doc.save(`Work_Report_${data.date}.pdf`);
}