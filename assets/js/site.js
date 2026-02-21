const LOCAL_QUOTE_ENDPOINT = "api/quote.php";
const FORMSPREE_ENDPOINT = "";

function hasFormspreeFallback() {
  return Boolean(FORMSPREE_ENDPOINT) && !FORMSPREE_ENDPOINT.includes("your-form-id");
}

async function handleQuoteSubmit(event) {
  event.preventDefault();

  const form = event.currentTarget;
  const status = document.getElementById("quote-status");
  const submitButton = document.getElementById("quote-submit");

  submitButton.disabled = true;
  status.textContent = "Submitting...";
  status.style.color = "#475569";

  const submitToEndpoint = async (endpointUrl) => {
    const formData = new FormData(form);
    const response = await fetch(endpointUrl, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    });

    let responseBody = null;
    let responseText = "";
    try {
      responseBody = await response.json();
    } catch {
      responseText = await response.text().catch(() => "");
    }

    return {
      ok: response.ok && (!responseBody || responseBody.ok !== false),
      message: responseBody && typeof responseBody.message === "string" ? responseBody.message : "",
      status: response.status,
      textPreview: responseText ? responseText.slice(0, 120) : "",
    };
  };

  try {
    let submitResult = await submitToEndpoint(LOCAL_QUOTE_ENDPOINT);
    if (!submitResult.ok && hasFormspreeFallback()) {
      submitResult = await submitToEndpoint(FORMSPREE_ENDPOINT);
    }
    if (!submitResult.ok) {
      if (submitResult.message) {
        throw new Error(submitResult.message);
      }

      if (submitResult.status === 404) {
        throw new Error("Quote API not found (404). Please check server path /api/quote.php and Nginx config.");
      }

      if (submitResult.status === 413) {
        throw new Error("Upload is too large for the server. Reduce photo size/count and try again.");
      }

      if (submitResult.status >= 500) {
        throw new Error("Server error while processing quote. Please check PHP-FPM, SQLite extension, and storage permissions.");
      }

      if (submitResult.textPreview.includes("<html") || submitResult.textPreview.includes("<!doctype")) {
        throw new Error("Server returned an HTML error page. Please verify Nginx PHP routing for /api/quote.php.");
      }

      throw new Error("Submit failed");
    }

    form.reset();
    status.textContent = "Thanks! Your quote request was sent successfully. Redirecting...";
    status.style.color = "#1F7A63";
    window.setTimeout(() => {
      window.location.href = "thank-you.html";
    }, 900);
    return true;
  } catch (error) {
    status.textContent = error instanceof Error && error.message ? error.message : "Unable to submit right now. Please try again or call us.";
    status.style.color = "#F97316";
    return false;
  } finally {
    submitButton.disabled = false;
  }
}

const quoteForm = document.getElementById("quote-form");
const quoteAddress = document.getElementById("quote-address");
const quoteUseLocationButton = document.getElementById("quote-use-location");
const quoteSuggestions = document.getElementById("quote-suggestions");
const quoteSuburb = document.getElementById("quote-suburb");
const quoteTown = document.getElementById("quote-town");
const quoteDescription = quoteForm ? quoteForm.querySelector('textarea[name="description"]') : null;
const quoteStartedAt = document.getElementById("quote-started-at");
let quoteAutocompleteTimer = null;
let quoteAutocompleteResults = [];
let quoteActiveSuggestionIndex = -1;
let quoteAutocompleteAbortController = null;
const quoteAutocompleteCache = new Map();
const quoteAutocompleteMinChars = 2;
const quoteAutocompleteDebounceMs = 130;
const quoteRemoteMinChars = 3;
const quoteMaxPhotoCount = 8;
const quoteMaxPhotoBytesPerFile = 10 * 1024 * 1024;
const quoteMaxPhotoBytesTotal = 30 * 1024 * 1024;
let quoteAutocompleteRequestToken = 0;
let southlandAddressHints = {
  localities: [],
  streetHints: [],
};
let quoteSuggestionTouchSelecting = false;

if (quoteStartedAt) {
  quoteStartedAt.value = String(Date.now());
}

function toMegabytes(bytes) {
  return `${Math.round((bytes / (1024 * 1024)) * 10) / 10}MB`;
}

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

async function reverseGeocodeCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Invalid device location.");
  }

  const endpoint = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=en-NZ&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to look up your address from location.");
  }

  const result = await response.json();
  if (!result || typeof result !== "object") {
    throw new Error("No address found for your location.");
  }

  return result;
}

function buildAddressDisplayFromReverse(result) {
  const address = (result && result.address) || {};
  const streetLine = [address.house_number, address.road].filter(Boolean).join(" ").trim();
  const suburb = address.suburb || address.neighbourhood || address.hamlet || address.village || "";
  const town = address.city || address.town || address.village || address.county || "";

  const compactLine = [streetLine, suburb, town, "Southland", "New Zealand"].filter(Boolean).join(", ");
  if (compactLine) {
    return compactLine;
  }

  return result.display_name || "";
}

