// --- Populate job title/company from URL query params ---
// Your Flutter app should open this page like:
// http://yourserver:3000/?title=Backend%20Developer%20Intern&company=Acme%20Inc
const params = new URLSearchParams(window.location.search);
const jobTitle = params.get('title') || 'Software Engineer Intern';
const companyName = params.get('company') || 'Demo Company';
const jobDescription = params.get('description');

document.getElementById('pageTitle').textContent = `${jobTitle} — Apply Now`;
document.getElementById('jobTitle').textContent = jobTitle;
document.getElementById('companyName').textContent = `We're hiring — ${companyName}`;
document.getElementById('hiddenJobTitle').value = jobTitle;
document.getElementById('hiddenCompanyName').value = companyName;

if (jobDescription) {
  document.getElementById('jobDescription').textContent = jobDescription;
} else {
  document.getElementById('jobTitleInline').textContent = jobTitle;
}

const form = document.getElementById('applyForm');
const msg = document.getElementById('formMessage');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  msg.textContent = '';
  msg.className = 'form-message';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  const formData = new FormData(form);

  try {
    const res = await fetch('/apply', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.ok) {
      msg.textContent = 'Application submitted! Check your email for confirmation.';
      msg.classList.add('success');
      form.reset();
    } else {
      msg.textContent = data.error || 'Something went wrong. Please try again.';
      msg.classList.add('error');
    }
  } catch (err) {
    msg.textContent = 'Network error. Please try again.';
    msg.classList.add('error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Application';
  }
});