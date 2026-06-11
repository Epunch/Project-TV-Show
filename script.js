// Global variables to store application state
let allEpisodes = [];
let allShows = [];
const cache = new Map();

// --- VIEW MANAGEMENT ---
// Switches the interface between Shows List View and Single Show Episode View
function setView(isEpisodeView) {
  const backBtn = document.getElementById("back-to-shows-btn");
  const episodeSearch = document.getElementById("search-input");
  const episodeSelector = document.getElementById("episode-selector");
  const showSearch = document.getElementById("show-search");
  const showSelect = document.getElementById("show-select");
  const rootElem = document.getElementById("root");

  if (isEpisodeView) {
    backBtn.style.display = "inline-block";
    episodeSearch.style.display = "inline-block";
    episodeSelector.style.display = "inline-block";
    showSearch.style.display = "none";
    showSelect.style.display = "none";

    // Change root to column layout so episodes stack horizontally/wide
    rootElem.style.display = "flex";
    rootElem.style.flexDirection = "column";
    rootElem.style.gap = "20px";
  } else {
    backBtn.style.display = "none";
    episodeSearch.style.display = "none";
    episodeSelector.style.display = "none";
    showSearch.style.display = "inline-block";
    showSelect.style.display = "inline-block";

    // Reset root layout back to your normal CSS grid for normal show view
    rootElem.style.display = "";
    rootElem.style.flexDirection = "";

    // Clear search values when returning to show view
    showSearch.value = "";
    episodeSearch.value = "";
  }
}

// --- RENDER FUNCTIONS ---
// Generates and inserts show cards using your default/normal CSS layout
function renderShows(shows) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  const countElement = document.getElementById("show-count");
  if (countElement) {
    countElement.textContent = `found ${shows.length} shows`;
  }

  if (shows.length === 0) {
    rootElem.innerHTML =
      "<p class='no-results'>No shows match your search criteria.</p>";
    return;
  }

  shows.forEach((show) => {
    const card = document.createElement("article");
    card.classList.add("show-card");
    card.dataset.showId = show.id;
    card.innerHTML = `
      <h2>${show.name}</h2>
      <img src="${show.image?.medium || ""}" alt="${show.name}">
      <p><strong>Genres:</strong> ${show.genres?.join(" | ") || "N/A"}</p>
      <p><strong>Status:</strong> ${show.status}</p>
      <p><strong>Rating:</strong> ${show.rating?.average || "N/A"}</p>
      <div class="summary">${show.summary || "No summary available."}</div>
    `;
    rootElem.appendChild(card);
  });
}

// Generates and inserts episode cards horizontally using custom styles
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  if (episodeList.length === 0) {
    rootElem.innerHTML =
      "<p class='no-results'>No episodes match your search criteria.</p>";
    return;
  }

  episodeList.forEach((ep) => {
    const card = document.createElement("article");
    card.classList.add("episode-card");
    const code = `S${String(ep.season).padStart(2, "0")}E${String(ep.number).padStart(2, "0")}`;
    card.id = code;

    // Apply horizontal styles directly to the episode card container
    card.style.display = "block";
    card.style.width = "100%";
    card.style.boxSizing = "border-box";
    card.style.padding = "20px";

    // Horizontal layout inside the dark theme card for the episode
    card.innerHTML = `
      <h2 style="margin-top: 0; margin-bottom: 15px; font-size: 1.6rem; border-bottom: 1px solid #333; padding-bottom: 5px;">
        ${ep.name} - ${code}
      </h2>
      <div style="display: flex; flex-direction: row; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
        <div style="flex: 0 0 200px;">
          <img src="${ep.image?.medium || ""}" alt="${ep.name}" style="width: 100%; height: auto; object-fit: cover; border-radius: 4px;">
        </div>
        <div style="flex: 3 1 300px; font-size: 1rem; line-height: 1.5;">
          <div>${ep.summary || "No summary available."}</div>
        </div>
        <div style="flex: 1 1 150px; padding: 10px; border-left: 1px solid #333; min-width: 150px;">
          <p style="margin: 4px 0;"><strong>Season:</strong> ${ep.season}</p>
          <p style="margin: 4px 0;"><strong>Episode:</strong> ${ep.number}</p>
          <p style="margin: 4px 0;"><strong>Runtime:</strong> ${ep.runtime || "N/A"} min</p>
        </div>
      </div>
    `;
    rootElem.appendChild(card);
  });
}

