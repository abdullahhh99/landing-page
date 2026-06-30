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
