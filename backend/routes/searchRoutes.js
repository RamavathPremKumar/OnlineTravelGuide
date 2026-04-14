const express = require('express');
const router = express.Router();
const axios = require('axios');

// Cache for search results
const searchCache = new Map();
const CACHE_DURATION = 300000; // 5 minutes

// Add delay for Nominatim rate limiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Parse search query into components
function parseSearchQuery(query) {
  const normalized = query.toLowerCase().trim();
  
  // Check for "X in Y" pattern
  const inPattern = /(.+)\s+in\s+(.+)/i;
  const inmatch = query.match(inPattern);

  const nearPattern = /(.+)\s+near\s+(.+)/i;
  const nearMatch = query.match(nearPattern);
  
  if (inmatch) {
    return {
      original: query,
      type: 'category_in_location',
      category: inmatch[1].trim(),
      location: inmatch[2].trim(),
      searchTerm: inmatch[2].trim()
    };
  }
  
  if (nearMatch) {
    return {
      original: query,
      type: 'category_near_location',
      category: nearMatch[1].trim(),
      location: nearMatch[2].trim(),
      searchTerm: nearMatch[2].trim()
    };
  }
  
  // Check for famous landmarks
  const isLandmark = isFamousLandmark(normalized);
  
  return {
    original: query,
    type: isLandmark ? 'landmark' : 'general',
    searchTerm: query
  };
}

// Check if query is for a famous monument/landmark
function isFamousLandmark(query) {
  const famousPlaces = [
    // Global landmarks
    'taj mahal', 'eiffel tower', 'statue of liberty', 'great wall', 'colosseum',
    'machu picchu', 'christ the redeemer', 'pyramids', 'stonehenge',
    'angkor wat', 'petra', 'chichen itza', 'mount fuji', 'sydney opera house',
    'burj khalifa', 'big ben', 'louvre', 'buckingham palace', 'acropolis',
    'sagrada familia', 'golden gate bridge', 'niagara falls', 'grand canyon',
    'mount rushmore', 'kremlin', 'brandenburg gate', 'forbidden city',
    
    // Indian landmarks
    'gateway of india', 'charminar', 'hawa mahal', 'mysore palace',
    'india gate', 'qutub minar', 'red fort', 'lotus temple',
    'golden temple', 'ajanta caves', 'ellora caves', 'konark temple',
    'victoria memorial', 'amer fort', 'mehrangarh fort', 'jal mahal',
    'birla mandir', 'iskcon temple', 'somnath temple', 'tirupati temple',
    'rameshwaram', 'varanasi ghats', 'khajuraho', 'sanchi stupa',
    
    // Hyderabad landmarks
    'charminar', 'golconda fort', 'hussain sagar',
    
    // Delhi landmarks
    'india gate', 'qutub minar', 'red fort', 'lotus temple',
    
    // Mumbai landmarks
    'gateway of india', 'marine drive', 'elephanta caves',
    
    // Kolkata landmarks
    'victoria memorial', 'howrah bridge',
    
    // Chennai landmarks
    'kapaleeshwarar temple', 'marina beach',
    
    // Bangalore landmarks
    'vidhana soudha', 'lalbagh',
    
    // Jaipur landmarks
    'hawa mahal', 'amer fort', 'jal mahal',
    
    // Agra landmarks
    'taj mahal', 'agra fort',
    
    // Varanasi landmarks
    'varanasi ghats', 'kashi vishwanath',
  ];
  
  return famousPlaces.some(place => query.includes(place));
}

// Get location type from Nominatim result
function getLocationType(item) {
  const type = item.type;
  const category = item.category;
  
  if (type === 'city' || type === 'town' || type === 'village' || type === 'municipality') {
    return 'city';
  } else if (type === 'state' || category === 'boundary') {
    return 'state';
  } else if (type === 'country') {
    return 'country';
  } else if (item.tourism || item.historic || item.leisure || item.natural) {
    return 'attraction';
  } else if (item.place || item.amenity || item.shop) {
    return 'place';
  }
  
  return 'general';
}

// Clean place name - improved for Indian names
function cleanName(name) {
  if (!name) return '';
  
  // Remove common suffixes and clean up
  const cleaned = name.split(',')[0]
    .replace(/^(sri|shri|sree)\s+/i, '') // Remove honorifics
    .replace(/\s+(temple|mandir|gudi|devastanam|church|mosque|masjid)$/i, '') // Remove religious suffixes
    .trim();
    
  return cleaned || name.split(',')[0].trim();
}

// Get location details from Nominatim result
function getLocationDetails(item) {
  const address = item.address || {};
  return {
    city: address.city || address.town || address.village || address.municipality || '',
    state: address.state || address.region || address.province || '',
    country: address.country || '',
    displayName: item.display_name,
    type: getLocationType(item)
  };
}

// Search via Nominatim
let lastSearchTime = 0;