// --- POPULATE SELECTORS ---
function populateEpisodeSelector(episodes) {
  const selector = document.getElementById("episode-selector");
  selector.innerHTML = '<option value="">Select an episode...</option>';
  episodes.forEach((ep) => {
    const code = `S${String(ep.season).padStart(2, "0")}E${String(ep.number).padStart(2, "0")}`;
    const option = document.createElement("option");
    option.value = code;
    option.textContent = `${code} - ${ep.name}`;
    selector.appendChild(option);
  });
}

// --- DATA FETCHING ---
async function fetchShows() {
  const url = "https://api.tvmaze.com/shows";
  try {
    const response = await fetch(url);
    allShows = await response.json();

    allShows.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );

    renderShows(allShows);

    const selector = document.getElementById("show-select");
    selector.innerHTML = '<option value="">-- Select a show --</option>';
    allShows.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name;
      selector.appendChild(opt);
    });
  } catch (error) {
    console.error("Error fetching shows:", error);
  }
}

async function fetchEpisodes(showId) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "<p>Loading episodes...</p>";
  const url = `https://api.tvmaze.com/shows/${showId}/episodes`;

  if (cache.has(url)) {
    allEpisodes = cache.get(url);
  } else {
    try {
      const response = await fetch(url);
      allEpisodes = await response.json();
      cache.set(url, allEpisodes);
    } catch (error) {
      rootElem.innerHTML = `<p style="color: red;">Failed to load episodes.</p>`;
      return;
    }
  }
  makePageForEpisodes(allEpisodes);
  populateEpisodeSelector(allEpisodes);
}

// --- EVENT LISTENERS ---
document.getElementById("root").addEventListener("click", (e) => {
  const card = e.target.closest(".show-card");
  if (card) {
    const show = allShows.find((s) => s.id == card.dataset.showId);
    if (show) {
      const heroTitle = document.querySelector(".hero-section h1");
      const heroSummary = document.querySelector(".hero-summary");
      if (heroTitle) heroTitle.textContent = show.name;
      if (heroSummary)
        heroSummary.textContent = show.summary?.replace(/<[^>]*>/g, "") || "";
      fetchEpisodes(show.id);
      setView(true);
    }
  }
});

document.getElementById("show-search").addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase().trim();

  const filteredShows = allShows.filter((show) => {
    const cleanSummary = show.summary
      ? show.summary.replace(/<[^>]*>/g, "").toLowerCase()
      : "";
    const cleanName = show.name ? show.name.toLowerCase() : "";
    const cleanGenres = show.genres ? show.genres.join(" ").toLowerCase() : "";

    return (
      cleanName.includes(term) ||
      cleanSummary.includes(term) ||
      cleanGenres.includes(term)
    );
  });

  renderShows(filteredShows);
});

document.getElementById("search-input").addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase().trim();
  const filteredEpisodes = allEpisodes.filter((ep) => {
    const cleanSummary = ep.summary
      ? ep.summary.replace(/<[^>]*>/g, "").toLowerCase()
      : "";
    return ep.name.toLowerCase().includes(term) || cleanSummary.includes(term);
  });
  makePageForEpisodes(filteredEpisodes);
});

document.getElementById("episode-selector").addEventListener("change", (e) => {
  const selectedCode = e.target.value;

  if (selectedCode === "") {
    makePageForEpisodes(allEpisodes);
  } else {
    const singleEpisode = allEpisodes.filter((ep) => {
      const code = `S${String(ep.season).padStart(2, "0")}E${String(ep.number).padStart(2, "0")}`;
      return code === selectedCode;
    });
    makePageForEpisodes(singleEpisode);
  }
});

document.getElementById("show-select").addEventListener("change", (e) => {
  const id = e.target.value;
  if (!id) return;
  const show = allShows.find((s) => s.id == id);
  if (show) {
    const heroTitle = document.querySelector(".hero-section h1");
    const heroSummary = document.querySelector(".hero-summary");
    if (heroTitle) heroTitle.textContent = show.name;
    if (heroSummary)
      heroSummary.textContent = show.summary?.replace(/<[^>]*>/g, "") || "";
    fetchEpisodes(id);
    setView(true);
  }
});

document.getElementById("back-to-shows-btn").addEventListener("click", () => {
  renderShows(allShows);
  setView(false);
});

window.onload = fetchShows;
