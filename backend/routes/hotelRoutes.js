const express = require('express');
const router = express.Router();
const axios = require('axios');

const localData = require('../data/hotels.json');
let lastApiRequest = 0;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeApiRequest = async (fn, fallbackData) => {
  try {
    const now = Date.now();
    if (lastApiRequest > 0 && (now - lastApiRequest) < 2000) {
      await delay(2000 - (now - lastApiRequest));
    }
    lastApiRequest = Date.now();
    return await fn();
  } catch (error) {
    console.error('API failed:', error.message);
    return fallbackData;
  }
};

// 1. GET LOCATIONS - Using REST Countries API (SAFE)
router.get('/locations', async (req, res) => {
  try {
    console.log('Fetching locations from REST Countries API...');
    
    const apiResult = await makeApiRequest(async () => {
      console.log('Calling REST Countries API v3.1 with fields...');
      
      const response = await axios.get('https://restcountries.com/v3.1/all', {
        params: {
          fields: 'name,capital,region' // ⚠️ REQUIRED for v3.1
        },
        timeout: 8000
        // NO headers needed
      });
      
      console.log(`REST Countries returned ${response.data.length} countries`);
      
      // Extract capital cities
      const locations = response.data
        .filter(country => country.capital && country.capital[0])
        .map(country => {
          const city = country.capital[0];
          const countryName = country.name.common;
          return `${city}, ${countryName}`;
        })
        .sort()
        .slice(0, 50); // Get 50 locations
      
      return { locations, source: 'restcountries_api' };
    }, null);
    
    // If API failed, use local data
    if (!apiResult) {
      console.log('Using local locations data');
      const locations = Object.keys(localData).map(city => 
        `${city.charAt(0).toUpperCase() + city.slice(1)}, India`
      );
      
      const international = [
        'Paris, France', 'London, UK', 'New York, USA', 
        'Tokyo, Japan', 'Sydney, Australia', 'Dubai, UAE',
        'Singapore', 'Bangkok, Thailand'
      ];
      
      const allLocations = [...locations, ...international].sort();
      
      return res.json({
        success: true,
        locations: allLocations,
        source: 'local_data'
      });
    }
    
    // Add popular Indian destinations
    const indianDestinations = [
      'Goa, India', 'Mumbai, India', 'Delhi, India', 
      'Jaipur, India', 'Kerala, India', 'Rajasthan, India'
    ];
    
    const allLocations = [...new Set([...apiResult.locations, ...indianDestinations])].sort();
    
    res.json({
      success: true,
      locations: allLocations,
      source: apiResult.source
    });
    
  } catch (error) {
    console.error('Locations error:', error.message);
    
    const fallbackLocations = [
      'Goa, India', 'Mumbai, India', 'Delhi, India', 
      'Jaipur, India', 'Kerala, India', 'Rajasthan, India'
    ].sort();
    
    res.json({
      success: true,
      locations: fallbackLocations,
      source: 'ultimate_fallback'
    });
  }
});