async function searchNominatim(query, params = {}) {
  try {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchTime;
    if (timeSinceLastSearch < 500) {
      await delay(500 - timeSinceLastSearch);
    }
    lastSearchTime = Date.now();
    
    const defaultParams = {
      q: query,
      format: 'json',
      addressdetails: 1,
      limit: params.limit || 10,
      'accept-language': 'en',
      namedetails: 1,
      countrycodes: params.countrycodes
    };

    const finalParams = { ...defaultParams, ...params };

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: finalParams,
      headers: {
        'User-Agent': 'OnlineTravelGuide/1.0',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error('Nominatim search error:', error.message);
    return [];
  }
}

// Get Indian state center coordinates
function getStateCenterCoordinates(stateName) {
  const stateCenters = {
    'andhra pradesh': { lat: 16.5060, lon: 80.6480, radius: 100000 },
    'telangana': { lat: 17.3850, lon: 78.4867, radius: 100000 },
    'karnataka': { lat: 12.9716, lon: 77.5946, radius: 100000 },
    'tamil nadu': { lat: 13.0827, lon: 80.2707, radius: 100000 },
    'maharashtra': { lat: 19.0760, lon: 72.8777, radius: 100000 },
    'goa': { lat: 15.2993, lon: 74.1240, radius: 50000 },
    'kerala': { lat: 9.9312, lon: 76.2673, radius: 100000 },
    'gujarat': { lat: 23.0225, lon: 72.5714, radius: 100000 },
    'rajasthan': { lat: 26.9124, lon: 75.7873, radius: 150000 },
    'punjab': { lat: 31.1471, lon: 75.3412, radius: 100000 },
    'haryana': { lat: 28.4595, lon: 77.0266, radius: 50000 },
    'uttar pradesh': { lat: 26.8467, lon: 80.9462, radius: 150000 },
    'bihar': { lat: 25.5941, lon: 85.1376, radius: 100000 },
    'west bengal': { lat: 22.5726, lon: 88.3639, radius: 100000 },
    'odisha': { lat: 20.2961, lon: 85.8245, radius: 100000 },
    'assam': { lat: 26.1445, lon: 91.7362, radius: 100000 },
    'madhya pradesh': { lat: 23.2599, lon: 77.4126, radius: 150000 },
    'himachal pradesh': { lat: 31.1048, lon: 77.1734, radius: 100000 },
    'jharkhand': { lat: 23.3441, lon: 85.3096, radius: 100000 },
    'chhattisgarh': { lat: 21.2514, lon: 81.6296, radius: 100000 },
    'uttarakhand': { lat: 30.3165, lon: 78.0322, radius: 100000 }
  };
  
  return stateCenters[stateName.toLowerCase()] || null;
}

// Search for specific category in location
async function searchCategoryInLocation(category, location, lat, lon, locationType) {
  try {
    // Enhanced category mapping
    const categoryMapping = {
      // Accommodation
      'hotel': ['tourism=hotel'],
      'hotels': ['tourism=hotel'],
      'hostel': ['tourism=hostel'],
      'hostels': ['tourism=hostel'],
      'guesthouse': ['tourism=guest_house'],
      'resort': ['tourism=resort'],
      
      // Food & Drink
      'restaurant': ['amenity=restaurant'],
      'restaurants': ['amenity=restaurant'],
      'cafe': ['amenity=cafe'],
      'cafes': ['amenity=cafe'],
      'bar': ['amenity=bar'],
      'bars': ['amenity=bar'],
      'pub': ['amenity=pub'],
      'pubs': ['amenity=pub'],
      
      // Natural features
      'beach': ['natural=beach'],
      'beaches': ['natural=beach'],
      'park': ['leisure=park'],
      'parks': ['leisure=park'],
      'lake': ['natural=water', 'water=lake'],
      'lakes': ['natural=water', 'water=lake'],
      'river': ['waterway=river'],
      'mountains': ['natural=peak'],
      
      // Cultural
      'museum': ['tourism=museum'],
      'museums': ['tourism=museum'],
      'gallery': ['tourism=gallery'],
      'theater': ['amenity=theatre'],
      'cinema': ['amenity=cinema'],
      
      // Religious
      'temple': ['amenity=place_of_worship'],
      'temples': ['amenity=place_of_worship'],
      'church': ['amenity=place_of_worship'],
      'churches': ['amenity=place_of_worship'],
      'mosque': ['amenity=place_of_worship'],
      'mosques': ['amenity=place_of_worship'],
      'cathedral': ['building=cathedral'],
      'gurudwara': ['amenity=place_of_worship'],
      'synagogue': ['amenity=place_of_worship'],
      
      // Shopping
      'mall': ['shop=mall'],
      'malls': ['shop=mall'],
      'market': ['amenity=marketplace'],
      
      // Transport
      'airport': ['aeroway=aerodrome'],
      'airports': ['aeroway=aerodrome'],
      'station': ['railway=station'],
      'bus station': ['amenity=bus_station'],
      
      // Services
      'hospital': ['amenity=hospital'],
      'hospitals': ['amenity=hospital'],
      'pharmacy': ['amenity=pharmacy'],
      'bank': ['amenity=bank'],
      'atm': ['amenity=atm'],
      
      // Education
      'university': ['amenity=university'],
      'college': ['amenity=college'],
      'school': ['amenity=school'],
      
      // Entertainment
      'stadium': ['leisure=stadium'],
      'zoo': ['tourism=zoo'],
      'aquarium': ['tourism=aquarium'],
      
      // Indian specific
      'fort': ['historic=fort'],
      'forts': ['historic=fort'],
      'palace': ['building=palace', 'historic=castle'],
      'palaces': ['building=palace', 'historic=castle'],
      'garden': ['leisure=garden'],
      'gardens': ['leisure=garden'],
    };

    const categoryLower = category.toLowerCase();
    const osmTags = categoryMapping[categoryLower] || ['tourism=attraction'];
    
    // Adjust search radius based on location type
    let radius = 50000; // 15km default
    
    if (locationType === 'city') {
      radius = 20000; // 20km for cities
    } else if (locationType === 'state') {
      radius = 30000; // 50km for states (reduced to avoid timeout)
      
      // For specific states, use their predefined radius
      const stateCenter = getStateCenterCoordinates(location);
      if (stateCenter) {
        radius = stateCenter.radius;
        lat = stateCenter.lat;
        lon = stateCenter.lon;
      }
    } else if (locationType === 'country') {
      radius = 100000; // 100km for countries
    }
    
    // Build Overpass query
    const tagQueries = osmTags.map(tag => {
      const [key, value] = tag.split('=');
      return `nwr["${key}"="${value}"](around:${radius},${lat},${lon});`;
    }).join('\n');
    
    const overpassQuery = `
      [out:json][timeout:25];
      (
        ${tagQueries}
      );
      out center 30;
    `;

    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      overpassQuery,
      { 
        headers: { 'Content-Type': 'text/plain' },
        timeout: 25000
      }
    );

    let results = response.data.elements.map(element => {
      const tags = element.tags || {};
      return {
        id: element.id,
        name: tags.name || tags['name:en'] || tags['name:hi'] || tags['name:te'] || tags['name:ta'] || tags['name:kn'] || tags['name:ml'] || `${category} in ${location}`,
        type: category.toLowerCase(),
        description: generateCategoryDescription(tags, category, location),
        lat: element.lat || (element.center && element.center.lat),
        lon: element.lon || (element.center && element.center.lon),
        tags: tags,
        category: getCategoryFromTags(tags, categoryLower),
        contact: {
          phone: tags.phone,
          website: tags.website,
          email: tags.email
        },
        address: {
          street: tags['addr:street'],
          city: tags['addr:city'],
          postcode: tags['addr:postcode']
        }
      };
    }).filter(place => place.name !== `${category} in ${location}`);
    
    // Apply filtering for poor results
    results = filterLowQualityResults(results, categoryLower);
    
    // Remove duplicates
    const uniqueResults = [];
    const seenNames = new Set();
    for (const result of results) {
      const nameKey = result.name.toLowerCase();
      if (!seenNames.has(nameKey)) {
        seenNames.add(nameKey);
        uniqueResults.push(result);
      }
    }
    
    return uniqueResults.slice(0, 25);

  } catch (error) {
    console.error(`Overpass error for ${category} in ${location}:`, error.message);
    return [];
  }
}

