const API_KEY = "08e9ae99e36f464299d237231fa3e081"; // <-- Put your OpenWeatherMap API key here
const BASE_URL = "https://api.openweathermap.org/data/2.5";


// DOM ELEMENTS
const currentDateEl = document.getElementById("currentDate");
const messageBar = document.getElementById("messageBar");

const appShell = document.getElementById("appShell");
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const currentLocationBtn = document.getElementById("currentLocationBtn");
const recentCitiesSelect = document.getElementById("recentCitiesSelect");

const todaySection = document.getElementById("todaySection");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const todayContent = document.getElementById("todayContent");

const cityNameEl = document.getElementById("cityName");
const countryNameEl = document.getElementById("countryName");
const weatherDescriptionEl = document.getElementById("weatherDescription");
const weatherIconEl = document.getElementById("weatherIcon");
const temperatureValueEl = document.getElementById("temperatureValue");
const temperatureUnitEl = document.getElementById("temperatureUnit");
const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl = document.getElementById("humidity");
const windSpeedEl = document.getElementById("windSpeed");
const minMaxTempEl = document.getElementById("minMaxTemp");

const celsiusBtn = document.getElementById("celsiusBtn");
const fahrenheitBtn = document.getElementById("fahrenheitBtn");
const extremeAlertEl = document.getElementById("extremeAlert");

const forecastSubtitleEl = document.getElementById("forecastSubtitle");
const forecastContainer = document.getElementById("forecastContainer");


// STATE
let currentTempCelsius = null;
let currentFeelsLikeCelsius = null;
let currentMinTempCelsius = null;
let currentMaxTempCelsius = null;
let currentCityLabel = "";
let lastSearchMethod = "city"; // "city" or "coords"
let lastCoords = null;


// UTILITIES
function formatDate(date = new Date()) {
    const options = {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
}

function formatForecastDate(dateStr) {
    const d = new Date(dateStr);
    const options = {
        weekday: "short",
        day: "numeric",
        month: "short",
    };
    return d.toLocaleDateString(undefined, options);
}

/**
 * Show global message bar
 * type: "error" | "info"
 */
function showMessage(type, text) {
    if (!text) {
        messageBar.classList.add("hidden");
        messageBar.textContent = "";
        return;
    }

    messageBar.classList.remove("hidden");

    if (type === "error") {
        messageBar.className =
            "px-4 sm:px-6 py-3 text-sm font-medium bg-red-500/15 text-red-100 border-y border-red-500/40";
    } else {
        messageBar.className =
            "px-4 sm:px-6 py-3 text-sm font-medium bg-sky-500/15 text-sky-100 border-y border-sky-500/40";
    }

    messageBar.textContent = text;
}

/**
 * Set background gradient of the main app shell
 * based on weather condition.
 */
function setBackgroundByWeather(mainCondition) {
    // Remove previous gradient classes
    appShell.classList.remove(
        "bg-white/10",
        "from-slate-900",
        "from-amber-200",
        "from-slate-700",
        "from-sky-800",
        "to-sky-900",
        "to-slate-900",
        "to-slate-800"
    );

    // Reset to base glass panel
    appShell.className =
        "w-full max-w-5xl rounded-3xl shadow-2xl backdrop-blur-lg overflow-hidden border";

    // Apply new gradient with Tailwind classes
    let bgClasses =
        "bg-gradient-to-br from-slate-900/90 to-sky-900/80 border-white/10";

    if (!mainCondition) {
        appShell.className += " " + bgClasses;
        return;
    }

    const cond = mainCondition.toLowerCase();

    if (cond.includes("rain") || cond.includes("drizzle") || cond.includes("storm")) {
        bgClasses = "bg-gradient-to-br from-sky-900/90 to-slate-900/90 border-sky-500/30";
    } else if (cond.includes("clear")) {
        bgClasses = "bg-gradient-to-br from-amber-200/80 to-sky-500/80 border-amber-300/50";
    } else if (cond.includes("cloud")) {
        bgClasses = "bg-gradient-to-br from-slate-600/80 to-slate-900/90 border-slate-300/40";
    }

    appShell.className += " " + bgClasses;
}

/**
 * Temperature conversion helpers
 */
function toFahrenheit(celsius) {
    return (celsius * 9) / 5 + 32;
}

function round(value, decimals = 1) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}


// LOCAL STORAGE (RECENT CITIES)

const RECENT_CITIES_KEY = "weather_recent_cities";

