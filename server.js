require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const emailjs = require('@emailjs/nodejs');

const app = express();
const PORT = process.env.PORT || 3000;

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
  limits: { fileSize: 5 * 1024 * 1024 },
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

// --- EmailJS setup ---
emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

const JOB_TITLE = process.env.JOB_TITLE || 'Software Engineer Intern';
const COMPANY_NAME = process.env.COMPANY_NAME || 'Our Company';

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

    // Respond immediately
    res.json({ ok: true, message: 'Application submitted. Confirmation email is on its way.' });

    // Send email in background
    emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      {
        to_email: email,
        first_name: firstName,
        job_title: finalJobTitle,
        company_name: finalCompanyName,
      }
    ).catch(err => {
      console.error('Email send failed:', err);
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message || 'Something went wrong.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});