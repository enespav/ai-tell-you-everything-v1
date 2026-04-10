const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { print } = require("pdf-to-printer");

const APP_BASE_URL = "https://ai-tell-you-everything-v1.vercel.app";
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
    const logoPath = path.join(__dirname, "public", "logo-print.png");

    const doc = new PDFDocument({
      size: [226, 900], // ca. 80mm Breite
      margins: {
        top: 18,
        bottom: 24,
        left: 18,
        right: 18,
      },
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // HEADER: Logo
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, {
        fit: [190, 90],
        align: "center",
        valign: "top",
      });
      doc.moveDown(1.4);
    } else {
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("AI TELL YOU EVERYTHING", { align: "center" });
      doc.moveDown(1);
    }

    // Abstand vor Story
    doc.moveDown(2.4);

    // STORY
    doc
      .font("Helvetica")
      .fontSize(12)
      .text(job.story, {
        align: "left",
        width: 200,
        lineGap: 4,
      });

    // Abstand vor Metadaten
    doc.moveDown(3.4);

    // METADATEN
doc.font("Helvetica").fontSize(10);

if (job.place) {
  doc.text(`Ort: ${job.place}`, {
    align: "left",
  });
}

doc.text(formatDateTime(job.created_at), {
  align: "left",
});

doc.text(`V${String(job.version).padStart(2, "0")} · ${job.session_id}`, {
  align: "left",
});

// gewünschter Weißraum nach den Metadaten
doc.y += 85;

// fast unsichtbarer Marker weit unten rechts
doc
  .font("Helvetica")
  .fontSize(10)
  .fillColor("black")
  .text(".", 195, doc.y, {
    lineBreak: false,
  });

doc.moveDown(3);

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