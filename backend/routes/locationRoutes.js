const express = require('express');
const router = express.Router();
const axios = require('axios');

// Helper function to get Wikipedia description
async function getPlaceDescription(placeName, tags) {
  try {
    // Try Wikipedia API
    const response = await axios.get(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`,
      { timeout: 2000 }
    );
    
    if (response.data && response.data.extract) {
      return response.data.extract.substring(0, 150) + '...';
    }
  } catch (error) {
    // Fallback descriptions based on tags
    if (tags?.tourism === 'hotel') return "A comfortable hotel for travelers.";
    if (tags?.tourism === 'hostel') return "A budget-friendly accommodation option.";
    if (tags?.tourism === 'attraction') return "A popular tourist attraction worth visiting.";
    if (tags?.historic) return "A site of historical importance.";
    if (tags?.natural === 'beach') return "A scenic beach perfect for relaxation.";
    if (tags?.natural === 'peak') return "A mountain peak offering great views.";
    if (tags?.leisure === 'park') return "A green park ideal for leisure activities.";
    if (tags?.amenity === 'restaurant') return "A restaurant serving delicious food.";
    if (tags?.amenity === 'cafe') return "A cozy cafe for refreshments.";
    if (tags?.amenity === 'bar') return "A bar for drinks and socializing.";
    
    return "An interesting place to visit on your journey.";
  }
}


// Helper: Get category-based image (ALWAYS returns image)
async function getPlaceImage(type) {
  // Direct Unsplash image URLs - no API needed
  const imageUrls = {
    'hotel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop',
    'hostel': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop',
    'apartment': 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=250&fit=crop',
    'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop',
    'cafe': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=250&fit=crop',
    'bar': 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=250&fit=crop',
    'pub': 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&h=250&fit=crop',
    'beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop',
    'park': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop',
    'garden': 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=250&fit=crop',
    'museum': 'https://images.unsplash.com/photo-1534008897995-27a23e859048?w=400&h=250&fit=crop',
    'artwork': 'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=250&fit=crop',
    'historic': 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=250&fit=crop',
    'mountain': 'https://images.unsplash.com/photo-1464278533981-50106e6176b1?w=400&h=250&fit=crop',
    'waterfall': 'https://images.unsplash.com/photo-1512273222628-4daea6e55abb?w=400&h=250&fit=crop',
    'cliff': 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=250&fit=crop',
    'stadium': 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=400&h=250&fit=crop',
    'golf': 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=250&fit=crop',
    'nature_reserve': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=250&fit=crop',
    'zoo': 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&h=250&fit=crop',
    'theme_park': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop',
    'attraction': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=250&fit=crop',
    'viewpoint': 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=250&fit=crop',
    'default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=250&fit=crop'
  };

  return imageUrls[type] || imageUrls['default'];
}

// Get location suggestions - ONLY CITIES/STATES/COUNTRIES
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ 
        success: true,
        data: [] 
      });
    }

    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search`,
      {
        params: {
          q,
          format: 'json',
          limit: 20,
          featuretype: 'settlement',
          countrycodes: 'in,us,gb,ca,au,de,fr,jp,cn',
          'accept-language': 'en',
          addressdetails: 1,
          bounded: 0,
          dedupe: 1,
          polygon_geojson: 0
        },
        headers: {
          'User-Agent': 'TravelGuideApp/1.0'
        }
      }
    );

    const locations = response.data
      .filter(item => {
        const type = item.type || item.class;
        const name = (item.display_name || '').toLowerCase();
        const searchLower = q.toLowerCase();
        
        if (name.includes(searchLower) && 
            (type === 'city' || type === 'town' || type === 'village')) {
          return true;
        }
        
        if (type === 'administrative' || type === 'state' || type === 'country') {
          return true;
        }
        
        return false;
      })
      .map(item => {
        let displayName = '';
        const type = item.type || item.class;
        
        if (item.address) {
          if (item.address.city) {
            displayName = `${item.address.city}, ${item.address.country || item.address.state || 'Unknown'}`;
          } else if (item.address.town) {
            displayName = `${item.address.town}, ${item.address.state || item.address.country || 'Unknown'}`;
          } else if (item.address.village) {
            displayName = `${item.address.village}, ${item.address.state || item.address.country || 'Unknown'}`;
          } else if (item.address.state) {
            displayName = `${item.address.state}, ${item.address.country || 'Unknown'}`;
          } else if (item.address.country) {
            displayName = item.address.country;
          }
        }
        
        if (!displayName && item.display_name) {
          const parts = item.display_name.split(',');
          if (parts.length >= 2) {
            const first = parts[0].trim();
            const last = parts[parts.length - 1].trim();
            displayName = `${first}, ${last}`;
          } else {
            displayName = item.display_name;
          }
        }
        
        let readableType = type;
        if (type === 'administrative') readableType = 'Region';
        if (type === 'settlement') readableType = 'City/Town';
        
        return {
          name: displayName,
          lat: item.lat,
          lon: item.lon,
          type: readableType,
          importance: item.importance || 0,
          address: item.address
        };
      })
      .filter((item, index, self) =>
        index === self.findIndex(t => t.name.toLowerCase() === item.name.toLowerCase())
      )
      .sort((a, b) => {
        const searchLower = q.toLowerCase();
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        if (aName.startsWith(searchLower) && !bName.startsWith(searchLower)) return -1;
        if (!aName.startsWith(searchLower) && bName.startsWith(searchLower)) return 1;
        
        return b.importance - a.importance;
      })
      .slice(0, 10);

    res.json({
      success: true,
      data: locations
    });

  } catch (error) {
    console.error('Location search error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search locations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get tourist places within a city
router.get('/city-places', async (req, res) => {
  try {
    const { city, lat, lon } = req.query;
    
    if (!city || !lat || !lon) {
      return res.json({ 
        success: true,
        data: [] 
      });
    }

    const overpassQuery = `
      [out:json][timeout:15];
      (
        node["tourism"~"attraction|museum|hotel|guest_house|hostel|apartment|artwork|zoo|theme_park"]
          (around:10000,${lat},${lon});
        node["historic"](around:10000,${lat},${lon});
        node["leisure"~"park|garden|stadium|golf_course"]
          (around:10000,${lat},${lon});
        node["amenity"~"restaurant|cafe|bar|pub|fast_food"]
          (around:10000,${lat},${lon});
      );
      out body;
      >;
      out skel qt;
    `;

    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      overpassQuery,
      { headers: { 'Content-Type': 'text/plain' } }
    );

    const places = response.data.elements
      .filter(element => element.tags && element.tags.name)
      .map(element => ({
        id: element.id,
        name: element.tags.name,
        category: element.tags.tourism || element.tags.historic || 
                 element.tags.leisure || element.tags.amenity || 'place',
        lat: element.lat,
        lon: element.lon
      }))
      .slice(0, 10);

    res.json({
      success: true,
      data: places
    });

  } catch (error) {
    console.error('City places error:', error.message);
    res.json({ 
      success: true,
      data: [] 
    });
  }
});

// Get places along route - WITH DESCRIPTIONS (STEP 1)
router.post('/places-along-route', async (req, res) => {
  try {
    const { startLat, startLon, endLat, endLon } = req.body;
    
    if (!startLat || !startLon || !endLat || !endLon) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coordinates required' 
      });
    }

    // Calculate midpoint
    const midLat = (parseFloat(startLat) + parseFloat(endLat)) / 2;
    const midLon = (parseFloat(startLon) + parseFloat(endLon)) / 2;
    
    // Calculate distance
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371;
    
    const dLat = toRad(endLat - startLat);
    const dLon = toRad(endLon - startLon);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(startLat)) * Math.cos(toRad(endLat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceKm = R * c;
    
    // Set search radius
    const searchRadius = Math.max(20000, Math.min(distanceKm * 500, 100000));

    // Overpass query
    const overpassQuery = `
      [out:json][timeout:30];
      (
        node["tourism"](around:${searchRadius},${midLat},${midLon});
        node["historic"](around:${searchRadius},${midLat},${midLon});
        node["natural"~"beach|peak|cliff|waterfall|volcano"]
          (around:${searchRadius},${midLat},${midLon});
        node["leisure"~"park|garden|stadium|golf_course|nature_reserve"]
          (around:${searchRadius},${midLat},${midLon});
        node["amenity"~"restaurant|cafe|bar|hotel|hostel"]
          (around:${searchRadius},${midLat},${midLon});
      );
      out body;
      >;
      out skel qt;
    `;

    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      overpassQuery,
      { headers: { 'Content-Type': 'text/plain' } }
    );

    // Get all places first
    const placesData = response.data.elements
      .filter(element => element.tags && element.tags.name)
      .map(element => ({
        element,
        tags: element.tags
      }));

    // Process places with descriptions
    const places = [];
    
    for (const { element, tags } of placesData) {
      // Get description for each place
      const description = await getPlaceDescription(tags.name, tags);

      // Get image for each place (NEW)
      
      
      let type = 'attraction';
      let category = 'Attraction';

      const image = await getPlaceImage(tags.name, type); 
      
      if (tags.tourism === 'hotel' || tags.tourism === 'hostel' || tags.tourism === 'guest_house') {
        type = 'hotel';
        category = 'Hotel';
      } 
      else if (tags.tourism === 'apartment') {
        type = 'apartment';
        category = 'Apartment';
      }
      else if (tags.tourism === 'attraction') {
        type = 'attraction';
        category = 'Tourist Attraction';
      }
      else if (tags.tourism === 'museum') {
        type = 'museum';
        category = 'Museum';
      }
      else if (tags.tourism === 'zoo') {
        type = 'zoo';
        category = 'Zoo';
      }
      else if (tags.tourism === 'theme_park') {
        type = 'theme_park';
        category = 'Theme Park';
      }
      else if (tags.tourism === 'artwork') {
        type = 'artwork';
        category = 'Artwork';
      }
      else if (tags.historic) {
        type = 'historic';
        category = 'Historic Site';
      }
      else if (tags.natural === 'beach') {
        type = 'beach';
        category = 'Beach';
      }
      else if (tags.natural === 'peak' || tags.natural === 'volcano') {
        type = 'mountain';
        category = 'Mountain';
      }
      else if (tags.natural === 'waterfall') {
        type = 'waterfall';
        category = 'Waterfall';
      }
      else if (tags.natural === 'cliff') {
        type = 'cliff';
        category = 'Cliff';
      }
      else if (tags.leisure === 'park' || tags.leisure === 'garden') {
        type = 'park';
        category = 'Park/Garden';
      }
      else if (tags.leisure === 'stadium') {
        type = 'stadium';
        category = 'Stadium';
      }
      else if (tags.leisure === 'golf_course') {
        type = 'golf';
        category = 'Golf Course';
      }
      else if (tags.leisure === 'nature_reserve') {
        type = 'nature_reserve';
        category = 'Nature Reserve';
      }
      else if (tags.amenity === 'restaurant') {
        type = 'restaurant';
        category = 'Restaurant';
      }
      else if (tags.amenity === 'cafe') {
        type = 'cafe';
        category = 'Cafe';
      }
      else if (tags.amenity === 'bar' || tags.amenity === 'pub') {
        type = 'bar';
        category = 'Bar/Pub';
      }
      else if (tags.tourism) {
        type = tags.tourism;
        category = 'Tourism';
      }

      places.push({
        id: element.id,
        name: tags.name,
        type: type,
        category: category,
        description: description, // ADDED: Wikipedia description
        image: image, // ADDED: Pixabay image
        lat: element.lat,
        lon: element.lon,
        tags: tags
      });
    }

    // Remove duplicates by name
    const uniquePlaces = places.filter((item, index, self) =>
      index === self.findIndex(t => t.name === item.name)
    );

    // Sort by category then name
    uniquePlaces.sort((a, b) => {
      if (a.category === b.category) {
        return a.name.localeCompare(b.name);
      }
      return a.category.localeCompare(b.category);
    });

    res.json({
      success: true,
      data: uniquePlaces
    });

  } catch (error) {
    console.error('Overpass API error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch places',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;