// Improved filtering function
function filterLowQualityResults(results, category) {
  return results.filter(place => {
    const name = place.name.toLowerCase();
    const tags = place.tags || {};
    
    // Always exclude these
    const excludeAlways = [
      'parking', 'canteen', 'store', 'shop', 'department', 'office', 'campus',
      'college', 'school', 'university', 'hostel', 'apartment', 'complex',
      'building', 'house', 'room', 'flat', 'ward', 'block', 'center', 'centre',
      'station', 'bus', 'auto', 'stand', 'stop', 'pharmacy', 'medical', 'clinic',
      'hospital', 'bank', 'atm', 'post', 'police', 'fire', 'municipal', 'corporation',
      'panchayat', 'gram', 'village', 'mandal', 'taluk', 'district', 'zilla',
      'collector', 'commissioner', 'commissionerate', 'secretariat', 'assembly',
      'parliament', 'court', 'judge', 'magistrate', 'registrar', 'commission',
      'board', 'corporation', 'authority', 'department', 'ministry', 'directorate',
      'division', 'section', 'unit', 'cell', 'branch', 'outlet', 'counter',
      'kiosk', 'stall', 'booth', 'thela', 'cart', 'vendor', 'hawker', 'peddler',
      'tiffin', 'mess', 'dhaba', 'tea', 'snacks', 'bakery', 'sweet'
    ];
    
    // Check for excluded keywords
    for (const keyword of excludeAlways) {
      if (name.includes(keyword)) {
        return false;
      }
    }
    
    // Minimum name length
    if (name.length < 3) {
      return false;
    }
    
    return true;
  });
}


