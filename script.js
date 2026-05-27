const allEpisodes = getAllEpisodes();

// This function runs automatically when the browser finishes loading the page
function setup() {
  makePageForEpisodes(allEpisodes);
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

const searchInput = document.getElementById("search-input");
searchInput.addEventListener("input", handleSearch);

function handleSearch() {
  const searchTerm = searchInput.value;
  console.log(searchTerm);
}

window.onload = setup;
