const mapState = Vuex.mapState;
const mapGetters = Vuex.mapGetters;
const mapMutations = Vuex.mapMutations;

function commatose(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

Vue.filter("commatose", commatose);

Vue.filter("formatPopulation", function(population) {
  if (population >= 1000000000) return Math.round(population / 1000000) / 1000 + " B";
  return Math.round(population / 100000) / 10 + " M";
});

function shortenCountryName(name) {
  if (name === "United States of America") return "USA";
  if (name === "Russian Federation") return "Russia";
  let parenthesesIndex = name.indexOf('(');
  if (parenthesesIndex > 0) return name.substr(0, parenthesesIndex);
  return name;
}

Vue.filter("shortenName", shortenCountryName);

function flagUrl(country, size) {
  return `https://www.countryflags.io/${country.alpha2Code}/shiny/${size}.png`;
}

const flagMixin = {
  methods: {
    flagUrl: flagUrl
  }
};

Vue.component("bro-count", {
  computed: mapState({
    broArmy: state => state.broArmy
  }),
  template:
    `<div class="o-bro-count">
      <img src="brofist.svg" class="o-bro-count__brofist">
      <div class="o-bro-count__counter">
        <span>{{broArmy | commatose}}</span>
      </div>
    </div>`
});

Vue.component("world-map", {
  data() {
    return {
      map: undefined
    }
  },
  computed: {
    ...mapState({
      countries: state => state.countries,
      broArmy: state => state.broArmy,
      highlighted: state => state.highlighted,
    }),
    ...mapGetters(["nextCountry", "previousCountry"])
  },
  mounted() {
    const mapEl = this.$refs.map;
    const vm = this;
    const datamap = new Datamap({
      element: mapEl,
      responsive: true,
      fills: {
        SMALLER: '#e1dbd7',
        BIGGER: '#1d3245',
        defaultFill: 'gray'
      },
      geographyConfig: {
        popupTemplate: function(geo, data) {
          return `
            <div id="map-popup" class="hoverinfo">
              <div class="o-map-popup">
                <div class="o-map-popup__title">
                  <img src="${flagUrl(data.country, 16)}">
                  <strong>${shortenCountryName(data.country.name)}</strong>
                </div>
                <strong id="map-popup-population">Population: ${commatose(data.country.population)}</strong>
                <div class="o-map-popup__comparison">
                  <strong
                    id="map-popup-comparison"
                    code="${data.country.alpha3Code}"
                  >
                    ${vm.sizeComparison(data.country)}
                  </strong>
                  <img src="brofist.svg" class="o-map-popup__brofist">
                  <strong>Bro Army</strong>
                </div>
              </div>
            </div>`;
        }
      }
    });
    this.map = () => datamap;
    for (let code of this.countries.map(c => c.alpha3Code)) {
      const pathEl = mapEl.getElementsByClassName(code)[0];
      if (pathEl === undefined) continue;
      pathEl.addEventListener("mouseenter", () => this.highlight(code));
      pathEl.addEventListener("mouseleave", () => this.clearHighlight());
    }
    window.addEventListener("resize", () => datamap.resize());
    this.updateMap();
  },
  methods: {
    updateMap() {
      const data = {};
      const countries = this.countries;
      const broArmy = this.broArmy;
      for (let country of countries) {
        data[country.alpha3Code] = {
          fillKey: country.population > broArmy ? "BIGGER" : "SMALLER",
          country: country
        }
      }
      this.map().updateChoropleth(data, {reset: true});
    },
    updatePopup() {
      const el = document.getElementById("map-popup-comparison");
      if (el === null) return;
      const code = el.getAttribute("code");
      const country = this.countries.find(c => c.alpha3Code === code);
      el.textContent = this.sizeComparison(country);
    },
    sizeComparison(country) {
      const broArmy = this.broArmy;
      const population = country.population;
      const comparison = broArmy > population ? "smaller than" : "bigger than";
      const fraction = broArmy > population ? broArmy / population: population / broArmy;
      const rounded = Math.round(fraction * 10) / 10;
      const amount = rounded === 1 ? "Slightly" : `${rounded}x times`;
      return `${amount} ${comparison}`;
    },
    ...mapMutations(["highlight", "clearHighlight"])
  },
  watch: {
    countries() {
      this.updateMap();
      this.updatePopup();
    },
    broArmy() {
      this.updatePopup();
    },
    highlighted(newHighlighted, oldHighlighted) {
      const oldEl = document.getElementsByClassName(oldHighlighted)[0];
      if (oldEl !== undefined) {
        oldEl.classList.remove("o-map__country--highlighted");
      }
      const newEl = document.getElementsByClassName(newHighlighted)[0];
      if (newEl !== undefined) {
        newEl.classList.add("o-map__country--highlighted");
      }
    },
    nextCountry(newCountry, oldCountry) {
      if (newCountry !== oldCountry) {
        this.updateMap();
      }
    },
    previousCountry(newCountry, oldCountry) {
      if (newCountry !== oldCountry) {
        this.updateMap();
      }
    }
  },
  template:
    `<div class="o-map">
      <div ref="map" class="o-map__inner" />
    </div>`
});

Vue.component("info-modal", {
  components: {
    aa: {
      props: {
        href: String
      },
      template: `<a :href="href" target="_blank" rel="noopener noreferrer"><slot /></a>`
    }
  },
  data() {
    return {
      opened: false
    }
  },
  template:
    `<div>
      <svg xmlns="http://www.w3.org/2000/svg" version="1.0" viewBox="0 0 99.083 100" class="o-info-icon" @click="opened = true">
        <path d="M49.54 0C22.2-.018.026 22.375 0 49.974.025 77.62 22.198 100.01 49.54 100c27.355.01 49.524-22.38 49.543-50.026C99.063 22.374 76.893-.018 49.54 0zm0 88.48c-21.04 0-38.096-17.23-38.074-38.507C11.443 28.74 28.5 11.513 49.54 11.52c21.05-.008 38.11 17.222 38.132 38.454C87.65 71.25 70.59 88.48 49.542 88.48z"/><path d="M44.402 67.657l11.198-.05V58.95c-.026-2.35 1.068-4.572 4-6.49 2.94-1.93 11.13-5.833 11.143-16.117-.013-10.245-8.615-17.3-15.85-18.82-7.224-1.474-15.057-.49-20.604 5.625-4.99 5.427-6.04 9.742-6.06 19.254h11.196v-2.217c-.022-5.062.565-10.414 7.79-11.9 3.973-.776 7.68.463 9.896 2.6 2.498 2.473 2.517 8.014-1.513 10.76l-6.276 4.274c-3.655 2.367-4.913 4.982-4.922 8.81v12.926zm-.052 15.85V72.04h11.303v11.466z"/>
      </svg>
      <transition name="c-info-modal-container">
        <div v-if="opened" class="c-info-modal-container">
          <div class="c-info-modal-container__bg" @click="opened = false" />
          <div class="c-info-modal l-info-modal">
            <div class="l-info-modal__title">
              <span class="c-info-modal__name">World Ladder</span>
              <div class="l-info-modal__links">
                <span class="l-info-modal__razenpok">Made by Razenpok</span>
                <a href="https://github.com/world-ladder/world-ladder.github.io" target="_blank" rel="noopener noreferrer">
                  <img src="github.svg" class="l-info-modal__github-link">
                </a>
                <div class="l-info-modal__paypal">
                  <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" rel="noopener noreferrer">
                  <input type="hidden" name="cmd" value="_s-xclick" />
                  <input type="hidden" name="hosted_button_id" value="YZN2XLFWWJVJG" />
                  <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
                  <img alt="" border="0" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1" />
                  </form>
                </div>
              </div>
            </div>
            <span class="c-info-modal__header">Licenses:</span>
            <span>- Vue and Vuex <aa href="https://github.com/vuejs">MIT</aa></span>
            <span>- D3.js <aa href="https://github.com/d3/d3">BSD 3-Clause</aa></span>
            <span>- TopoJSON <aa href="https://github.com/topojson/topojson">BSD 3-Clause</aa></span>
            <span>- Datamaps <aa href="https://github.com/markmarkoh/datamaps">MIT</aa></span>
            <span>- Countryflags.io <aa href="https://countryflags.io/">MIT</aa></span>
            <span class="c-info-modal__header">Hosting:</span>
            <span>- <aa href="https://pages.github.com/">GitHub Pages</aa></span>
            <span>- <aa href="https://www.jsdelivr.com/">jsDelivr</aa></span>
          </div>
        </div>
      </transition>
    </div>`
});

Vue.component("main-area", {
  template:
    `<div class="l-main-area">
      <bro-count class="l-main-area__bro-count" />
      <world-map class="l-main-area__map" />
      <info-modal />
    </div>`
});

Vue.component("versus", {
  mixins: [flagMixin],
  computed: {
    ...mapState({
      broArmy: state => state.broArmy
    }),
    ...mapGetters(["nextCountry", "previousCountry"]),
    gap() {
      return this.nextCountry.population - this.broArmy;
    },
    progress() {
      return this.gap / (this.nextCountry.population - this.previousCountry.population);
    },
    pathStyleObject() {
      return {
        right: Math.min(this.progress, 0.9) * 100 + "%"
      }
    }
  },
  methods: mapMutations(["highlight", "clearHighlight"]),
  template:
    `<div class="o-versus" @mouseenter="highlight(nextCountry)" @mouseleave="clearHighlight">
      <span class="o-versus__title">Next Challenger</span>
      <img :src="flagUrl(nextCountry, 64)" class="o-versus__next-flag">
      <span class="o-versus__next-name">{{nextCountry.name | shortenName}}</span>
      <span>Progress</span>
      <div class="o-versus__progress">
        <div class="o-versus__path" />
        <img
          :src="flagUrl(previousCountry, 16)"
          class="o-versus__path-icon o-versus__path-icon--start"
          @mouseenter="highlight(previousCountry)"
          @mouseleave="highlight(nextCountry)"
        >
        <img :src="flagUrl(nextCountry, 16)" class="o-versus__path-icon o-versus__path-icon--end">
        <img src="brofist.svg" class="o-versus__path-icon" :style="pathStyleObject">
      </div>
      <span>Remaining: {{gap | commatose}} subs</span>
    </div>`
});

Vue.component("country-line", {
  mixins: [flagMixin],
  props: {
    index: Number,
    country: Object
  },
  computed: {
    ...mapState({
      highlighted: state => state.highlighted
    }),
    classObject() {
      return {
        "o-country-line": true,
        "o-country-line--highlighted": this.highlighted === this.country.alpha3Code
      }
    }
  },
  methods: {
    ...mapMutations(["highlight", "clearHighlight"])
  },
  template:
    `<div
      :class="classObject"
      @mouseenter="highlight(country)"
      @mouseleave="clearHighlight"
    >
      <span class="o-country-line__index">{{index}}.</span>
      <img :src="flagUrl(country, 24)">
      <span class="o-country-line__name">{{country.name | shortenName}}</span>
      <span>{{country.population | formatPopulation}}</span>
    </div>`
});

Vue.component("bro-army-line", {
  computed: {
    ...mapState({
      broArmy: state => state.broArmy
    }),
    ...mapGetters(["previousCountryIndex"])
  },
  template:
    `<div class="o-country-line o-country-line--bro-army">
      <span class="o-country-line__index">{{previousCountryIndex + 1}}.</span>
      <div style="width: 2.4rem; display: flex; justify-content: center; height: 2.4rem">
        <img src="brofist.svg" width="20" height="20">
      </div>
      <span class="o-country-line__name">PewDiePie</span>
      <span>{{broArmy | formatPopulation}}</span>
    </div>`
});

Vue.component("country-list", {
  computed: {
    ...mapState({
      countries: state => state.countries
    }),
    ...mapGetters(["previousCountryIndex"]),
    biggerCountries() {
      return this.range(1, this.previousCountryIndex - 1);
    },
    smallerCountries() {
      const LINE_LIMIT = 20;
      const FIRST_SMALLER = LINE_LIMIT - 2;
      if (this.previousCountryIndex > FIRST_SMALLER) return [];
      return this.range(this.previousCountryIndex + 1, FIRST_SMALLER - this.previousCountryIndex + 1);
    }
  },
  methods: {
    range(start, count) {
      return [...Array(count).keys()].map(i => i + start);
    }
  },
  template:
    `<transition-group name="c-country-list" tag="div" class="c-country-list">
      <country-line
        v-for="i in previousCountryIndex"
        :key="countries[i - 1].alpha3Code"
        :index="i"
        :country="countries[i - 1]"
      />
      <bro-army-line key="BRO" />
      <country-line
        v-for="i in smallerCountries"
        :key="countries[i - 1].alpha3Code"
        :index="i + 1"
        :country="countries[i - 1]"
      />
    </transition-group>`
});

Vue.component("sidebar", {
  computed: {
    ...mapGetters(["nextCountry", "previousCountry"])
  },
  template:
    `<div class="c-sidebar l-sidebar">
        <versus />
        <div class="l-sidebar__fill" />
        <span class="l-sidebar__ladder-title c-sidebar__ladder-title">World Ladder</span>
        <country-list class="l-sidebar__country-list" />
    </div>`
});

Vue.component("app", {
  template:
    `<div class="c-app l-app">
      <sidebar class="l-app__sidebar" />
      <main-area class="l-app__main-area" />
    </div>`
});

new Vue({
  el: "#app-container",
  store,
  computed: mapState({
    loaded: state => state.loaded
  })
});