// Get state capital city
function getStateCapital(stateName) {
  const stateCapitals = {
    'andhra pradesh': 'Amaravati',
    'telangana': 'Hyderabad',
    'karnataka': 'Bangalore',
    'tamil nadu': 'Chennai',
    'maharashtra': 'Mumbai',
    'goa': 'Panaji',
    'kerala': 'Thiruvananthapuram',
    'gujarat': 'Gandhinagar',
    'rajasthan': 'Jaipur',
    'punjab': 'Chandigarh',
    'haryana': 'Chandigarh',
    'uttar pradesh': 'Lucknow',
    'bihar': 'Patna',
    'west bengal': 'Kolkata',
    'odisha': 'Bhubaneswar',
    'assam': 'Dispur',
    'madhya pradesh': 'Bhopal',
    'himachal pradesh': 'Shimla',
    'jharkhand': 'Ranchi',
    'chhattisgarh': 'Raipur',
    'uttarakhand': 'Dehradun'
  };
  return stateCapitals[stateName.toLowerCase()] || null;
}


// Get tourist attractions in a location - OPTIMIZED TO AVOID TIMEOUT
async function getTouristAttractions(locationName, lat, lon, locationType, limit = 25) {
  
  try {
    console.log(`📍 Searching attractions for: ${locationName} at ${lat},${lon}`);
    
    const radius = locationType === 'state' ? 15000 : 10000; // 15km for states, 10km for cities
    const allResults = [];
    
    // TRY MULTIPLE SIMPLE QUERIES
    const queries = [
      // Query 1: Just tourism
      `[out:json][timeout:5];node["tourism"](around:${radius},${lat},${lon});out;`,
      
      // Query 2: Just historic (after delay)
      `[out:json][timeout:5];node["historic"](around:${radius},${lat},${lon});out;`
    ];
    
    // Execute queries one by one
    for (let i = 0; i < queries.length; i++) {
      try {
        console.log(`📡 Query ${i+1} for ${locationName}`);
        
        const response = await axios.post(
          'https://overpass-api.de/api/interpreter',
          queries[i],
          { 
            headers: { 'Content-Type': 'text/plain' },
            timeout: 6000 // 6 seconds
          }
        );
        
        console.log(`✅ Query ${i+1}: ${response.data.elements?.length || 0} results`);
        
        // Process results
        response.data.elements.forEach(element => {
          const tags = element.tags || {};
          const placeType = tags.tourism || tags.historic || 'attraction';
          
          allResults.push({
            id: element.id,
            name: tags.name || tags['name:en'] || tags['name:hi'] || tags['name:te'] || `Place in ${locationName}`,
            type: placeType,
            description: generateDescription(tags, locationName),
            lat: element.lat || (element.center && element.center.lat),
            lon: element.lon || (element.center && element.center.lon),
            tags: tags,
            category: getCategoryFromTags(tags),
            importance: calculateImportance(tags, placeType, locationName),
            contact: {
              phone: tags.phone,
              website: tags.website,
              opening_hours: tags.opening_hours
            },
            address: {
              street: tags['addr:street'],
              city: tags['addr:city']
            }
          });
        });
        
        // Add small delay between queries
        if (i < queries.length - 1) {
          await delay(1000);
        }
        
      } catch (queryError) {
        console.log(`⚠️  Query ${i+1} failed:`, queryError.message);
        // Continue with next query
      }
    }
    
    console.log(`📊 Total results for ${locationName}: ${allResults.length}`);
    
    // Basic filtering
    const filteredPlaces = allResults.filter(place => {
      const name = place.name.toLowerCase();
      return !name.includes('place in') && 
             name.length > 3 &&
             !name.includes('parking') &&
             !name.includes('canteen') &&
             !name.includes('hostel') &&
             !name.includes('dormitory');
    });

    // Remove duplicates
    const uniquePlaces = [];
    const seenIds = new Set();
    
    for (const place of filteredPlaces) {
      if (!seenIds.has(place.id)) {
        seenIds.add(place.id);
        uniquePlaces.push(place);
      }
    }

    // Sort by importance
    const sortedPlaces = uniquePlaces.sort((a, b) => b.importance - a.importance);
    
    return sortedPlaces.slice(0, limit);

  } catch (error) {
    console.error(`❌ Overall error for ${locationName}:`, error.message);
    return [];
  }
}

// Calculate importance score for a place
function calculateImportance(tags, type, locationName) {
  let score = 0;
  
  // Type importance - BEACHES GET HIGHEST SCORE
  const typeScores = {
    'beach': 200,      // Highest priority
    'museum': 100,
    'monument': 95,
    'castle': 90,
    'fort': 85,
    'cathedral': 80,
    'temple': 75,
    'attraction': 70,
    'gallery': 65,
    'park': 60,
    'hotel': 50,
    'restaurant': 40,
    'cafe': 30,
    'place_of_worship': 25
  };
  
  score += typeScores[type] || 20;
  
  // Beach name check
  const name = (tags.name || '').toLowerCase();
  if (name.includes('beach')) score += 100;
  
  // Has Wikipedia entry
  if (tags.wikipedia) score += 100;
  
  // Has website
  if (tags.website) score += 50;
  
  // Has phone
  if (tags.phone) score += 30;
  
  // Has description
  if (tags.description) score += 40;
  
  return score;
}