function loadRecentCities() {
    try {
        const data = localStorage.getItem(RECENT_CITIES_KEY);
        if (!data) return [];

        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch (err) {
        console.error("Error reading recent cities:", err);
        return [];
    }
}

function saveRecentCities(cities) {
    try {
        localStorage.setItem(RECENT_CITIES_KEY, JSON.stringify(cities));
    } catch (err) {
        console.error("Error saving recent cities:", err);
    }
}

function addCityToRecent(city) {
    if (!city) return;
    const normalized = city.trim();

    let cities = loadRecentCities();

    // Remove if already present, then unshift to top
    cities = cities.filter((c) => c.toLowerCase() !== normalized.toLowerCase());
    cities.unshift(normalized);

    // Keep only up to 5 cities
    if (cities.length > 5) cities = cities.slice(0, 5);

    saveRecentCities(cities);
    renderRecentCitiesDropdown();
}

function renderRecentCitiesDropdown() {
    const cities = loadRecentCities();
    recentCitiesSelect.innerHTML = "";

    if (!cities.length) {
        recentCitiesSelect.disabled = true;
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "Recent cities";
        recentCitiesSelect.appendChild(option);
        return;
    }

    recentCitiesSelect.disabled = false;

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select recent city";
    recentCitiesSelect.appendChild(defaultOption);

    cities.forEach((city) => {
        const opt = document.createElement("option");
        opt.value = city;
        opt.textContent = city;
        recentCitiesSelect.appendChild(opt);
    });
}


// API CALLS
async function fetchCurrentWeatherByCity(city) {
    const url = `${BASE_URL}/weather?q=${encodeURIComponent(
        city
    )}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error("Unable to fetch current weather for this city.");
    }
    return res.json();
}

async function fetchForecastByCity(city) {
    const url = `${BASE_URL}/forecast?q=${encodeURIComponent(
        city
    )}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error("Unable to fetch forecast data for this city.");
    }
    return res.json();
}

async function fetchCurrentWeatherByCoords(lat, lon) {
    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error("Unable to fetch current weather for your location.");
    }
    return res.json();
}

async function fetchForecastByCoords(lat, lon) {
    const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error("Unable to fetch forecast data for your location.");
    }
    return res.json();
}


// FORECAST PROCESSING


/**
 * OpenWeather 5-day forecast gives data in 3-hour intervals.
 * We group by date and pick the entry closest to 12:00, or the first one.
 */
function extractDailyForecast(list) {
    const byDate = {};

    list.forEach((item) => {
        const [dateStr, timeStr] = item.dt_txt.split(" ");
        if (!byDate[dateStr]) {
            byDate[dateStr] = [];
        }
        byDate[dateStr].push(item);
    });

    const dates = Object.keys(byDate).sort();
    const daily = [];

    dates.forEach((dateStr) => {
        const items = byDate[dateStr];

        // Try to find 12:00 if exists, else fallback to middle item
        let targetItem =
            items.find((it) => it.dt_txt.includes("12:00:00")) ||
            items[Math.floor(items.length / 2)];

        daily.push({
            date: dateStr,
            temp: targetItem.main.temp,
            humidity: targetItem.main.humidity,
            wind: targetItem.wind.speed,
            icon: targetItem.weather[0].icon,
            main: targetItem.weather[0].main,
            description: targetItem.weather[0].description,
        });
    });

    // Only take first 5 days
    return daily.slice(0, 5);
}


