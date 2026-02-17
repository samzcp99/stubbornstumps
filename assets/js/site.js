const FORMSPREE_ENDPOINT = "https://formspree.io/f/your-form-id";

async function handleQuoteSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const status = document.getElementById("quote-status");
  const submitButton = document.getElementById("quote-submit");

  if (!FORMSPREE_ENDPOINT || FORMSPREE_ENDPOINT.includes("your-form-id")) {
    status.textContent = "Please set your real Formspree endpoint in assets/js/site.js.";
    status.style.color = "#F97316";
    return false;
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
    return true;
  } catch (error) {
    status.textContent = "Unable to submit right now. Please try again or call us.";
    status.style.color = "#F97316";
    return false;
  } finally {
    submitButton.disabled = false;
  }
}

const quoteForm = document.getElementById("quote-form");
const quoteAddress = document.getElementById("quote-address");
const quoteSuggestions = document.getElementById("quote-suggestions");
const quoteSuburb = document.getElementById("quote-suburb");
const quoteTown = document.getElementById("quote-town");
let quoteAutocompleteTimer = null;
let quoteAutocompleteResults = [];
let quoteActiveSuggestionIndex = -1;
let quoteAutocompleteAbortController = null;
const quoteAutocompleteMinChars = 2;
const quoteAutocompleteDebounceMs = 90;

function closeAddressSuggestions() {
  if (!quoteSuggestions) return;
  quoteSuggestions.innerHTML = "";
  quoteSuggestions.classList.remove("active");
  if (quoteAddress) {
    quoteAddress.setAttribute("aria-expanded", "false");
  }
  quoteAutocompleteResults = [];
  quoteActiveSuggestionIndex = -1;
}

function applyAddressSelection(addressDisplay, addressData) {
  if (!quoteAddress || !quoteSuburb || !quoteTown) return;

  const suburb = addressData.suburb || addressData.neighbourhood || addressData.hamlet || addressData.village || "";
  const town = addressData.city || addressData.town || addressData.village || addressData.county || "";

  quoteAddress.value = addressDisplay;
  quoteSuburb.value = suburb;
  quoteTown.value = town;
  closeAddressSuggestions();
}

function renderAddressSuggestions(results) {
  if (!quoteSuggestions) return;

  closeAddressSuggestions();

  if (!Array.isArray(results) || results.length === 0) return;

  quoteAutocompleteResults = results.slice(0, 5);

  quoteAutocompleteResults.forEach((result, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quote-suggestion-item";
    button.textContent = result.display_name;
    button.setAttribute("role", "option");
    button.setAttribute("data-index", String(index));
    button.addEventListener("mouseenter", () => {
      setActiveSuggestion(index);
    });
    button.addEventListener("click", () => {
      applyAddressSelection(result.display_name, result.address || {});
    });
    quoteSuggestions.appendChild(button);
  });

  setActiveSuggestion(0);

  quoteSuggestions.classList.add("active");
  if (quoteAddress) {
    quoteAddress.setAttribute("aria-expanded", "true");
  }
}

function setActiveSuggestion(index) {
  if (!quoteSuggestions) return;

  const items = Array.from(quoteSuggestions.querySelectorAll(".quote-suggestion-item"));
  if (items.length === 0) return;

  quoteActiveSuggestionIndex = index;

  items.forEach((item, itemIndex) => {
    if (itemIndex === quoteActiveSuggestionIndex) {
      item.classList.add("active");
      return;
    }
    item.classList.remove("active");
  });
}

function selectActiveSuggestion() {
  if (quoteActiveSuggestionIndex < 0 || quoteActiveSuggestionIndex >= quoteAutocompleteResults.length) {
    return false;
  }

  const selected = quoteAutocompleteResults[quoteActiveSuggestionIndex];
  if (!selected) return false;

  applyAddressSelection(selected.display_name, selected.address || {});
  return true;
}

async function fetchAddressSuggestions(queryText) {
  const query = encodeURIComponent(`${queryText}, Southland, New Zealand`);
  const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=nz&q=${query}`;

  try {
    if (quoteAutocompleteAbortController) {
      quoteAutocompleteAbortController.abort();
    }
    quoteAutocompleteAbortController = new AbortController();

    const response = await fetch(endpoint, {
      signal: quoteAutocompleteAbortController.signal,
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) return [];
    const results = await response.json();
    return Array.isArray(results) ? results : [];
  } catch {
    return [];
  } finally {
    quoteAutocompleteAbortController = null;
  }
}

if (quoteAddress && quoteSuburb && quoteTown && quoteSuggestions) {
  quoteAddress.addEventListener("input", () => {
    quoteSuburb.value = "";
    quoteTown.value = "";
    quoteActiveSuggestionIndex = -1;

    const searchText = quoteAddress.value.trim();
    if (quoteAutocompleteTimer) {
      clearTimeout(quoteAutocompleteTimer);
    }

    if (searchText.length < quoteAutocompleteMinChars) {
      closeAddressSuggestions();
      return;
    }

    quoteAutocompleteTimer = setTimeout(async () => {
      const results = await fetchAddressSuggestions(searchText);
      renderAddressSuggestions(results);
    }, quoteAutocompleteDebounceMs);
  });

  quoteAddress.addEventListener("keydown", (event) => {
    const isOpen = quoteSuggestions.classList.contains("active");
    if (!isOpen) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = Math.min(quoteActiveSuggestionIndex + 1, quoteAutocompleteResults.length - 1);
      setActiveSuggestion(nextIndex);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const prevIndex = Math.max(quoteActiveSuggestionIndex - 1, 0);
      setActiveSuggestion(prevIndex);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      selectActiveSuggestion();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeAddressSuggestions();
    }
  });

  document.addEventListener("click", (event) => {
    if (!quoteSuggestions.contains(event.target) && event.target !== quoteAddress) {
      closeAddressSuggestions();
    }
  });
}

if (quoteForm) {
  quoteForm.addEventListener("submit", async (event) => {
    const status = document.getElementById("quote-status");

    if (quoteSuburb && quoteTown && (!quoteSuburb.value || !quoteTown.value)) {
      event.preventDefault();
      if (status) {
        status.textContent = "Please select an address suggestion before submitting.";
        status.style.color = "#F97316";
      }
      return;
    }

    const isSuccess = await handleQuoteSubmit(event);
    if (isSuccess && quoteSuburb && quoteTown && quoteAddress) {
      quoteSuburb.value = "";
      quoteTown.value = "";
      quoteAddress.value = "";
      closeAddressSuggestions();
    }
  });
}

const menuToggle = document.querySelector(".menu-toggle");
const siteHeader = document.querySelector(".site-header");
const siteNav = document.getElementById("site-nav");

if (menuToggle && siteHeader && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteHeader.classList.toggle("nav-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteHeader.classList.remove("nav-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
    });
  });
}

