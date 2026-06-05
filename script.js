// Global variable to store all fetched episodes
let allEpisodes = [];
let allShows = [];
let currentShowId = null;
const cache = new Map();

// 1. Define the functions responsible for updating the UI
// These are declared first so the fetch function can utilize them.

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ""; // Clear existing content

  episodeList.forEach((episode) => {
    const cardElement = document.createElement("article");
    cardElement.classList.add("episode-card");

    // Format the season and episode numbers to have leading zeros
    const paddedSeason = String(episode.season).padStart(2, "0");
    const paddedEpisode = String(episode.number).padStart(2, "0");
    const episodeCode = `S${paddedSeason}E${paddedEpisode}`;

    cardElement.id = episodeCode;

    const titleElement = document.createElement("h2");
    titleElement.textContent = `${episode.name} - ${episodeCode}`;

    const imageElement = document.createElement("img");
    imageElement.src = episode.image ? episode.image.medium : "";
    imageElement.alt = `Screenshot from the episode: ${episode.name}`;

    const summaryElement = document.createElement("div");
    summaryElement.classList.add("episode-summary");
    summaryElement.innerHTML = episode.summary;

    // Append all elements to the card, then the card to the root container
    cardElement.appendChild(titleElement);
    cardElement.appendChild(imageElement);
    cardElement.appendChild(summaryElement);

    rootElem.appendChild(cardElement);
  });
}

function populateEpisodeSelector() {
  const selector = document.getElementById("episode-selector");
  selector.innerHTML = ""; // Clear existing dropdown options

  allEpisodes.forEach(function (episode) {
    const option = document.createElement("option");
    const paddedSeason = String(episode.season).padStart(2, "0");
    const paddedEpisode = String(episode.number).padStart(2, "0");
    const episodeCode = `S${paddedSeason}E${paddedEpisode}`;

    option.value = episodeCode;
    option.textContent = `${episodeCode} - ${episode.name}`;
    selector.appendChild(option);
  });
}

// 2. Define the asynchronous function to fetch data from the API
async function fetchEpisodes(showId) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "<p>Loading episodes, please wait...</p>";

  const url = `https://api.tvmaze.com/shows/${showId}/episodes`;

  // Return cached data if available (requirement 6)
  if (cache.has(url)) {
    allEpisodes = cache.get(url);
    makePageForEpisodes(allEpisodes);
    populateEpisodeSelector();
    document.getElementById("episode-count").textContent =
      `Showing ${allEpisodes.length} of ${allEpisodes.length} episodes`;
    return;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    allEpisodes = await response.json();
    cache.set(url, allEpisodes); // Store in cache

    makePageForEpisodes(allEpisodes);
    populateEpisodeSelector();
    document.getElementById("episode-count").textContent =
      `Showing ${allEpisodes.length} of ${allEpisodes.length} episodes`;
  } catch (error) {
    rootElem.innerHTML = `<p style="color: red;">Failed to load episodes: ${error.message}</p>`;
  }
}

// 3. Define the handlers for the search input and dropdown selector
function handleSearch() {
  const searchTerm = document
    .getElementById("search-input")
    .value.toLowerCase();

  const matchingEpisodes = allEpisodes.filter(function (episode) {
    // Generate the episode code in lowercase for matching (e.g., "s01e01")
    const paddedSeason = String(episode.season).padStart(2, "0");
    const paddedEpisode = String(episode.number).padStart(2, "0");
    const episodeCode = `s${paddedSeason}e${paddedEpisode}`;

    // Remove HTML tags from the summary to ensure accurate text matching
    const cleanSummary = episode.summary
      ? episode.summary.replace(/<[^>]*>/g, "").toLowerCase()
      : "";
    const name = episode.name ? episode.name.toLowerCase() : "";

    // Check if the search input exists in the episode's name, summary, or formatted code
    return (
      name.includes(searchTerm) ||
      cleanSummary.includes(searchTerm) ||
      episodeCode.includes(searchTerm)
    );
  });

  // Update the UI with the filtered results
  makePageForEpisodes(matchingEpisodes);
  document.getElementById("episode-count").textContent =
    `Showing ${matchingEpisodes.length} of ${allEpisodes.length} episodes`;
}

function handleSelectorChange() {
  const selectedCode = document.getElementById("episode-selector").value;
  if (selectedCode === "") return; // Do nothing if the default option is selected

  const targetCard = document.getElementById(selectedCode);
  targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Fetch all shows from the API
async function fetchShows() {
  const url = "https://api.tvmaze.com/shows";

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
  
    const shows = await response.json();
    cache.set(url, shows); // Cache the shows data
    allShows = shows;
    populateShowSelector(shows);
  } catch (error) {
    console.error("Failed to fetch shows:", error);
  }
}

// Populate the show selector dropdown (sorted alphabetically, case-insensitive)
function populateShowSelector(shows) {
  const selector = document.getElementById("show-select");
  selector.innerHTML = '<option value="">-- Select a show --</option>';

  // Sort alphabetically, case-insensitive (requirement 5)
  const sorted = [...shows].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  sorted.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    selector.appendChild(option);
  });
}

// Handle when a user selects a show from the dropdown
function handleShowChange() {
  const selectedShowId = document.getElementById("show-select").value;
  if (!selectedShowId) return;

  currentShowId = selectedShowId;

  // Find the selected show to update the hero
  const selectedShow = allShows.find((show) => show.id == selectedShowId);

  // Reset search and episode selector
  document.getElementById("search-input").value = "";
  document.getElementById("episode-selector").innerHTML =
    '<option value="">Select an episode...</option>';

  // Update the hero and fetch episodes
  updateHero(selectedShow);
  fetchEpisodes(selectedShowId);
}

// Update the hero section with the selected show's info
function updateHero(show) {
  const heroImage = document.querySelector(".hero-image");
  const heroTitle = document.querySelector(".hero-section h1");
  const heroSummary = document.querySelector(".hero-summary");

  heroImage.src = show.image
    ? show.image.original
    : "https://static.tvmaze.com/uploads/images/original_untouched/1/2668.jpg";
  heroImage.alt = show.name;
  heroTitle.textContent = show.name;

  // Strip HTML tags from summary
  heroSummary.textContent = show.summary
    ? show.summary.replace(/<[^>]*>/g, "")
    : "No summary available.";
}

// 4. Attach event listeners to the input fields
document.getElementById("search-input").addEventListener("input", handleSearch);
document
  .getElementById("episode-selector")
  .addEventListener("change", handleSelectorChange);

document
  .getElementById("show-select")
  .addEventListener("change", handleShowChange);

// 5. Initialize the application when the window loads
window.onload = fetchShows;