// RENDER FUNCTIONS
function renderTodayWeather(data) {
    const {
        name,
        sys,
        main,
        weather,
        wind,
    } = data;

    const weatherInfo = weather[0];

    currentTempCelsius = main.temp;
    currentFeelsLikeCelsius = main.feels_like;
    currentMinTempCelsius = main.temp_min;
    currentMaxTempCelsius = main.temp_max;
    currentCityLabel = `${name}, ${sys.country}`;

    emptyState.classList.add("hidden");
    todayContent.classList.remove("hidden");

    cityNameEl.textContent = name || "Unknown city";
    countryNameEl.textContent = sys?.country ? `Country: ${sys.country}` : "";
    weatherDescriptionEl.textContent =
        weatherInfo?.description
            ? weatherInfo.description[0].toUpperCase() +
            weatherInfo.description.slice(1)
            : "";

    // Icon from OpenWeather
    if (weatherInfo?.icon) {
        weatherIconEl.src = `https://openweathermap.org/img/wn/${weatherInfo.icon}@2x.png`;
        weatherIconEl.alt = weatherInfo.description || "Weather icon";
    } else {
        weatherIconEl.src = "";
        weatherIconEl.alt = "";
    }

    // Reset unit to Celsius view
    temperatureUnitEl.textContent = "°C";
    temperatureValueEl.textContent = Math.round(currentTempCelsius);
    feelsLikeEl.textContent = `Feels like ${Math.round(
        currentFeelsLikeCelsius
    )}°C`;

    humidityEl.textContent = `${main.humidity}%`;
    windSpeedEl.textContent = `${round(wind.speed, 1)} m/s`;

    minMaxTempEl.textContent = `${Math.round(
        currentMinTempCelsius
    )}°C / ${Math.round(currentMaxTempCelsius)}°C`;

    // Extreme temperature alert (>40°C)
    if (currentTempCelsius > 40) {
        extremeAlertEl.classList.remove("hidden");
    } else {
        extremeAlertEl.classList.add("hidden");
    }

    // Update background based on main weather condition
    setBackgroundByWeather(weatherInfo?.main);

    // Highlight active unit button
    celsiusBtn.classList.add("bg-sky-500", "text-white");
    celsiusBtn.classList.remove("text-slate-200", "hover:bg-slate-800/80");
    fahrenheitBtn.classList.remove("bg-sky-500", "text-white");
    fahrenheitBtn.classList.add("text-slate-200");
}

function renderForecast(data) {
    const daily = extractDailyForecast(data.list);
    forecastContainer.innerHTML = "";

    if (!daily.length) {
        forecastSubtitleEl.textContent = "No forecast available.";
        return;
    }

    forecastSubtitleEl.textContent = `Showing 5-day forecast for ${currentCityLabel}`;

    daily.forEach((day, index) => {
        const card = document.createElement("article");
        card.className =
            "min-w-[120px] sm:min-w-[135px] bg-slate-900/80 border border-slate-700/70 rounded-2xl p-3 flex flex-col items-center text-center text-xs sm:text-sm fade-in";

        const dateEl = document.createElement("p");
        dateEl.className = "font-medium text-slate-100 mb-1";
        dateEl.textContent = formatForecastDate(day.date);

        const labelEl = document.createElement("p");
        labelEl.className = "text-[11px] text-slate-300/80 mb-1";
        labelEl.textContent = index === 0 ? "Today" : "";

        const iconEl = document.createElement("img");
        iconEl.className = "w-10 h-10 my-1";
        iconEl.src = `https://openweathermap.org/img/wn/${day.icon}@2x.png`;
        iconEl.alt = day.description || "Weather icon";

        const tempEl = document.createElement("p");
        tempEl.className = "font-semibold text-sky-300 mt-1";
        tempEl.textContent = `${Math.round(day.temp)}°C`;

        const descEl = document.createElement("p");
        descEl.className = "text-[11px] text-slate-300/90 mt-1 line-clamp-2";
        descEl.textContent =
            day.description[0].toUpperCase() + day.description.slice(1);

        const metaRow = document.createElement("div");
        metaRow.className =
            "mt-2 w-full grid grid-cols-2 gap-1 text-[11px] text-slate-300/90";

        const windEl = document.createElement("div");
        windEl.innerHTML = `<span class="block text-[10px] text-slate-400">Wind</span>${round(
            day.wind,
            1
        )} m/s`;

        const humEl = document.createElement("div");
        humEl.innerHTML = `<span class="block text-[10px] text-slate-400">Humidity</span>${day.humidity}%`;

        metaRow.appendChild(windEl);
        metaRow.appendChild(humEl);

        card.appendChild(dateEl);
        card.appendChild(labelEl);
        card.appendChild(iconEl);
        card.appendChild(tempEl);
        card.appendChild(descEl);
        card.appendChild(metaRow);

        forecastContainer.appendChild(card);
    });
}