function getGeolocationErrorMessage(error) {
  if (!error) {
    return "Could not get your location. Please type your address manually.";
  }

  if (error.code === 1) {
    return "Location permission was denied. Please allow location access or type your address manually.";
  }

  if (error.code === 2) {
    return "Location is unavailable right now. Please try again or type your address manually.";
  }

  if (error.code === 3) {
    return "Location request timed out. Please try again or type your address manually.";
  }

  return "Could not get your location. Please type your address manually.";
}

function moveToQuoteDescriptionField() {
  if (!quoteDescription) return;

  try {
    quoteDescription.focus({ preventScroll: true });
  } catch {
    quoteDescription.focus();
  }

  quoteDescription.scrollIntoView({ block: "center", behavior: "auto" });
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
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      quoteSuggestionTouchSelecting = true;
      applyAddressSelection(result.display_name, result.address || {});
      window.setTimeout(() => {
        quoteSuggestionTouchSelecting = false;
      }, 0);
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
    if (quoteSuggestionTouchSelecting) {
      return;
    }
    if (!quoteSuggestions.contains(event.target) && event.target !== quoteAddress) {
      closeAddressSuggestions();
    }
  });
}

if (quoteUseLocationButton && quoteAddress && quoteSuburb && quoteTown) {
  quoteUseLocationButton.addEventListener("click", () => {
    const status = document.getElementById("quote-status");

    if (!window.isSecureContext) {
      if (status) {
        status.textContent = "Location needs HTTPS or localhost. Please type your address manually.";
        status.style.color = "#F97316";
      }
      return;
    }

    if (!navigator.geolocation) {
      if (status) {
        status.textContent = "This browser does not support location access. Please type your address manually.";
        status.style.color = "#F97316";
      }
      return;
    }

    quoteUseLocationButton.disabled = true;
    if (status) {
      status.textContent = "Getting your location...";
      status.style.color = "#475569";
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position && position.coords ? position.coords.latitude : null;
          const longitude = position && position.coords ? position.coords.longitude : null;
          const reverseResult = await reverseGeocodeCoordinates(latitude, longitude);
          const addressInfo = reverseResult.address || {};
          const addressDisplay = buildAddressDisplayFromReverse(reverseResult);

          const suburb = addressInfo.suburb || addressInfo.neighbourhood || addressInfo.hamlet || addressInfo.village || "";
          const town = addressInfo.city || addressInfo.town || addressInfo.village || addressInfo.county || "";

          if (!addressDisplay || !suburb || !town) {
            throw new Error("We found your location but could not fill a complete Southland address.");
          }

          applyAddressSelection(addressDisplay, {
            ...addressInfo,
            suburb,
            town,
            city: town,
          });

          if (status) {
            status.textContent = "Address filled from your current location.";
            status.style.color = "#1F7A63";
          }

          moveToQuoteDescriptionField();
        } catch (error) {
          if (status) {
            status.textContent = error instanceof Error && error.message
              ? error.message
              : "Could not fill address from current location. Please type and choose a suggestion.";
            status.style.color = "#F97316";
          }
        } finally {
          quoteUseLocationButton.disabled = false;
        }
      },
      (error) => {
        if (status) {
          status.textContent = getGeolocationErrorMessage(error);
          status.style.color = "#F97316";
        }
        quoteUseLocationButton.disabled = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 300000,
      },
    );
  });
}

if (quoteForm) {
  quoteForm.addEventListener("submit", async (event) => {
    const status = document.getElementById("quote-status");
    const photoInput = quoteForm.querySelector('input[name="photos"]');

    if (quoteSuburb && quoteTown && (!quoteSuburb.value || !quoteTown.value)) {
      event.preventDefault();
      if (status) {
        status.textContent = "Please select an address suggestion before submitting.";
        status.style.color = "#F97316";
      }
      return;
    }

    if (photoInput && photoInput.files && photoInput.files.length > 0) {
      const selectedFiles = Array.from(photoInput.files);

      if (selectedFiles.length > quoteMaxPhotoCount) {
        event.preventDefault();
        if (status) {
          status.textContent = `Please upload up to ${quoteMaxPhotoCount} photos.`;
          status.style.color = "#F97316";
        }
        return;
      }

      const oversizedFile = selectedFiles.find((file) => file.size > quoteMaxPhotoBytesPerFile);
      if (oversizedFile) {
        event.preventDefault();
        if (status) {
          status.textContent = `Each photo must be under ${toMegabytes(quoteMaxPhotoBytesPerFile)}.`;
          status.style.color = "#F97316";
        }
        return;
      }

      const totalSize = selectedFiles.reduce((accumulator, file) => accumulator + file.size, 0);
      if (totalSize > quoteMaxPhotoBytesTotal) {
        event.preventDefault();
        if (status) {
          status.textContent = `Total upload size must be under ${toMegabytes(quoteMaxPhotoBytesTotal)}.`;
          status.style.color = "#F97316";
        }
        return;
      }
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

