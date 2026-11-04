const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function offerTemplateText(html) {
  return String(html || "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function generateOfferPdf(offer, candidate) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const dir = path.join(__dirname, "../uploads/letters");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `offer-${offer._id}-v1.pdf`;
    const filepath = path.join(dir, filename);
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    if (offer.templateContent) {
      const placeholders = offer.placeholders || {};
      const content = offer.templateContent.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_token, key) => {
        const value = placeholders[key];
        return value == null ? "" : String(value);
      });
      doc.font("Helvetica").fontSize(11).text(offerTemplateText(content), {
        width: 495,
        lineGap: 3,
      });
    } else {
      doc.fontSize(20).text("OFFER LETTER", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString("en-IN")}`);
      doc.moveDown();
      doc.text(`Dear ${candidate.name || "Candidate"},`);
      doc.moveDown();
      doc.text(
        `We are pleased to offer you the position of ${offer.designation} (${
          offer.offerType === "intern" ? "Intern" : "Full-time Employee"
        }).`
      );
      doc.moveDown();
      doc.text(`Annual Compensation: Rs. ${Number(offer.salary || 0).toLocaleString("en-IN")}`);
      doc.text(`Joining Date: ${offer.joiningDate ? new Date(offer.joiningDate).toLocaleDateString("en-IN") : "To be confirmed"}`);
      if (offer.expiryDate) {
        doc.text(`Offer Valid Until: ${new Date(offer.expiryDate).toLocaleDateString("en-IN")}`);
      }
      doc.moveDown();
      doc.text("Please review and accept this offer by logging into your candidate portal.");
      doc.moveDown();
      if (offer.requiredDocuments && offer.requiredDocuments.length) {
        doc.fontSize(14).text("Documents Required for Acceptance:", { underline: true });
        doc.moveDown(0.5);
        offer.requiredDocuments.forEach((d, i) => {
          doc.fontSize(11).text(`${i + 1}. ${d.label}${d.required ? " (Required)" : " (Optional)"}`);
        });
        doc.moveDown();
        doc.fontSize(11).text("Please upload signed copy of this offer letter along with the above documents to accept the offer.");
      }
      doc.moveDown(2);
      doc.fontSize(12).text("Sincerely,");
      doc.text("HR Team");
    }

    doc.end();
    stream.on("finish", () => resolve(`/uploads/letters/${filename}`));
    stream.on("error", reject);
  });
}

async function generateLetterPdf(letter, employee) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const dir = path.join(__dirname, "../uploads/letters");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `letter-${letter._id}-v${letter.version || 1}.pdf`;
    const filepath = path.join(dir, filename);
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    const p = letter.placeholders || {};
    doc.font("Helvetica-Bold").fontSize(20).text(String(letter.title || "HR LETTER").toUpperCase(), { align: "center" });
    doc.moveDown(2);
    doc.font("Helvetica").fontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`);
    doc.text(`Employee ID: ${p.empId || employee?.empId || "N/A"}`);
    doc.moveDown();
    doc.text(`Dear ${p.name || employee?.name || "Employee"},`);
    doc.moveDown();

    if (letter.type === "experience") {
      doc.text(
        `This letter confirms that ${p.name || employee?.name || "the employee"} was associated with our organization as ${p.designation || employee?.designation || "N/A"} in the ${p.department || employee?.department || "N/A"} department.`
      );
      doc.moveDown();
      doc.text(
        `The recorded joining date is ${p.joiningDate ? new Date(p.joiningDate).toLocaleDateString("en-IN") : "not available"}. We appreciate the employee's contribution to the organization.`
      );
    } else {
      doc.text(
        `This letter has been generated for ${p.name || employee?.name || "the employee"} regarding ${letter.title}.`
      );
    }
    doc.moveDown(2);
    doc.text("Sincerely,");
    doc.text("HR Department");

    doc.end();
    stream.on("finish", () => resolve(`/uploads/letters/${filename}`));
    stream.on("error", reject);
  });
}

module.exports = { generateOfferPdf, generateLetterPdf };
