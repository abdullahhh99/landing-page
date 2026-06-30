require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Storage setup (resumes saved locally on disk) ---
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, DOC, or DOCX files are allowed'));
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Mailer setup ---
// Works with Gmail (use an App Password) or any SMTP provider.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  connectionTimeout: 10000, // 10s max to connect
  greetingTimeout: 10000,
  socketTimeout: 10000,
  family: 4 // force IPv4 — Render's free tier doesn't support outbound IPv6 to Gmail
});

const JOB_TITLE = process.env.JOB_TITLE || 'Software Engineer Intern';
const COMPANY_NAME = process.env.COMPANY_NAME || 'Our Company';

// --- Routes ---
app.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    const { firstName, lastName, email, address, jobTitle, companyName } = req.body;

    if (!firstName || !lastName || !email || !address) {
      return res.status(400).json({ ok: false, error: 'Missing required fields.' });
    }
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Resume file is required.' });
    }

    const finalJobTitle = jobTitle || JOB_TITLE;
    const finalCompanyName = companyName || COMPANY_NAME;

    // Log application (you could also write this to a JSON/CSV file or DB)
    const record = {
      firstName, lastName, email, address,
      jobTitle: finalJobTitle,
      companyName: finalCompanyName,
      resumePath: req.file.filename,
      appliedAt: new Date().toISOString()
    };
    const logFile = path.join(__dirname, 'applications.json');
    const existing = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile)) : [];
    existing.push(record);
    fs.writeFileSync(logFile, JSON.stringify(existing, null, 2));

    // Respond to the browser immediately — don't make the user wait on email delivery.
    res.json({ ok: true, message: 'Application submitted. Confirmation email is on its way.' });

    // Send confirmation email in the background (after response already sent).
    transporter.sendMail({
      from: `"${finalCompanyName}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Application Received: ${finalJobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Thanks for applying, ${firstName}!</h2>
          <p>We've received your application for the <strong>${finalJobTitle}</strong> position at ${finalCompanyName}.</p>
          <p>Our team will review your resume and get back to you if there's a good fit.</p>
          <p style="color:#888; font-size: 12px; margin-top: 30px;">
            This is a test/demo confirmation email generated automatically.
          </p>
        </div>
      `
    }).catch(err => {
      console.error('Email send failed:', err.message);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || 'Something went wrong.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});