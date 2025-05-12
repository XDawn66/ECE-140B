let cond = "unknown";

async function fetchItems() {
  let locationItems = null;
  try {
    const response = await fetch("/location");
    if (response.ok) {
      const data = await response.json();
      if (data[0].location) {
        locationItems = data[0].location;
      }
      if (locationItems != null) {
        const location = locationItems;
        fetchLocationWeather(location);
      } else {
        console.error("No location data");
      }
    } else {
      console.error("Error fetching data:", response.status);
    }
  } catch (error) {
    console.error("Network error:", error);
  }
}

async function fetchLocationWeather(location) {
  let api;
  const apiResponse = await fetch("/API_KEY_PLEASE");
  const apiData = await apiResponse.json();
  api = apiData[0];

  if (!api) {
    console.error("API Key not found!");
    return;
  }
  console.log("API Key:", api);

  fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      location
    )}&format=json`
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.length === 0) {
        alert("Location not found!");
        return;
      }
      const lat = data[0].lat;
      const lon = data[0].lon;
      fetch(`https://api.weather.gov/points/${lat},${lon}`)
        .then((response) => response.json())
        .then((weatherData) => {
          const forecastUrl = weatherData.properties.forecast;
          fetch(forecastUrl)
            .then((response) => response.json())
            .then((forecastData) => {
              const period = forecastData.properties.periods[0];
              cond = period.shortForecast;
              const weatherInfo = {
                city: location,
                condition: period.shortForecast,
                temperature: `${period.temperature} °${period.temperatureUnit}`,
                weather_image_query: period.shortForecast,
                city_image_query: location,
              };
              fetch(
                `https://api.unsplash.com/search/photos/?query=${weatherInfo.weather_image_query}&client_id=${api}`
              )
                .then((response) => response.json())
                .then((data) => {
                  const result = data.results;
                  if (result.length > 0) {
                    const imageUrl = result[0].urls.regular;
                    document.getElementById("weatherImage").src = imageUrl;
                  } else {
                    console.error("No weather image found");
                  }
                })
                .catch((error) => {
                  console.error("Error fetching weather image:", error);
                });
              fetch(
                `https://api.unsplash.com/search/photos/?query=${weatherInfo.city_image_query}&client_id=${api}`
              )
                .then((response) => response.json())
                .then((data) => {
                  const result = data.results;
                  if (result.length > 0) {
                    const cityImageUrl = result[0].urls.regular;
                    document.getElementById("cityImage").src = cityImageUrl;
                  } else {
                    console.error("No city image found");
                  }
                })
                .catch((error) => {
                  console.error("Error fetching city image:", error);
                });
              document.getElementById(
                "location"
              ).textContent = `Location: ${weatherInfo.city}`;
              document.getElementById(
                "weatherCondition"
              ).textContent = `Weather Condition: ${weatherInfo.condition}`;
              document.getElementById(
                "temperature"
              ).textContent = `Temperature: ${weatherInfo.temperature}`;
            });
        });
    })
    .catch((error) => {
      console.error("Error fetching location data:", error);
    });
}

window.onload = fetchItems;

let period = "";

async function fetchLocation() {
  try {
    const response = await fetch(`/location`);
    const data = await response.json();
    if (data.length === 0) {
      alert("City not found");
      return;
    }
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    alert("Failed to fetch data. Try again later.");
  }
}

//LLM Fetch Recommendation

async function generateRecommendation() {
  const temperature = period.temperature;
  let city = await fetchLocation();
  city = city[0]["location"];
  try {
    const response = await fetch(
      `AI/${encodeURIComponent(city)}/${encodeURIComponent(cond)}`
    );
    console.log("city", city);
    console.log("cond", cond);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch recommendation. Status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log(data["result"]["response"]);
    let container = document.getElementById("write-here");
    container.textContent = "";
    container.textContent = data["result"]["response"];
  } catch (error) {
    console.error("Error:", error);
  }
}