// Get travel information for a location
async function getTravelInformation(locationName, locationType, country) {
  const info = {
    bestTimeToVisit: '',
    currency: '',
    language: '',
    timezone: '',
    tips: []
  };
  
  // Country-specific information
  const countryInfo = {
    'India': {
      currency: 'Indian Rupee (₹)',
      language: 'Hindi, English + regional languages',
      timezone: 'IST (UTC+5:30)',
      tips: [
        'Bargain at local markets',
        'Drink bottled water',
        'Respect religious customs',
        'Carry cash for small shops',
        'Dress modestly at religious sites'
      ]
    },
    'USA': {
      currency: 'US Dollar ($)',
      language: 'English',
      timezone: 'Multiple timezones',
      tips: [
        'Tip 15-20% at restaurants',
        'Carry identification',
        'Check local laws'
      ]
    },
    'France': {
      currency: 'Euro (€)',
      language: 'French',
      timezone: 'CET (UTC+1)',
      tips: [
        'Learn basic French phrases',
        'Respect meal times',
        'Use public transport'
      ]
    },
    'United Kingdom': {
      currency: 'British Pound (£)',
      language: 'English',
      timezone: 'GMT/BST (UTC+0/+1)',
      tips: [
        'Use Oyster card for London transport',
        'Book attractions in advance',
        'Carry umbrella'
      ]
    },
  };
  
  if (countryInfo[country]) {
    info.currency = countryInfo[country].currency;
    info.language = countryInfo[country].language;
    info.timezone = countryInfo[country].timezone;
    info.tips = countryInfo[country].tips;
  }
  
  // Best time to visit
  if (country === 'India') {
    if (locationType === 'city' || locationType === 'state') {
      info.bestTimeToVisit = 'October to March (winter season)';
    } else if (locationName.toLowerCase().includes('beach')) {
      info.bestTimeToVisit = 'November to February (avoid monsoon)';
    } else if (locationName.toLowerCase().includes('hill') || locationName.toLowerCase().includes('mountain')) {
      info.bestTimeToVisit = 'April to June, September to November';
    } else {
      info.bestTimeToVisit = 'Check local weather patterns';
    }
  } else if (country === 'France' || country === 'United Kingdom') {
    info.bestTimeToVisit = 'April to June, September to October';
  } else {
    info.bestTimeToVisit = 'Spring or Autumn for pleasant weather';
  }
  
  return info;
}

