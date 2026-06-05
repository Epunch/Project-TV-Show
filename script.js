<<<<<<< HEAD
// Global variable to store episodes
let allEpisodes = [];

// 1. First, define the functions that do the UI work (makePageForEpisodes, handleSearch, etc.)
// Because these are defined first, fetchEpisodes can find them easily.
=======
<<<<<<< HEAD
const allEpisodes = getAllEpisodes();

// This function runs automatically when the browser finishes loading the page
function setup() {
  makePageForEpisodes(allEpisodes);
=======
// Global variable to store all fetched episodes
let allEpisodes = [];

// 1. Define the functions responsible for updating the UI
// These are declared first so the fetch function can utilize them.
>>>>>>> 76c6e6f (feat(js): enable search by episode code and clean HTML tags)
>>>>>>> a03bc44 (feat(js): enable search by episode code and clean HTML tags)

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
<<<<<<< HEAD
  rootElem.innerHTML = "";
=======
<<<<<<< HEAD
  rootElem.innerHTML = ""; // Clear any default or previous text/content
=======
  rootElem.innerHTML = ""; // Clear existing content
>>>>>>> 76c6e6f (feat(js): enable search by episode code and clean HTML tags)
>>>>>>> a03bc44 (feat(js): enable search by episode code and clean HTML tags)

  episodeList.forEach((episode) => {
    const cardElement = document.createElement("article");
    cardElement.classList.add("episode-card");

<<<<<<< HEAD
=======
<<<<<<< HEAD
    // Format season and episode numbers into a zero-padded string (e.g., S01E01)
=======
    // Format the season and episode numbers to have leading zeros
>>>>>>> 76c6e6f (feat(js): enable search by episode code and clean HTML tags)
>>>>>>> a03bc44 (feat(js): enable search by episode code and clean HTML tags)
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

<<<<<<< HEAD
=======
<<<<<<< HEAD
    // Append child elements to the main card container
=======
    // Append all elements to the card, then the card to the root container
>>>>>>> 76c6e6f (feat(js): enable search by episode code and clean HTML tags)
>>>>>>> a03bc44 (feat(js): enable search by episode code and clean HTML tags)
    cardElement.appendChild(titleElement);
    cardElement.appendChild(imageElement);
    cardElement.appendChild(summaryElement);

    rootElem.appendChild(cardElement);
  });
}

<<<<<<< HEAD
=======
<<<<<<< HEAD
// Grab the search input and listen for every keystroke the user types
const searchInput = document.getElementById("search-input");
searchInput.addEventListener("input", handleSearch);

// This function filters episodes based on what the user has typed in the search box
// It checks both the episode name and summary, and is case-insensitive
function handleSearch() {
  const searchTerm = searchInput.value;

  // Keep only episodes where the name or summary contains the search term
=======
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
async function fetchEpisodes() {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "<p>Loading episodes, please wait...</p>";

  try {
    const response = await fetch("https://api.tvmaze.com/shows/82/episodes");

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // Parse JSON data and assign it to the global variable
    allEpisodes = await response.json();

    // Render the initial UI with the retrieved data
    makePageForEpisodes(allEpisodes);
    populateEpisodeSelector();
  } catch (error) {
    // Handle potential fetch errors
    rootElem.innerHTML = `<p style="color: red;">Failed to load episodes: ${error.message}</p>`;
  }
}

// 3. Define the handlers for the search input and dropdown selector
function handleSearch() {
  const searchTerm = document
    .getElementById("search-input")
    .value.toLowerCase();

>>>>>>> 76c6e6f (feat(js): enable search by episode code and clean HTML tags)
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

<<<<<<< HEAD
  // Re-render the page with only the matching episodes
=======
  // Update the UI with the filtered results
>>>>>>> 76c6e6f (feat(js): enable search by episode code and clean HTML tags)
  makePageForEpisodes(matchingEpisodes);

  // Update the episode counter to show how many results matched
  const episodeCounter = document.getElementById("episode-count");
  episodeCounter.textContent = `Showing ${matchingEpisodes.length} of ${allEpisodes.length} episodes`;
}

// This function fills the episode dropdown with one option per episode
// Each option displays the episode code and name (e.g. "S01E01 - Winter is Coming")
>>>>>>> a03bc44 (feat(js): enable search by episode code and clean HTML tags)
function populateEpisodeSelector() {
  const selector = document.getElementById("episode-selector");
  selector.innerHTML = ""; // Clear existing options

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

// 2. Define the Fetch function
async function fetchEpisodes() {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "<p>Loading episodes, please wait...</p>";

  try {
    const response = await fetch("https://api.tvmaze.com/shows/82/episodes");

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // Assign the fetched data to our global variable
    allEpisodes = await response.json();

    // Now that we have data, render the UI
    makePageForEpisodes(allEpisodes);
    populateEpisodeSelector();
  } catch (error) {
    // This part handles the error shown in "Screenshot 2026-06-01 at 5.07.00 PM.png"
    rootElem.innerHTML = `<p style="color: red;">Failed to load episodes: ${error.message}</p>`;
  }
}

// 3. Define the Search and Select handlers (These will use the updated allEpisodes)
function handleSearch() {
  const searchTerm = document.getElementById("search-input").value;
  const matchingEpisodes = allEpisodes.filter(function (episode) {
    return (
      episode.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      episode.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  makePageForEpisodes(matchingEpisodes);
  document.getElementById("episode-count").textContent =
    `Showing ${matchingEpisodes.length} of ${allEpisodes.length} episodes`;
}

function handleSelectorChange() {
<<<<<<< HEAD
  const selectedCode = document.getElementById("episode-selector").value;
  if (selectedCode === "") return;
=======
<<<<<<< HEAD
  const selectedCode = episodeSelector.value;

  // If the user selects the default placeholder option, do nothing
  if (selectedCode === "") return;

  // Find the card with the matching id and scroll it into view
=======
  const selectedCode = document.getElementById("episode-selector").value;
  if (selectedCode === "") return; // Do nothing if the default option is selected

>>>>>>> 76c6e6f (feat(js): enable search by episode code and clean HTML tags)
>>>>>>> a03bc44 (feat(js): enable search by episode code and clean HTML tags)
  const targetCard = document.getElementById(selectedCode);
  targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

<<<<<<< HEAD
// 4. Add Event Listeners
=======
<<<<<<< HEAD
window.onload = setup;
=======
// 4. Attach event listeners to the input fields
>>>>>>> a03bc44 (feat(js): enable search by episode code and clean HTML tags)
document.getElementById("search-input").addEventListener("input", handleSearch);
document
  .getElementById("episode-selector")
  .addEventListener("change", handleSelectorChange);

<<<<<<< HEAD
// 5. Initialize the app
window.onload = fetchEpisodes;
=======
// 5. Initialize the application when the window loads
window.onload = fetchEpisodes;
>>>>>>> 76c6e6f (feat(js): enable search by episode code and clean HTML tags)
>>>>>>> a03bc44 (feat(js): enable search by episode code and clean HTML tags)
