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
const quoteAutocompleteCache = new Map();
const quoteAutocompleteMinChars = 2;
const quoteAutocompleteDebounceMs = 220;
const quoteRemoteMinChars = 4;
let quoteAutocompleteRequestToken = 0;
let southlandAddressHints = {
  localities: [],
  streetHints: [],
};

async function loadSouthlandAddressHints() {
  try {
    const response = await fetch("assets/data/southland-address-hints.json");
    if (!response.ok) return;

    const data = await response.json();
    if (!data || typeof data !== "object") return;

    southlandAddressHints = {
      localities: Array.isArray(data.localities) ? data.localities : [],
      streetHints: Array.isArray(data.streetHints) ? data.streetHints : [],
    };
  } catch {
    southlandAddressHints = {
      localities: [],
      streetHints: [],
    };
  }
}

loadSouthlandAddressHints();

function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function getLocalAddressSuggestions(queryText) {
  const normalizedQuery = normalizeText(queryText);
  if (normalizedQuery.length < quoteAutocompleteMinChars) return [];

  const localityMatches = southlandAddressHints.localities
    .filter(({ suburb, town }) => {
      const haystack = normalizeText(`${suburb} ${town}`);
      return haystack.includes(normalizedQuery);
    })
    .map(({ suburb, town }) => ({
      display_name: `${suburb}, ${town}, Southland, New Zealand`,
      address: {
        suburb,
        town,
        city: town,
        state: "Southland",
      },
      source: "local",
    }));

  const streetMatches = southlandAddressHints.streetHints
    .filter(({ street, suburb, town }) => {
      const haystack = normalizeText(`${street} ${suburb} ${town}`);
      return haystack.includes(normalizedQuery);
    })
    .map(({ street, suburb, town }) => ({
      display_name: `${street}, ${suburb}, ${town}, Southland, New Zealand`,
      address: {
        road: street,
        suburb,
        town,
        city: town,
        state: "Southland",
      },
      source: "local",
    }));

  const combined = [...streetMatches, ...localityMatches];
  const deduped = [];

  combined.forEach((item) => {
    const exists = deduped.some((existingItem) => normalizeText(existingItem.display_name) === normalizeText(item.display_name));
    if (!exists) {
      deduped.push(item);
    }
  });

  return deduped.slice(0, 8);
}

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
  const cachedResults = quoteAutocompleteCache.get(queryText);
  if (cachedResults) {
    return cachedResults;
  }

  const query = encodeURIComponent(`${queryText}, Southland, New Zealand`);
  const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&dedupe=1&accept-language=en-NZ&countrycodes=nz&viewbox=166.2,-45.2,169.9,-47.4&bounded=1&q=${query}`;

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
    if (!Array.isArray(results)) return [];

    const filteredResults = results.filter((result) => {
      const address = result.address || {};
      const stateText = normalizeText(address.state || address.region || "");
      return !stateText || stateText.includes("southland");
    });

    quoteAutocompleteCache.set(queryText, filteredResults);
    return filteredResults;
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

    const localSuggestions = getLocalAddressSuggestions(searchText);
    if (localSuggestions.length > 0) {
      renderAddressSuggestions(localSuggestions);
    } else {
      closeAddressSuggestions();
    }

    if (searchText.length < quoteRemoteMinChars) {
      return;
    }

    const requestToken = ++quoteAutocompleteRequestToken;
    const typedAtRequest = searchText;

    quoteAutocompleteTimer = setTimeout(async () => {
      const remoteResults = await fetchAddressSuggestions(searchText);
      if (requestToken !== quoteAutocompleteRequestToken) return;
      if (quoteAddress.value.trim() !== typedAtRequest) return;

      const latestLocalSuggestions = getLocalAddressSuggestions(typedAtRequest);
      const merged = [...localSuggestions];

      remoteResults.forEach((remoteItem) => {
        const remoteName = normalizeText(remoteItem.display_name);
        const exists = merged.some((item) => normalizeText(item.display_name) === remoteName);
        if (!exists) {
          merged.push(remoteItem);
        }
      });

      latestLocalSuggestions.forEach((localItem) => {
        const localName = normalizeText(localItem.display_name);
        const exists = merged.some((item) => normalizeText(item.display_name) === localName);
        if (!exists) {
          merged.unshift(localItem);
        }
      });

      renderAddressSuggestions(merged.slice(0, 6));
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

if (siteNav) {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  const normalizedCurrent = currentPath === "" ? "index.html" : currentPath;

  siteNav.querySelectorAll("a").forEach((navLink) => {
    const href = navLink.getAttribute("href") || "";
    const normalizedHref = href === "./" || href === "/" ? "index.html" : href;
    if (normalizedHref === normalizedCurrent) {
      navLink.classList.add("active");
      navLink.setAttribute("aria-current", "page");
    }
  });
}

