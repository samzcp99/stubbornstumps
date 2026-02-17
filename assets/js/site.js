const FORMSPREE_ENDPOINT = "https://formspree.io/f/your-form-id";

async function handleQuoteSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const status = document.getElementById("quote-status");
  const submitButton = document.getElementById("quote-submit");

  if (!FORMSPREE_ENDPOINT || FORMSPREE_ENDPOINT.includes("your-form-id")) {
    status.textContent = "Please set your real Formspree endpoint in assets/js/site.js.";
    status.style.color = "#F97316";
    return;
  }

  submitButton.disabled = true;
  status.textContent = "Submitting...";
  status.style.color = "#475569";

  const formData = new FormData(form);

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error("Submit failed");

    form.reset();
    status.textContent = "Thanks! Your quote request was sent successfully.";
    status.style.color = "#1F7A63";
  } catch (error) {
    status.textContent = "Unable to submit right now. Please try again or call us.";
    status.style.color = "#F97316";
  } finally {
    submitButton.disabled = false;
  }
}

const quoteForm = document.getElementById("quote-form");
if (quoteForm) {
  quoteForm.addEventListener("submit", handleQuoteSubmit);
}
