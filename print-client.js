const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { print } = require("pdf-to-printer");

const APP_BASE_URL = "http://localhost:3000";
const PRINTER_NAME = "EPSON TM-T88V Receipt5";

function formatDateTime(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} · ${hours}:${minutes}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchNextJob() {
  const response = await fetch(`${APP_BASE_URL}/api/print-jobs/next`);
  const data = await response.json();
  return data.job;
}

async function markPrinted(id) {
  await fetch(`${APP_BASE_URL}/api/print-jobs/${id}/printed`, {
    method: "POST",
  });
}

async function markFailed(id) {
  await fetch(`${APP_BASE_URL}/api/print-jobs/${id}/failed`, {
    method: "POST",
  });
}

function createReceiptPdf(job) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, `receipt-${job.id}.pdf`);

    const doc = new PDFDocument({
      size: [226, 800], // ca. 80mm Breite in Punkten
      margins: {
        top: 20,
        bottom: 20,
        left: 18,
        right: 18,
      },
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.font("Helvetica-Bold").fontSize(12).text("AI TELL YOU EVERYTHING", {
      align: "center",
    });

    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(10).text("--------------------------------", {
      align: "center",
    });

    doc.moveDown(0.8);

    doc.font("Helvetica").fontSize(10).text(job.story, {
      align: "left",
      width: 190,
    });

    doc.moveDown(1);

    if (job.place) {
      doc.text(`Ort: ${job.place}`);
    }

    doc.text(formatDateTime(job.created_at));
    doc.moveDown(0.8);
    doc.text(`V${String(job.version).padStart(2, "0")} · ${job.session_id}`);

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
}

async function printJob(job) {
  const pdfPath = await createReceiptPdf(job);

  await print(pdfPath, {
    printer: PRINTER_NAME,
  });

  return pdfPath;
}

async function run() {
  console.log("Print client gestartet...");

  while (true) {
    try {
      const job = await fetchNextJob();

      if (!job) {
        await sleep(3000);
        continue;
      }

      console.log(`Drucke Job ${job.id} ...`);

      try {
        const pdfPath = await printJob(job);
        await markPrinted(job.id);
        console.log(`Job ${job.id} gedruckt.`);
        console.log(`PDF erzeugt: ${pdfPath}`);
      } catch (printError) {
        console.error(`Druckfehler bei Job ${job.id}:`, printError);
        await markFailed(job.id);
      }
    } catch (error) {
      console.error("Polling-Fehler:", error);
      await sleep(3000);
    }
  }
}

run();