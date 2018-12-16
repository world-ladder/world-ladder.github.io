async function fetchCountries(override, test) {
  const query = "https://restcountries.eu/rest/v2/all?fields=name;population;alpha3Code;alpha2Code";
  const response = await fetch(query);
  const countries = await response.json();
  // Adjust code for Datamaps
  countries.find(c => c.alpha3Code === "KOS").alpha3Code = "kosovo";
  // REST Countries is missing Somaliland for some reason
  countries.push({
    name: "Somaliland",
    alpha3Code: "somaliland",
    population: 3508000
  });
  countries.sort((a, b) => b.population - a.population);
  let i = store.state.broArmy + 18900;
  for (let c of countries) {
    if (override !== undefined) {
      c.population = override;
    }
    if (test) {
      c.population = i;
      i -= 1000;
    }
  }
  store.commit("updateCountries", countries);
}

async function fetchBroArmy() {
  const query = "https://bastet.socialblade.com/youtube/lookup?query=UC-lHJZR3Gqxm24_Vd_AJ5Yw";
  const response = await fetch(query);
  const text = await response.text();
  return parseInt(text);
}

async function updateBroArmy() {
  let count = await fetchBroArmy();
  //count = targetCount + 1000;
  currentCount = targetCount;
  targetCount = count;
  lastFetch = performance.now();
}

function lerpBroArmy(time) {
  requestAnimationFrame(lerpBroArmy);
  if (currentCount === targetCount) return;
  const lerpAmount = Math.min((time - lastFetch) / UPDATE_RATE, 1);
  const lerpedCount = Math.floor(currentCount + (targetCount - currentCount) * lerpAmount);
  if (lerpedCount === targetCount) {
    currentCount = targetCount;
  }
  store.commit("updateBroArmy", lerpedCount);
}

let targetCount;
let currentCount;
let lastFetch;
const UPDATE_RATE = 3 * 1000;

async function start() {
  while (!store.state.loaded) {
    try {
      await fetchCountries();
      targetCount = currentCount = await fetchBroArmy();
      lastFetch = performance.now();
      store.commit("updateBroArmy", targetCount);
      store.commit("finishLoad");
    }
    catch (e) {
      await new Promise(res => setTimeout(res, UPDATE_RATE));
    }
  }
  setInterval(updateBroArmy, UPDATE_RATE);
  setInterval(fetchCountries, 6 * 60 * 60 * 1000);
  requestAnimationFrame(lerpBroArmy);
}

start();

const debug = {
  genocide: () => fetchCountries(0),
  chinaMode: () => fetchCountries(1e9),
  ladder: () => fetchCountries(undefined, true)
};