// 2. GET PLACES - Using Wikipedia API with IMPROVED CLEANING
router.get('/:location/places', async (req, res) => {
  try {
    const location = req.params.location;
    const cityName = location.split(',')[0].trim().toLowerCase();
    
    console.log(`\n=== Fetching places for "${cityName}" from Wikipedia ===`);
    
    const apiResult = await makeApiRequest(async () => {
      const response = await axios.get('https://en.wikipedia.org/w/api.php', {
        params: {
          action: 'query',
          list: 'search',
          srsearch: `tourist attractions in ${cityName}`,
          srlimit: 15,
          format: 'json',
          origin: '*',
          srprop: 'snippet'
        },
        headers: {
          'User-Agent': 'TravelGuideApp/1.0 (ramavathpremkumar47@gmail.com)'
        },
        timeout: 5000
      });
      
      console.log(`\n📊 Wikipedia raw results for "${cityName}":`);
      console.log('='.repeat(50));
      
      // IMPROVED FILTERING with better cleaning
      const places = response.data.query.search
        .filter(item => {
          const title = item.title.toLowerCase();
          const snippet = item.snippet ? item.snippet.toLowerCase() : '';
          
          // Filter out unwanted article types
          const isBadTitle = 
            title.includes('list of') ||
            title.includes('category:') ||
            title.includes('disambiguation') ||
            title.includes('tourist attractions in') ||
            title.includes('in the ') ||
            title.startsWith('tourist') ||
            title.includes('(disambiguation)');
          
          // Also check snippet for clues
          const isBadSnippet = 
            snippet.includes('wikipedia') ||
            snippet.includes('article') ||
            snippet.includes('list of');
          
          const isGood = !isBadTitle && !isBadSnippet;
          
          // Log each result
          console.log(`"${item.title}"`);
          console.log(`  Snippet: ${snippet.substring(0, 80)}...`);
          console.log(`  Bad Title: ${isBadTitle}, Bad Snippet: ${isBadSnippet}`);
          console.log(`  Status: ${isGood ? '✅ KEEP' : '❌ FILTERED OUT'}`);
          console.log('---');
          
          return isGood;
        })
        .map(item => {
  // Keep original title - minimal cleaning
  let placeName = item.title;
  
  console.log(`  Processing: "${placeName}"`);
  
  // 1. Remove obvious bad prefixes
  placeName = placeName.replace(/^(List of|Category:|Lists of|Tourist attractions in)\s+/i, '');
  
  // 2. Remove trailing parenthetical content
  placeName = placeName.replace(/\s*\([^)]*\)\s*$/, '');
  
  // 3. Handle ", City" at the end - only remove if redundant
  const endsWithCityComma = new RegExp(`,\\s*${cityName}\\s*$`, 'i');
  if (placeName.match(endsWithCityComma)) {
    const nameWithoutCity = placeName.replace(endsWithCityComma, '').trim();
    // Only remove if it doesn't create a trailing comma
    if (!nameWithoutCity.endsWith(',')) {
      placeName = nameWithoutCity;
    }
  }
  
  // 4. Handle "X, New City" pattern (like "Jantar Mantar, New Delhi")
  if (placeName.includes(', New ')) {
    // Keep the part before "New"
    const parts = placeName.split(', New ');
    if (parts[0].trim().length > 2) {
      placeName = parts[0].trim();
    }
  }
  
  // 5. Final cleanup - remove any trailing commas
  placeName = placeName.replace(/,\s*$/, '');
  placeName = placeName.trim();
  
  // 6. If name is too short, use original
  if (placeName.length < 3) {
    placeName = item.title
      .replace(/^(List of|Category:|Lists of)\s+/i, '')
      .replace(/\s*\([^)]*\)\s*$/, '')
      .trim();
  }
  
  console.log(`  Cleaned: "${item.title}" → "${placeName}"`);
  
  return {
    name: placeName,
    originalTitle: item.title
  };
})
        .filter((place, index, self) => {
          // Remove duplicates and empty names
          const isDuplicate = index !== self.findIndex(p => p.name === place.name);
          const isValid = place.name && place.name.length > 2;
          
          if (!isValid) {
            console.log(`  Filtered: "${place.name}" (too short)`);
          }
          if (isDuplicate) {
            console.log(`  Filtered: "${place.name}" (duplicate)`);
          }
          
          return isValid && !isDuplicate;
        })
        .slice(0, 10);
      
      // Log final results
      console.log('\n✅ FINAL PLACES SELECTED:');
      console.log('='.repeat(50));
      places.forEach((place, index) => {
        console.log(`${index + 1}. ${place.name} (from: ${place.originalTitle})`);
      });
      console.log(`Total: ${places.length} places\n`);
      
      return { 
        places: places.map(p => ({ name: p.name })),
        source: 'wikipedia_api' 
      };
    }, null);
    
    // If API failed or returned few results, check local data
    if (!apiResult || apiResult.places.length < 3) {
      console.log(`\n⚠️ Wikipedia returned few results (${apiResult?.places.length || 0}), checking local data...`);
      
      if (localData[cityName]) {
        const places = localData[cityName].places.map(place => ({
          name: place.name
        }));
        
        console.log(`✅ Found ${places.length} places in local data for ${cityName}:`);
        places.forEach((p, i) => console.log(`  ${i+1}. ${p.name}`));
        
        return res.json({
          success: true,
          places: places,
          source: 'local_data'
        });
      }
      
      // If no local data, return popular attractions
      console.log(`\n📌 Using popular attractions fallback for ${cityName}`);
      const popularAttractions = getPopularAttractions(cityName);
      
      return res.json({
        success: true,
        places: popularAttractions,
        source: 'popular_attractions_fallback'
      });
    }
    
    console.log(`\n✅ Wikipedia returned ${apiResult.places.length} good places for ${cityName}`);
    
    res.json({
      success: true,
      places: apiResult.places,
      source: apiResult.source
    });
    
  } catch (error) {
    console.error('\n❌ Places error:', error.message);
    
    // Ultimate fallback
    res.json({
      success: true,
      places: [{ name: 'Popular Attractions' }],
      source: 'error_fallback'
    });
  }
});

