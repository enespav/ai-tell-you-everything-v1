/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { print } = require("pdf-to-printer");

const APP_BASE_URL = "https://ai-tell-you-everything.de";
const PRINTER_NAME = "EPSON TM-T88V Receipt5";
const SESSION_PREFIX_SEPARATOR = "::";
const RECEIPT_ARCHIVE_DIR = path.join(__dirname, "receipt-archive");

function getReceiptDateFolder(dateString) {
  const date = new Date(dateString);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} · ${hours}:${minutes}`;
}

function detectLanguage(text) {
  const value = ` ${(text || "").toLowerCase()} `;
  const germanSignals = [
    " ich ",
    " und ",
    " der ",
    " die ",
    " das ",
    " nicht ",
    " mit ",
    " ä ",
    " ö ",
    " ü ",
    " ß ",
  ];

  return germanSignals.some((signal) => value.includes(signal)) ? "de" : "en";
}

function parseSessionValue(sessionValue, story) {
  if (typeof sessionValue === "string" && sessionValue.includes(SESSION_PREFIX_SEPARATOR)) {
    const [language, ...speakerParts] = sessionValue.split(SESSION_PREFIX_SEPARATOR);
    const speaker = speakerParts.join(SESSION_PREFIX_SEPARATOR);

    if (language === "de" || language === "en") {
      return { language, speaker };
    }
  }

  return {
    language: detectLanguage(story),
    speaker: typeof sessionValue === "string" ? sessionValue : "",
  };
}

function labelsForLanguage(language) {
  if (language === "de") {
    return {
      place: "Ort",
      speaker: "Sagt",
      anonymous: "anonym",
    };
  }

  return {
    place: "Place",
    speaker: "Says",
    anonymous: "anonymous",
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchNextJob() {
  const response = await fetch(`${APP_BASE_URL}/api/print-jobs/next`);
  const rawText = await response.text();
  let data;

  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(
      `GET /api/print-jobs/next returned invalid JSON (${response.status} ${response.statusText}): ${rawText.slice(0, 500)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `GET /api/print-jobs/next failed (${response.status} ${response.statusText}): ${data.error || rawText}`
    );
  }

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
    const receiptDir = path.join(
      RECEIPT_ARCHIVE_DIR,
      getReceiptDateFolder(job.created_at)
    );
    const filePath = path.join(receiptDir, `receipt-${job.id}.pdf`);
    const logoPath = path.join(__dirname, "public", "logo-print.png");
    const sessionData = parseSessionValue(job.session_id, job.story);
    const labels = labelsForLanguage(sessionData.language);
    let pageCount = 1;

    const doc = new PDFDocument({
      size: [226, 900],
      margins: {
        top: 18,
        bottom: 24,
        left: 18,
        right: 18,
      },
    });

    fs.mkdirSync(receiptDir, { recursive: true });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.on("pageAdded", () => {
      pageCount += 1;
    });

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, {
        fit: [190, 90],
        align: "center",
        valign: "top",
      });
      doc.moveDown(2.0);
    } else {
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("AI TELL YOU EVERYTHING", { align: "center" });
      doc.moveDown(1.6);
    }

    doc.moveDown(3.0);

    doc.font("Helvetica").fontSize(13).text(job.story, {
      align: "left",
      width: 200,
      lineGap: 5,
    });

    doc.moveDown(4.2);
    doc.font("Helvetica").fontSize(10);

    if (job.place) {
      doc.text(`${labels.place}: ${job.place}`, {
        align: "left",
      });
    }

    if (
      sessionData.speaker &&
      sessionData.speaker !== labels.anonymous &&
      sessionData.speaker !== "anonym" &&
      sessionData.speaker !== "anonymous"
    ) {
      doc.text(`${labels.speaker}: ${sessionData.speaker}`, {
        align: "left",
      });
    }

    if (
      job.place ||
      (sessionData.speaker &&
        sessionData.speaker !== "anonym" &&
        sessionData.speaker !== "anonymous")
    ) {
      doc.moveDown(0.6);
    }

    doc.text(formatDateTime(job.created_at), {
      align: "left",
    });

    doc.text(`V${String(job.version).padStart(2, "0")}`, {
      align: "left",
    });

    doc.y += 110;

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("black")
      .text(".", 195, doc.y, {
        lineBreak: false,
      });

    doc.moveDown(3);
    doc.end();

    stream.on("finish", () => {
      console.log(`PDF fuer Job ${job.id}: ${pageCount} Seite(n)`);
      resolve(filePath);
    });
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
      console.log("Empfangene Story:", {
        id: job.id,
        storyLength: typeof job.story === "string" ? job.story.length : 0,
        story: job.story,
      });

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
      console.error("Print-client polling error:", error);
      await sleep(3000);
    }
  }
}

run().catch((error) => {
  console.error("Print-Client unerwartet beendet:", error);
  process.exitCode = 1;
});
