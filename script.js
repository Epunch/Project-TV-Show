const allEpisodes = getAllEpisodes();

// This function runs automatically when the browser finishes loading the page
function setup() {
  makePageForEpisodes(allEpisodes);

  // populate episodes via dropdown menu
  populateEpisodeSelector();
}

// This function takes an array of episodes as input and displays them inside the root element
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ""; // Clear any default or previous text/content

  // Iterate over each episode to build the UI dynamically
  episodeList.forEach((episode) => {
    // Create a semantic article tag for each episode card (Good for Accessibility)
    const cardElement = document.createElement("article");
    cardElement.classList.add("episode-card");

    // Format season and episode numbers into a zero-padded string (e.g., S01E01)
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

    // Append child elements to the main card container
    cardElement.appendChild(titleElement);
    cardElement.appendChild(imageElement);
    cardElement.appendChild(summaryElement);

    // Append the complete card into the root div on the web page
    rootElem.appendChild(cardElement);
  });
}

// Grab the search input and listen for every keystroke the user types
const searchInput = document.getElementById("search-input");
searchInput.addEventListener("input", handleSearch);

// This function filters episodes based on what the user has typed in the search box
// It checks both the episode name and summary, and is case-insensitive
function handleSearch() {
  const searchTerm = searchInput.value;

  // Keep only episodes where the name or summary contains the search term
  const matchingEpisodes = allEpisodes.filter(function (episode) {
    return (
      episode.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      episode.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Re-render the page with only the matching episodes
  makePageForEpisodes(matchingEpisodes);

  // Update the episode counter to show how many results matched
  const episodeCounter = document.getElementById("episode-count");
  episodeCounter.textContent = `Showing ${matchingEpisodes.length} of ${allEpisodes.length} episodes`;
}

// This function fills the episode dropdown with one option per episode
// Each option displays the episode code and name (e.g. "S01E01 - Winter is Coming")
function populateEpisodeSelector() {
  const selector = document.getElementById("episode-selector");

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

// Grab the episode selector and listen for when the user picks an option
const episodeSelector = document.getElementById("episode-selector");
episodeSelector.addEventListener("change", handleSelectorChange);

// This function scrolls the page smoothly to the selected episode card
// It uses the episode code as both the option value and the card's id to find the right element
function handleSelectorChange() {
  const selectedCode = episodeSelector.value;

  // If the user selects the default placeholder option, do nothing
  if (selectedCode === "") return;

  // Find the card with the matching id and scroll it into view
  const targetCard = document.getElementById(selectedCode);
  targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
}

window.onload = setup;
