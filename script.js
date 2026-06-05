// Global variable to store all fetched episodes
let allEpisodes = [];

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

// 4. Attach event listeners to the input fields
document.getElementById("search-input").addEventListener("input", handleSearch);
document
  .getElementById("episode-selector")
  .addEventListener("change", handleSelectorChange);

// 5. Initialize the application when the window loads
window.onload = fetchEpisodes;
