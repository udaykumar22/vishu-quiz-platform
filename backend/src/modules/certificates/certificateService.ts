import PDFDocument from "pdfkit";
import { createCertificate } from "../../dataStore.js";

const grades = [
  { min: 90, label: "A+" },
  { min: 75, label: "A" },
  { min: 60, label: "B" },
  { min: 45, label: "C" },
  { min: 0, label: "D" }
];

export function gradeFromPercent(percent: number) {
  return grades.find((g) => percent >= g.min)?.label ?? "D";
}

export async function generateCertificatePdf(baseUrl: string, playerName: string, roomCode: string, score: number, maxScore: number) {
  const percent = Math.round((score / Math.max(maxScore, 1)) * 100);
  const grade = gradeFromPercent(percent);
  const cert = createCertificate({
    playerName,
    roomCode,
    score,
    grade
  });
  const verifyUrl = `${baseUrl}/api/certificates/${cert.id}/verify`;

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Uint8Array[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  doc.fontSize(28).fillColor("#B8860B").text("Vishu Quiz Certificate", { align: "center" });
  doc.moveDown();
  doc.fontSize(16).fillColor("#222").text(`Awarded to: ${playerName}`, { align: "center" });
  doc.text(`Room: ${roomCode}`, { align: "center" });
  doc.text(`Score: ${score} / ${maxScore}`, { align: "center" });
  doc.text(`Grade: ${grade}`, { align: "center" });
  doc.moveDown();
  doc.fontSize(11).fillColor("#333").text("Verify this certificate:", { align: "center" });
  doc.fontSize(9).fillColor("#444").text(verifyUrl, { align: "center", link: verifyUrl, underline: true });
  doc.end();

  await new Promise<void>((resolve) => doc.on("end", () => resolve()));
  return { cert, buffer: Buffer.concat(chunks), verifyUrl };
}
