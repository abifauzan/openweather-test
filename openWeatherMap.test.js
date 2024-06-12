const axios = require('axios');
const { Validator } = require('jsonschema');
require('dotenv').config();

const API_KEY = process.env.OPENWEATHERMAP_API_KEY; // Store your API key in an .env file for security
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const JAKARTA_SELATAN_COORDINATES = { lat: -6.2615, lon: 106.8106 };

const v = new Validator();

const forecastSchema = {
  type: 'object',
  properties: {
    cod: { type: 'string' },
    message: { type: 'number' },
    cnt: { type: 'number' },
    list: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          dt: { type: 'number' },
          main: { type: 'object' },
          weather: { type: 'array' },
          clouds: { type: 'object' },
          wind: { type: 'object' },
          visibility: { type: 'number' },
          pop: { type: 'number' },
          sys: { type: 'object' },
          dt_txt: { type: 'string' }
        },
        required: ['dt', 'main', 'weather', 'clouds', 'wind', 'visibility', 'pop', 'sys', 'dt_txt']
      }
    },
    city: { type: 'object' }
  },
  required: ['cod', 'message', 'cnt', 'list', 'city']
};

const airPollutionSchema = {
  type: 'object',
  properties: {
    coord: { type: 'object' },
    list: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          main: { type: 'object' },
          components: { type: 'object' },
          dt: { type: 'number' }
        },
        required: ['main', 'components', 'dt']
      }
    }
  },
  required: ['coord', 'list']
};

const get5DayWeatherForecast = async () => {
  const url = `${BASE_URL}/forecast`;
  const response = await axios.get(url, {
    params: {
      lat: JAKARTA_SELATAN_COORDINATES.lat,
      lon: JAKARTA_SELATAN_COORDINATES.lon,
      appid: API_KEY
    }
  });
  return response.data;
};

const getCurrentAirPollution = async () => {
  const url = `${BASE_URL}/air_pollution`;
  const response = await axios.get(url, {
    params: {
      lat: JAKARTA_SELATAN_COORDINATES.lat,
      lon: JAKARTA_SELATAN_COORDINATES.lon,
      appid: API_KEY
    }
  });
  return response.data;
};

// Step 1: Get the coordinates for Jakarta Selatan
const getCoordinates = async (cityName, country) => {
  const apiUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${cityName},${country}&limit=1&appid=${API_KEY}`;
  
  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    if (data.length === 0) {
      throw new Error('City not found');
    }
    return { lat: data[0].lat, lon: data[0].lon };
  } catch (error) {
    console.error('Error fetching coordinates:', error);
    throw error;
  }
};

// Step 2: Get city information using the coordinates
const getCityInfo = async (lat, lon) => {
  const apiUrl = `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

  try {
    const response = await axios.get(apiUrl);
    const data = response.data;
    const cityInfo = {
      id: data.id,
      name: data.name,
      coord: {
        lat: data.coord.lat,
        lon: data.coord.lon
      },
      country: data.sys.country,
      population: data.population || 'unknown', // OpenWeatherMap might not provide population data
      timezone: data.timezone,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset
    };
    return cityInfo;
  } catch (error) {
    console.error('Error fetching city data:', error);
    throw error;
  }
};

// Step 3: Combine both steps to get the final city information
const getJakartaSelatanInfo = async () => {
  try {
    const coordinates = await getCoordinates('Jakarta Selatan', 'ID');
    console.log('coordinates', coordinates);
    const cityInfo = await getCityInfo(coordinates.lat, coordinates.lon);
    // console.log(cityInfo);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the function to get the information
getJakartaSelatanInfo();

test('Get 5 day weather forecast of Jakarta Selatan', async () => {
  const data = await get5DayWeatherForecast();
  expect(data).toBeDefined();
  expect(data.city.name).toBe('Rawa Barat');

  const validationResult = v.validate(data, forecastSchema);
  expect(validationResult.errors).toHaveLength(0);
});

test('Get current air pollution of Jakarta Selatan', async () => {
  const data = await getCurrentAirPollution();
  expect(data).toBeDefined();
  expect(data.coord.lat).toBe(JAKARTA_SELATAN_COORDINATES.lat);
  expect(data.coord.lon).toBe(JAKARTA_SELATAN_COORDINATES.lon);

  const validationResult = v.validate(data, airPollutionSchema);
  expect(validationResult.errors).toHaveLength(0);
});