// MAIN FETCH WRAPPERS
async function loadWeatherByCity(city) {
    const trimmedCity = city.trim();

    if (!trimmedCity) {
        showMessage("error", "Please enter a city name.");
        return;
    }

    showMessage("info", "Loading weather data...");
    loadingState.classList.remove("hidden");
    todayContent.classList.add("hidden");
    emptyState.classList.add("hidden");

    try {
        lastSearchMethod = "city";
        lastCoords = null;

        const [current, forecast] = await Promise.all([
            fetchCurrentWeatherByCity(trimmedCity),
            fetchForecastByCity(trimmedCity),
        ]);

        renderTodayWeather(current);
        renderForecast(forecast);

        addCityToRecent(current.name);
        showMessage(
            "info",
            `Weather updated for ${current.name}, ${current.sys.country}.`
        );
    } catch (err) {
        console.error(err);
        emptyState.classList.remove("hidden");
        todayContent.classList.add("hidden");
        showMessage(
            "error",
            err.message || "Something went wrong while fetching the weather."
        );
    } finally {
        loadingState.classList.add("hidden");
    }
}

async function loadWeatherByCoords(lat, lon) {
    showMessage("info", "Detecting your location and loading weather data...");
    loadingState.classList.remove("hidden");
    todayContent.classList.add("hidden");
    emptyState.classList.add("hidden");

    try {
        lastSearchMethod = "coords";
        lastCoords = { lat, lon };

        const [current, forecast] = await Promise.all([
            fetchCurrentWeatherByCoords(lat, lon),
            fetchForecastByCoords(lat, lon),
        ]);

        renderTodayWeather(current);
        renderForecast(forecast);

        // Add city name to recent, if available
        if (current.name) addCityToRecent(current.name);

        showMessage(
            "info",
            `Weather updated for your location: ${current.name}, ${current.sys.country}.`
        );
    } catch (err) {
        console.error(err);
        emptyState.classList.remove("hidden");
        todayContent.classList.add("hidden");
        showMessage(
            "error",
            err.message || "Could not fetch weather for your location."
        );
    } finally {
        loadingState.classList.add("hidden");
    }
}


// EVENT HANDLERS
// On page load
(function init() {
    currentDateEl.textContent = `Today · ${formatDate()}`;
    renderRecentCitiesDropdown();
    showMessage("", ""); // hide bar
})();

// Search form submit
searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const city = cityInput.value;
    loadWeatherByCity(city);
});

// Current location button
currentLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        showMessage(
            "error",
            "Geolocation is not supported by this browser. Please search by city instead."
        );
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            loadWeatherByCoords(latitude, longitude);
        },
        (error) => {
            console.error("Geolocation error:", error);
            showMessage(
                "error",
                "Unable to access your location. Please allow location permission or search by city."
            );
        }
    );
});

// Recent cities dropdown change
recentCitiesSelect.addEventListener("change", (e) => {
    const city = e.target.value;
    if (!city) return;
    cityInput.value = city;
    loadWeatherByCity(city);
});

// Unit toggle (only affects TODAY’S temperature)
celsiusBtn.addEventListener("click", () => {
    if (currentTempCelsius == null) return;

    temperatureUnitEl.textContent = "°C";
    temperatureValueEl.textContent = Math.round(currentTempCelsius);
    feelsLikeEl.textContent = `Feels like ${Math.round(
        currentFeelsLikeCelsius
    )}°C`;
    minMaxTempEl.textContent = `${Math.round(
        currentMinTempCelsius
    )}°C / ${Math.round(currentMaxTempCelsius)}°C`;

    // Button styles
    celsiusBtn.classList.add("bg-sky-500", "text-white");
    celsiusBtn.classList.remove("text-slate-200", "hover:bg-slate-800/80");
    fahrenheitBtn.classList.remove("bg-sky-500", "text-white");
    fahrenheitBtn.classList.add("text-slate-200");
});

fahrenheitBtn.addEventListener("click", () => {
    if (currentTempCelsius == null) return;

    temperatureUnitEl.textContent = "°F";
    const tempF = toFahrenheit(currentTempCelsius);
    const feelsF = toFahrenheit(currentFeelsLikeCelsius);
    const minF = toFahrenheit(currentMinTempCelsius);
    const maxF = toFahrenheit(currentMaxTempCelsius);

    temperatureValueEl.textContent = Math.round(tempF);
    feelsLikeEl.textContent = `Feels like ${Math.round(feelsF)}°F`;
    minMaxTempEl.textContent = `${Math.round(minF)}°F / ${Math.round(
        maxF
    )}°F`;

    // Button styles
    fahrenheitBtn.classList.add("bg-sky-500", "text-white");
    fahrenheitBtn.classList.remove("text-slate-200", "hover:bg-slate-800/80");
    celsiusBtn.classList.remove("bg-sky-500", "text-white");
    celsiusBtn.classList.add("text-slate-200");
});