// Helper function for popular attractions
function getPopularAttractions(cityName) {
  const attractionMap = {
    'mumbai': [
      { name: 'Gateway of India' },
      { name: 'Marine Drive' },
      { name: 'Juhu Beach' },
      { name: 'Elephanta Caves' }
    ],
    'delhi': [
      { name: 'India Gate' },
      { name: 'Red Fort' },
      { name: 'Qutub Minar' },
      { name: 'Lotus Temple' }
    ],
    'goa': [
      { name: 'Calangute Beach' },
      { name: 'Baga Beach' },
      { name: 'Anjuna Beach' },
      { name: 'Fort Aguada' }
    ],
    'jaipur': [
      { name: 'Hawa Mahal' },
      { name: 'Amber Fort' },
      { name: 'City Palace' },
      { name: 'Jantar Mantar' }
    ],
    'new york': [
      { name: 'Statue of Liberty' },
      { name: 'Central Park' },
      { name: 'Times Square' },
      { name: 'Empire State Building' }
    ],
    'paris': [
      { name: 'Eiffel Tower' },
      { name: 'Louvre Museum' },
      { name: 'Notre-Dame Cathedral' },
      { name: 'Champs-Élysées' }
    ],
    'london': [
      { name: 'Big Ben' },
      { name: 'London Eye' },
      { name: 'Tower of London' },
      { name: 'Buckingham Palace' }
    ],
    'kerala': [
      { name: 'Kerala Backwaters' },
      { name: 'Munnar Hill Station' },
      { name: 'Alleppey Beach' },
      { name: 'Kovalam Beach' }
    ]
  };
  
  return attractionMap[cityName] || [{ name: 'City Center' }];
}

