# Job Apply Demo Site

A minimal site for testing the "Apply to Job" flow in your Flutter app. It shows a generic
job landing page with an application form (first/last name, email, address, resume upload).
On submit, it saves the resume locally and emails the applicant a confirmation.

## 1. Install dependencies

```bash
npm install
```

## 2. Configure email + job info

Copy `.env.example` to `.env` and fill in real values:

```bash
cp .env.example .env
```

For Gmail SMTP:
1. Enable 2-Step Verification on the Google account you'll send from.
2. Create an App Password: https://myaccount.google.com/apppasswords
3. Put that 16-character password in `SMTP_PASS` (not your normal Gmail password).

You can also use any other SMTP provider (Mailtrap, SendGrid SMTP, Resend, etc.) — just
change `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` accordingly.

Set `JOB_TITLE` and `COMPANY_NAME` to whatever you want to appear on the page and in the
confirmation email (you can also just edit `public/index.html` directly for more detailed
job descriptions, or make multiple landing pages for different fake jobs).

## 3. Run it

```bash
node server.js
```

Visit http://localhost:3000 — fill out the form and submit.

## What happens on submit

- The resume file is saved to the `uploads/` folder on disk (not uploaded anywhere external).
- The application details (name, email, address, resume filename, timestamp) are appended
  to `applications.json` in the project root, so you have a record of test submissions.
- A confirmation email is sent to the address the user entered, using the SMTP credentials
  you configured.

## Connecting this to your Flutter app

In your Flutter app, when a user taps "Apply" on one of the fake jobs, just open this site's
URL (e.g., via `url_launcher` to open in an external browser, or an in-app `WebView`) — for
example `http://your-server-address:3000/?job=ID` if you want to pass through which fake job
was clicked. Currently the page shows one fixed job (configurable via `.env`); if you have
multiple fake jobs and want each to show different content/title, let me know and I can
extend it to support a `?job=` query param that swaps in different job details.

## Notes

- File uploads are limited to PDF/DOC/DOCX, max 5MB.
- This is for internal testing only — there's no authentication, and the form is open to
  anyone who can reach the server.
- Uploaded resumes and `applications.json` are git-ignored so you don't accidentally commit
  test PII.
