# Weather Forecast

## Overview

This project is a simple weather forecast web application built using:

- HTML
- JavaScript (Vanilla)
- Tailwind CSS (CDN)
- OpenWeatherMap API

The application allows users to:

- Search weather by **city name**
- Fetch weather for **current location** (using Geolocation API)
- View **current weather details**
- See an **extended 5-day forecast**
- Toggle **temperature units (°C / °F)** for today's temperature
- See a **custom alert** for extreme heat (above 40°C)

---

## Features

1. **Location-based forecast**
   - Search by city
   - Use current location
   - Auto-update UI with new data

2. **Current weather**
   - City, country
   - Temperature, feels-like, min/max
   - Humidity, wind speed
   - Weather icon and description
   - Temperature unit toggle (°C / °F) for **today only**
   - Extreme temperature alert for temperatures above **40°C**

3. **5-day forecast**
   - Shows 5 cards (one per day)
   - Date, icon, temperature (°C), wind speed, humidity
   - Data processed from OpenWeatherMap 3-hour interval forecast

4. **Recent cities dropdown**
   - Saves up to 5 recent cities in `localStorage`
   - Clicking a recent city reloads the weather
   - No dropdown options initially until the first search

5. **Error handling**
   - Handles invalid city names
   - Handles API errors
   - Handles geolocation permission errors
   - Uses custom styled messages instead of `alert()`

6. **Responsive UI**
   - Works on desktop, tablet, and mobile
   - Layout adjusts using Tailwind responsive classes


7. **URL**
  - https://mausam4cast.netlify.app/
