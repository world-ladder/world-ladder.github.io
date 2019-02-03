const store = new Vuex.Store({
  state: {
    loaded: false,
    broArmy: 0,
    countries: [],
    next: "XXX",
    previous: "XXX",
    highlighted: "XXX"
  },
  getters: {
    previousCountryIndex: state => {
      const broArmy = state.broArmy;
      return state.countries.findIndex(c => c.population < broArmy);
    },
    nextCountry: (state, getters) => {
      // It won't ever get above China, right?
      return state.countries[getters.previousCountryIndex - 1];
    },
    previousCountry: (state, getters) => {
      return state.countries[getters.previousCountryIndex];
    }
  },
  mutations: {
    finishLoad: state => state.loaded = true,
    updateBroArmy: (state, count) => state.broArmy = count,
    updateCountries: (state, countries) => state.countries = countries,
    highlight: (state, country) => state.highlighted = country.alpha3Code ? country.alpha3Code : country,
    clearHighlight: (state) => state.highlighted = ""
  }
});