// Global variable to store episodes
let allEpisodes = [];

// 1. First, define the functions that do the UI work (makePageForEpisodes, handleSearch, etc.)
// Because these are defined first, fetchEpisodes can find them easily.

function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";

  // Iterate over each episode to build the UI dynamically
  episodeList.forEach((episode) => {
    // Create a semantic article tag for each episode card (Good for Accessibility)
    const cardElement = document.createElement("article");
    cardElement.classList.add("episode-card");

    const paddedSeason = String(episode.season).padStart(2, "0");
    const paddedEpisode = String(episode.number).padStart(2, "0");
    const episodeCode = `S${paddedSeason}E${paddedEpisode}`;

    // Adding an ID for every card that is created
    cardElement.id = episodeCode;

    // Create the title heading element
    const titleElement = document.createElement("h2");
    titleElement.textContent = `${episode.name} - ${episodeCode}`;

    // Create the image element
    const imageElement = document.createElement("img");
    imageElement.src = episode.image.medium;
    imageElement.alt = `Screenshot from the episode: ${episode.name}`;

    // Create a container for the summary text
    const summaryElement = document.createElement("div");
    summaryElement.classList.add("episode-summary");
    // Using innerHTML here because the API data already includes safe HTML paragraph tags
    summaryElement.innerHTML = episode.summary;

    cardElement.appendChild(titleElement);
    cardElement.appendChild(imageElement);
    cardElement.appendChild(summaryElement);

    // Append the complete card into the root div on the web page
    rootElem.appendChild(cardElement);
  });
}

// This function fills the episode dropdown with one option per episode
// Each option displays the episode code and name (e.g. "S01E01 - Winter is Coming")
function populateEpisodeSelector() {
  const selector = document.getElementById("episode-selector");
  selector.innerHTML = ""; // Clear existing options

  allEpisodes.forEach(function (episode) {
    const option = document.createElement("option");

    // Format the episode code the same way as in makePageForEpisodes
    const paddedSeason = String(episode.season).padStart(2, "0");
    const paddedEpisode = String(episode.number).padStart(2, "0");
    const episodeCode = `S${paddedSeason}E${paddedEpisode}`;

    // The value matches the card's id so we can scroll directly to it
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
  const selectedCode = document.getElementById("episode-selector").value;
  if (selectedCode === "") return;
  const targetCard = document.getElementById(selectedCode);
  targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

// 4. Add Event Listeners
document.getElementById("search-input").addEventListener("input", handleSearch);
document
  .getElementById("episode-selector")
  .addEventListener("change", handleSelectorChange);

// 5. Initialize the app
window.onload = fetchEpisodes;