// MAIN SEARCH SUGGESTIONS API
router.get('/suggestions', async (req, res) => {
  try {
    const { q, country } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, suggestions: [] });
    }
    
    const query = q.trim();
    console.log(`🔍 Suggestions for: "${query}"`);
    
    // Check cache
    const cacheKey = `suggest:${query}:${country || 'global'}`;
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return res.json({ success: true, suggestions: cached.data });
      }
    }
    
    // Search for locations
    const params = { limit: 15 };
    if (country) params.countrycodes = country;
    
    const results = await searchNominatim(query, params);
    
    const suggestions = results.map(item => {
      const location = getLocationDetails(item);
      
      return {
        id: item.place_id,
        name: cleanName(item.display_name),
        fullName: item.display_name,
        type: location.type,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        country: location.country,
        state: location.state,
        city: location.city,
        importance: item.importance || 0,
        icon: getIconForType(location.type)
      };
    });
    
    // Remove duplicates
    const uniqueSuggestions = [];
    const seen = new Set();
    
    for (const suggestion of suggestions) {
      const key = `${suggestion.name}_${suggestion.type}_${suggestion.country}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSuggestions.push(suggestion);
      }
    }
    
    // Sort: cities first, then by importance
    uniqueSuggestions.sort((a, b) => {
      const typeOrder = { 'city': 1, 'state': 2, 'country': 3, 'attraction': 4, 'place': 5 };
      const orderA = typeOrder[a.type] || 10;
      const orderB = typeOrder[b.type] || 10;
      if (orderA !== orderB) return orderA - orderB;
      return (b.importance || 0) - (a.importance || 0);
    });
    
    const finalSuggestions = uniqueSuggestions.slice(0, 12);
    
    // Cache results
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      data: finalSuggestions
    });
    
    // Clean old cache entries
    cleanCache();
    
    res.json({ 
      success: true,
      suggestions: finalSuggestions
    });
    
  } catch (error) {
    console.error('❌ Suggestions error:', error.message);
    res.json({ 
      success: true,
      suggestions: []
    });
  }
});

// PROFESSIONAL SEARCH RESULTS API
router.get('/results', async (req, res) => {
  try {
    const { q, limit = 25, type } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({ 
        success: true, 
        query: q || '',
        places: [],
        totalResults: 0,
        searchType: 'none'
      });
    }
    
    const query = q.trim();
    console.log(`🔍 Search for: "${query}"`);
    
    // Check cache
    const cacheKey = `results:${query}:${limit}:${type || 'general'}`;
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return res.json(cached.data);
      }
    }
    
    // Parse the query
    const parsedQuery = parseSearchQuery(query);
    
    // Handle "X in Y" category searches
    if (parsedQuery.type === 'category_in_location') {
      console.log(`🏷️  Category search: ${parsedQuery.category} in ${parsedQuery.location}`);
      
      // First find the location
      const locationResults = await searchNominatim(parsedQuery.location, { limit: 5 });
      
      if (locationResults.length === 0) {
        return res.json({
          success: true,
          query: query,
          places: [],
          totalResults: 0,
          searchType: 'category',
          message: `Location "${parsedQuery.location}" not found`
        });
      }
      
      const location = locationResults[0];
      const locationDetails = getLocationDetails(location);
      
      // Search for the category in this location
      const categoryResults = await searchCategoryInLocation(
        parsedQuery.category,
        parsedQuery.location,
        parseFloat(location.lat),
        parseFloat(location.lon),
        locationDetails.type
      );
      
      // Get travel information
      const travelInfo = await getTravelInformation(
        locationDetails.city || parsedQuery.location,
        locationDetails.type,
        locationDetails.country
      );
      
      const result = {
        success: true,
        query: query,
        location: {
          name: cleanName(location.display_name),
          fullName: location.display_name,
          lat: parseFloat(location.lat),
          lon: parseFloat(location.lon),
          country: locationDetails.country,
          state: locationDetails.state,
          city: locationDetails.city,
          type: locationDetails.type
        },
        travelInfo: travelInfo,
        places: categoryResults.slice(0, limit),
        totalResults: categoryResults.length,
        searchType: 'category',
        category: parsedQuery.category,
        locationName: parsedQuery.location,
        metadata: {
          note: categoryResults.length === 0 ? 
            'No specific results found. Try searching for individual cities.' : 
            `Found ${categoryResults.length} results`
        }
      };
      
      // Cache the result
      searchCache.set(cacheKey, {
        timestamp: Date.now(),
        data: result
      });
      
      return res.json(result);
    }
    
    // Handle famous landmark searches
    if (parsedQuery.type === 'landmark') {
      console.log(`🏛️  Famous landmark search: "${parsedQuery.searchTerm}"`);
      
      const results = await searchNominatim(parsedQuery.searchTerm, { limit: 3 });
      
      if (results.length === 0) {
        return res.json({
          success: true,
          query: query,
          places: [],
          totalResults: 0,
          searchType: 'landmark',
          message: 'Landmark not found'
        });
      }
      
      const mainResult = results[0];
      const location = getLocationDetails(mainResult);
      
      // Get related attractions
      const relatedAttractions = await getTouristAttractions(
        cleanName(mainResult.display_name),
        parseFloat(mainResult.lat),
        parseFloat(mainResult.lon),
        'attraction',
        10
      );
      
      const travelInfo = await getTravelInformation(
        location.city || cleanName(mainResult.display_name),
        'attraction',
        location.country
      );
      
      const mainPlace = {
        id: mainResult.place_id,
        name: cleanName(mainResult.display_name),
        type: 'landmark',
        description: generateLandmarkDescription(cleanName(mainResult.display_name), location.country),
        lat: parseFloat(mainResult.lat),
        lon: parseFloat(mainResult.lon),
        tags: {},
        category: 'sightseeing',
        isMainResult: true,
        importance: 100
      };
      
      const allPlaces = [mainPlace, ...relatedAttractions];
      
      const result = {
        success: true,
        query: query,
        location: {
          name: location.city || cleanName(mainResult.display_name),
          fullName: mainResult.display_name,
          lat: parseFloat(mainResult.lat),
          lon: parseFloat(mainResult.lon),
          country: location.country,
          state: location.state,
          city: location.city,
          type: 'landmark'
        },
        travelInfo: travelInfo,
        places: allPlaces.slice(0, limit),
        totalResults: allPlaces.length,
        searchType: 'landmark',
        isFamousPlace: true
      };
      
      searchCache.set(cacheKey, {
        timestamp: Date.now(),
        data: result
      });
      
      return res.json(result);
    }
    
    // Handle general searches (city, state, country)
    console.log(`🌍 General search: "${parsedQuery.searchTerm}"`);
    
    // Try multiple search strategies
    let results = await searchNominatim(parsedQuery.searchTerm, { 
      limit: 5,
      
    });

    // If no city found, try without featuretype
    if (results.length === 0) {
      results = await searchNominatim(parsedQuery.searchTerm, {
         limit: 5,
         featuretype: ['city', 'town', 'village', 'state', 'country']
      });
    }
    
    if (results.length === 0) {
      return res.json({
        success: true,
        query: query,
        places: [],
        totalResults: 0,
        searchType: 'general',
        message: 'No results found'
      });
    }
    
    const mainResult = results[0];
    const location = getLocationDetails(mainResult);
    
    // Get tourist attractions for this location
    const touristAttractions = await getTouristAttractions(
      cleanName(mainResult.display_name),
      parseFloat(mainResult.lat),
      parseFloat(mainResult.lon),
      location.type,
      limit
    );
    
    // Get travel information
    const travelInfo = await getTravelInformation(
      location.city || cleanName(mainResult.display_name),
      location.type,
      location.country
    );
    
    const result = {
      success: true,
      query: query,
      location: {
        name: cleanName(mainResult.display_name),
        fullName: mainResult.display_name,
        lat: parseFloat(mainResult.lat),
        lon: parseFloat(mainResult.lon),
        country: location.country,
        state: location.state,
        city: location.city,
        type: location.type,
        importance: mainResult.importance || 0
      },
      travelInfo: travelInfo,
      places: touristAttractions,
      totalResults: touristAttractions.length,
      searchType: location.type,
      isFamousPlace: false
    };
    
    // Cache the result
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      data: result
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Professional search error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Search service temporarily unavailable',
      message: error.message
    });
  }
});

// Helper functions
function generateDescription(tags, locationName) {
  const type = tags.tourism || tags.historic || tags.natural || tags.building || tags.leisure || tags.amenity || 'attraction';
  const name = tags.name || 'Tourist attraction';
  
  const descriptions = {
    'attraction': `${name} - A popular tourist attraction${locationName ? ` in ${locationName}` : ''}.`,
    'museum': `${name} - Museum${locationName ? ` in ${locationName}` : ''} featuring cultural exhibits.`,
    'monument': `${name} - Historical monument${locationName ? ` in ${locationName}` : ''}.`,
    'castle': `${name} - Historic castle${locationName ? ` in ${locationName}` : ''}.`,
    'fort': `${name} - Historic fort${locationName ? ` in ${locationName}` : ''}.`,
    'church': `${name} - Religious site${locationName ? ` in ${locationName}` : ''}.`,
    'temple': `${name} - Temple${locationName ? ` in ${locationName}` : ''}.`,
    'mosque': `${name} - Mosque${locationName ? ` in ${locationName}` : ''}.`,
    'place_of_worship': `${name} - Place of worship${locationName ? ` in ${locationName}` : ''}.`,
    'beach': `${name} - Beautiful beach${locationName ? ` near ${locationName}` : ''}.`,
    'park': `${name} - Park${locationName ? ` in ${locationName}` : ''} for recreation.`,
    'garden': `${name} - Garden${locationName ? ` in ${locationName}` : ''}.`,
    'zoo': `${name} - Zoo${locationName ? ` in ${locationName}` : ''}.`,
    'aquarium': `${name} - Aquarium${locationName ? ` in ${locationName}` : ''}.`,
    'stadium': `${name} - Sports stadium${locationName ? ` in ${locationName}` : ''}.`,
    'hotel': `${name} - Hotel${locationName ? ` in ${locationName}` : ''}.`,
    'restaurant': `${name} - Restaurant${locationName ? ` in ${locationName}` : ''}.`,
    'cafe': `${name} - Cafe${locationName ? ` in ${locationName}` : ''}.`
  };
  
  return descriptions[type] || `${name} - Tourist destination${locationName ? ` in ${locationName}` : ''}.`;
}

function generateCategoryDescription(tags, category, location) {
  const name = tags.name || `${category} in ${location}`;
  
  const categoryDescriptions = {
    'hotel': `${name} - Hotel in ${location}. ${tags.description || 'Accommodation option.'}`,
    'restaurant': `${name} - Restaurant in ${location}. ${tags.cuisine ? `Serves ${tags.cuisine} cuisine.` : 'Dining establishment.'}`,
    'beach': `${name} - Beach in ${location}. ${tags.description || 'Sandy beach area.'}`,
    'park': `${name} - Park in ${location}. ${tags.description || 'Green space for recreation.'}`,
    'museum': `${name} - Museum in ${location}. ${tags.description || 'Cultural institution.'}`,
    'temple': `${name} - Temple in ${location}. ${tags.religion ? `${tags.religion} temple.` : 'Place of worship.'}`,
    'mall': `${name} - Shopping mall in ${location}. ${tags.description || 'Shopping center.'}`,
    'airport': `${name} - Airport in ${location}. ${tags.description || 'Air transportation hub.'}`,
    'hospital': `${name} - Hospital in ${location}. ${tags.description || 'Medical facility.'}`,
    'cafe': `${name} - Cafe in ${location}. ${tags.description || 'Coffee shop.'}`,
    'bar': `${name} - Bar in ${location}. ${tags.description || 'Drinking establishment.'}`,
    'hostel': `${name} - Hostel in ${location}. ${tags.description || 'Budget accommodation.'}`,
    'university': `${name} - University in ${location}. ${tags.description || 'Educational institution.'}`,
    'stadium': `${name} - Stadium in ${location}. ${tags.description || 'Sports venue.'}`,
    'zoo': `${name} - Zoo in ${location}. ${tags.description || 'Animal park.'}`,
    'aquarium': `${name} - Aquarium in ${location}. ${tags.description || 'Marine life exhibition.'}`,
    'fort': `${name} - Historic fort in ${location}. ${tags.description || 'Ancient fortification.'}`,
    'palace': `${name} - Palace in ${location}. ${tags.description || 'Royal residence.'}`,
    'garden': `${name} - Garden in ${location}. ${tags.description || 'Beautiful garden area.'}`
  };
  
  return categoryDescriptions[category.toLowerCase()] || `${name} in ${location}.`;
}

function generateLandmarkDescription(landmarkName, country) {
  const landmarkDescriptions = {
    'Taj Mahal': `The Taj Mahal in ${country} is an ivory-white marble mausoleum and one of the Seven Wonders of the World. Built by Mughal Emperor Shah Jahan in memory of his wife Mumtaz Mahal.`,
    'Eiffel Tower': `The Eiffel Tower in ${country} is a wrought-iron lattice tower and global cultural icon of France. One of the most visited monuments in the world.`,
    'Statue of Liberty': `The Statue of Liberty in ${country} is a colossal neoclassical sculpture and a symbol of freedom and democracy. Gifted by France to the United States.`,
    'Gateway of India': `The Gateway of India in ${country} is an arch-monument built in the early 20th century in Mumbai. It has become a popular tourist attraction and gathering spot.`,
    'Charminar': `The Charminar in ${country} is a monument and mosque located in Hyderabad. Built in 1591, it is a global icon of Hyderabad.`,
    'Hawa Mahal': `The Hawa Mahal (Palace of Winds) in ${country} is a palace in Jaipur built from red and pink sandstone. Known for its unique honeycomb structure.`,
    'India Gate': `The India Gate in ${country} is a war memorial located in New Delhi. It commemorates Indian soldiers who died in World War I.`,
    'Red Fort': `The Red Fort in ${country} is a historic fort in Delhi that served as the main residence of the Mughal Emperors.`,
    'Qutub Minar': `The Qutub Minar in ${country} is a minaret and victory tower that forms part of the Qutb complex, a UNESCO World Heritage Site.`
  };
  
  return landmarkDescriptions[landmarkName] || 
    `${landmarkName} in ${country} - A famous tourist attraction and landmark.`;
}

function getCategoryFromTags(tags, searchCategory = '') {
  const type = tags.tourism || tags.historic || tags.natural || tags.building || tags.leisure || tags.amenity || '';
  
  // Map OSM tags to categories
  if (type.includes('museum') || type.includes('gallery')) return 'culture';
  if (type.includes('monument') || type.includes('castle') || type.includes('fort') || type.includes('memorial')) return 'historic';
  if (type.includes('beach') || type.includes('peak') || type.includes('waterfall') || type.includes('volcano') || type.includes('cave')) return 'nature';
  if (type.includes('attraction') || type.includes('viewpoint') || type.includes('theme_park')) return 'sightseeing';
  if (type.includes('zoo') || type.includes('aquarium')) return 'entertainment';
  if (type.includes('church') || type.includes('cathedral') || type.includes('mosque') || type.includes('temple') || type.includes('shrine') || type.includes('place_of_worship')) return 'religious';
  if (type.includes('park') || type.includes('garden')) return 'leisure';
  if (type.includes('hotel') || type.includes('hostel') || type.includes('guest_house') || type.includes('motel')) return 'accommodation';
  if (type.includes('restaurant') || type.includes('cafe') || type.includes('fast_food') || type.includes('bar') || type.includes('pub')) return 'food';
  if (type.includes('shop') || type.includes('mall') || type.includes('market')) return 'shopping';
  if (type.includes('university') || type.includes('college') || type.includes('school')) return 'education';
  if (type.includes('hospital') || type.includes('clinic') || type.includes('pharmacy')) return 'health';
  if (type.includes('airport') || type.includes('station') || type.includes('bus_station')) return 'transport';
  
  // Fallback to search category
  if (searchCategory) {
    if (['hotel', 'hostel', 'resort'].includes(searchCategory)) return 'accommodation';
    if (['restaurant', 'cafe', 'bar', 'pub'].includes(searchCategory)) return 'food';
    if (['museum', 'gallery', 'theater'].includes(searchCategory)) return 'culture';
    if (['beach', 'park', 'lake', 'mountain'].includes(searchCategory)) return 'nature';
    if (['temple', 'church', 'mosque', 'gurudwara'].includes(searchCategory)) return 'religious';
    if (['mall', 'market'].includes(searchCategory)) return 'shopping';
    if (['fort', 'palace'].includes(searchCategory)) return 'historic';
  }
  
  return 'general';
}

function getIconForType(type) {
  const icons = {
    'city': '🏙️',
    'state': '🗺️',
    'country': '🌍',
    'attraction': '🏛️',
    'place': '📍',
    'landmark': '🗽',
    'beach': '🏖️',
    'mountain': '⛰️',
    'park': '🌳',
    'museum': '🏛️',
    'temple': '🛕',
    'church': '⛪',
    'mosque': '🕌',
    'hotel': '🏨',
    'restaurant': '🍽️',
    'fort': '🏰',
    'palace': '🏯',
    'garden': '🌷'
  };
  return icons[type] || '📍';
}

function cleanCache() {
  const now = Date.now();
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      searchCache.delete(key);
    }
  }
  
  // Limit total cache size
  if (searchCache.size > 500) {
    const keys = Array.from(searchCache.keys()).slice(0, 100);
    keys.forEach(key => searchCache.delete(key));
  }
}

// Clear cache endpoint
router.delete('/cache', (req, res) => {
  const size = searchCache.size;
  searchCache.clear();
  res.json({
    success: true,
    message: `Cleared ${size} cached searches`
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    cacheSize: searchCache.size,
    endpoints: ['/suggestions', '/results', '/cache', '/health'],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;