// 3. GET HOTELS - API FIRST (near place, then city), then local fallback
router.get('/:location/:place/hotels', async (req, res) => {
  try {
    const location = req.params.location;
    const place = req.params.place;
    const cityName = location.split(',')[0].trim().toLowerCase();
    const placeName = place.toLowerCase();
    
    console.log(`\n=== Fetching hotels for "${placeName}" in ${cityName} ===`);
    
    // 1. FIRST: Try OSM API - NEAR PLACE FIRST, then CITY-WIDE
    let apiHotels = [];
    try {
      console.log(`1. Trying OSM API for hotels NEAR "${placeName}"...`);
      
      // ATTEMPT 1: Specific search near the tourist place
      const specificResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: `hotels near ${placeName}, ${cityName}`,
          format: 'json',
          limit: 10,
          'accept-language': 'en',
          email: 'ramavathpremkumar47@gmail.com'
        },
        headers: {
          'User-Agent': 'TravelGuideApp/1.0'
        },
        timeout: 6000
      });
      
      console.log(`   Found ${specificResponse.data.length} OSM results near "${placeName}"`);
      
      // Filter for hotels near the place
      apiHotels = specificResponse.data
        .filter(item => {
          const displayName = item.display_name?.toLowerCase() || '';
          
          // Check if it's a hotel
          const isHotel = 
            item.type === 'hotel' || 
            item.class === 'tourism' ||
            item.category === 'accommodation' ||
            displayName.includes('hotel') ||
            displayName.includes('inn') ||
            displayName.includes('resort') ||
            displayName.includes('lodge') ||
            displayName.includes('guest house') ||
            displayName.includes('hostel') ||
            displayName.includes('motel');
          
          return isHotel;
        })
        .map((item, index) => {
          const priceData = getRandomPriceRange();  
          return {
          id: `osm_near_${Date.now()}_${index + 1}`,
          name: item.display_name.split(',')[0] || `Hotel near ${placeName}`,
          address: item.display_name || `Near ${placeName}, ${cityName}`,
          type: item.type || 'hotel',
          priceCategory: priceData.category, 
          priceDisplay: priceData.display,
          priceRange: priceData.original,
          amenities: getRandomAmenities(),
          rating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
          source: 'osm_api_near_place',
          lat: item.lat,
          lon: item.lon,
          proximity: `Walking distance to ${placeName}`
          };
        });
      
      console.log(`   Filtered to ${apiHotels.length} hotels NEAR "${placeName}"`);
      
      // ATTEMPT 2: If no hotels found near the place, search city-wide
      if (apiHotels.length === 0) {
        console.log(`\n   ⚠️ No hotels found near "${placeName}", trying CITY-WIDE search...`);
        
        const cityResponse = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: `hotels ${cityName} india`,
            format: 'json',
            limit: 10,
            'accept-language': 'en',
            email: 'ramavathpremkumar47@gmail.com'
          },
          headers: {
            'User-Agent': 'TravelGuideApp/1.0'
          },
          timeout: 6000
        });
        
        console.log(`   Found ${cityResponse.data.length} OSM results in ${cityName}`);
        
        apiHotels = cityResponse.data
          .filter(item => {
            const displayName = item.display_name?.toLowerCase() || '';
            
            // Hotel detection
            const isHotel = 
              item.type === 'hotel' || 
              item.class === 'tourism' ||
              item.category === 'accommodation' ||
              displayName.includes('hotel') ||
              displayName.includes('inn') ||
              displayName.includes('resort') ||
              displayName.includes('lodge') ||
              displayName.includes('guest house');
            
            // Must be in the city
            const isInCity = displayName.includes(cityName.toLowerCase()) || 
                            item.display_name?.includes(cityName.charAt(0).toUpperCase() + cityName.slice(1)) ||
                            displayName.includes('new delhi') ||
                            displayName.includes('old delhi');
            
            return isHotel && isInCity;
          })
          .map((item, index) => {
            const priceData = getRandomPriceRange(); 
            return {
            id: `osm_city_${Date.now()}_${index + 1}`,
            name: item.display_name.split(',')[0] || `${cityName.charAt(0).toUpperCase() + cityName.slice(1)} Hotel`,
            address: item.display_name || `${cityName.charAt(0).toUpperCase() + cityName.slice(1)}, India`,
            type: item.type || 'hotel',
            priceCategory: priceData.category, 
            priceDisplay: priceData.display,
            priceRange: priceData.original,
            amenities: getRandomAmenities(),
            rating: (Math.random() * 2 + 3).toFixed(1),
            source: 'osm_api_city_wide',
            lat: item.lat,
            lon: item.lon,
            proximity: `In ${cityName.charAt(0).toUpperCase() + cityName.slice(1)} city (${Math.floor(Math.random() * 10) + 5} km from ${placeName})`
            };
          });
        
        console.log(`   Filtered to ${apiHotels.length} hotels IN ${cityName}`);
      }
      
      // Log results
      if (apiHotels.length > 0) {
        const sourceType = apiHotels[0].source.includes('near') ? 'NEAR the place' : 'in the CITY';
        console.log(`✅ OSM API returned ${apiHotels.length} hotels (${sourceType})`);
        
        // Show sample hotels
        console.log(`   Sample hotels:`);
        apiHotels.slice(0, Math.min(3, apiHotels.length)).forEach((hotel, i) => {
          console.log(`   ${i+1}. ${hotel.name}`);
          console.log(`       Address: ${hotel.address.substring(0, 70)}...`);
          console.log(`       Proximity: ${hotel.proximity}`);
        });
      } else {
        console.log(`❌ OSM API found 0 hotels near or in ${cityName}`);
      }
      
    } catch (apiError) {
      console.log('❌ OSM API failed:', apiError.message);
      apiHotels = [];
    }
    
    // 2. SECOND: If API returned hotels, use them
    if (apiHotels.length > 0) {
      return res.json({
        success: true,
        hotels: apiHotels,
        count: apiHotels.length,
        source: apiHotels[0].source,
        message: apiHotels[0].source.includes('near') 
          ? `Found ${apiHotels.length} hotels near ${placeName}`
          : `Found ${apiHotels.length} hotels in ${cityName} (no hotels near ${placeName})`
      });
    }
    
    // 3. THIRD: If API failed, check local data
    console.log('\n2. API returned no hotels, checking local data...');
    
    if (localData[cityName]) {
      const localPlace = localData[cityName].places.find(p => 
        p.name.toLowerCase().includes(placeName) ||
        placeName.includes(p.name.toLowerCase())
      );
      
      if (localPlace && localPlace.hotels && localPlace.hotels.length > 0) {
        console.log(`✅ Found ${localPlace.hotels.length} hotels in local data`);
        
        const hotels = localPlace.hotels.map(hotel => ({
          ...hotel,
          id: `local_${hotel.id || Date.now()}`,
          source: 'local_db'
        }));
        
        return res.json({
          success: true,
          hotels: hotels,
          count: hotels.length,
          source: 'local_data'
        });
      }
    }
    
    // 4. FOURTH: If no local data, use SMART mock data
    console.log('\n3. No local data found, using smart mock hotels...');
    
    const mockHotels = [
      {
        id: `mock_${Date.now()}_1`,
        name: `${placeName.charAt(0).toUpperCase() + placeName.slice(1)} View Hotel`,
        address: `Near ${placeName}, ${cityName.charAt(0).toUpperCase() + cityName.slice(1)}`,
        type: 'hotel',
        priceCategory: 'Medium', 
        priceDisplay: 'Medium (₹3000-₹6000)',
        priceRange: 'Medium (₹3000-₹6000)',
        amenities: ['Free WiFi', 'Parking', 'Restaurant', '24/7 Front Desk', 'AC'],
        rating: '4.2',
        source: 'mock_near_place',
        proximity: `Right next to ${placeName}`,
        description: `Perfect location for visiting ${placeName}`
      },
      {
        id: `mock_${Date.now()}_2`,
        name: `${cityName.charAt(0).toUpperCase() + cityName.slice(1)} City Hotel`,
        address: `City Center, ${cityName.charAt(0).toUpperCase() + cityName.slice(1)}`,
        type: 'hotel',
        priceCategory: 'High',
        priceDisplay: 'High (₹6000+)',
        priceRange: 'High (₹6000+)',
        amenities: ['WiFi', 'Parking', 'Breakfast', 'Pool', 'Spa', 'Gym', 'Restaurant'],
        rating: '4.5',
        source: 'mock_city_center',
        proximity: `In ${cityName} city center (easy access to ${placeName})`,
        description: `Luxury hotel with easy transportation to ${placeName}`
      },
      {
        id: `mock_${Date.now()}_3`,
        name: `${cityName.charAt(0).toUpperCase() + cityName.slice(1)} Budget Stay`,
        address: `Main Road, ${cityName.charAt(0).toUpperCase() + cityName.slice(1)}`,
        type: 'hotel',
        priceCategory: 'Low',
        priceDisplay: 'Low (₹1000-₹3000)',
        priceRange: 'Low (₹1000-₹3000)',
        amenities: ['WiFi', 'Parking', '24/7 Front Desk'],
        rating: '3.8',
        source: 'mock_budget',
        proximity: `Affordable option in ${cityName}`,
        description: `Budget-friendly hotel for visiting ${placeName}`
      }
    ];
    
    console.log(`✅ Created ${mockHotels.length} mock hotels`);
    
    return res.json({
      success: true,
      hotels: mockHotels,
      count: mockHotels.length,
      source: 'mock_fallback',
      message: `Using mock hotels for ${placeName}, ${cityName}`
    });
    
  } catch (error) {
    console.error('\n❌ Hotels error:', error.message);
    
    // Ultimate fallback
    const fallbackHotels = [
      {
        id: `fallback_${Date.now()}_1`,
        name: `${cityName.charAt(0).toUpperCase() + cityName.slice(1)} Accommodation`,
        address: `${cityName.charAt(0).toUpperCase() + cityName.slice(1)}, India`,
        type: 'hotel',
        priceCategory: 'Medium',
        priceDisplay: 'Medium (₹3000-₹6000)',
        priceRange: 'Medium (₹3000-₹6000)',
        amenities: ['WiFi', 'Parking'],
        rating: '4.0',
        source: 'error_fallback'
      }
    ];
    
    return res.json({
      success: true,
      hotels: fallbackHotels,
      count: fallbackHotels.length,
      source: 'error_fallback',
      message: 'Could not fetch hotels, using fallback data'
    });
  }
});


function getRandomPriceRange() {
  const ranges = [
    { category: 'Low', display: 'Low (₹1000-₹3000)' },
    { category: 'Medium', display: 'Medium (₹3000-₹6000)' },
    { category: 'High', display: 'High (₹6000+)' }
  ];
  const selected = ranges[Math.floor(Math.random() * ranges.length)];
  return {
    category: selected.category,
    display: selected.display,
    // Keep original format for backward compatibility
    original: `${selected.category} (${selected.display.includes('₹') ? '' : '₹'}${selected.display.split('₹')[1] || selected.display})`
  };
}

function getRandomAmenities() {
  const amenities = ['WiFi', 'Parking', 'Restaurant', 'Pool', 'Spa'];
  const count = 2 + Math.floor(Math.random() * 3);
  return amenities.slice(0, count);
}

module.exports = router;