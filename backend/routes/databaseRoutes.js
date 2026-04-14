const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB Atlas using environment variable
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/travelguide', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Database connected'))
.catch(err => console.error('❌ Database connection error:', err));

// Define Location Schema
const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['country', 'state', 'city', 'region'] },
  description: String,
  images: [String],
  rating: { type: Number, min: 1, max: 5 },
  bestTimeToVisit: String,
  coordinates: {
    lat: Number,
    lon: Number
  },
  createdAt: { type: Date, default: Date.now }
});

// Define Place Schema
const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  locationName: String,
  city: String,
  state: String,
  country: String,
  category: { 
    type: String, 
    enum: ['monument', 'temple', 'beach', 'fort', 'park', 'museum', 'historical', 'natural', 'hillstation', 'waterfall', 'palace', 'city'] 
  },
  description: String,
  rating: { type: Number, min: 1, max: 5 },
  images: [String],
  tags: [String],
  bestTimeToVisit: String,
  entryFee: String,
  openingHours: String,
  coordinates: {
    lat: Number,
    lon: Number
  },
  createdAt: { type: Date, default: Date.now }
});

// Create models
const Location = mongoose.model('Location', locationSchema);
const Place = mongoose.model('Place', placeSchema);

// ==================== API ROUTES ====================

// 1. SEARCH LOCATIONS
router.get('/locations/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({ 
        success: true, 
        locations: []
      });
    }

    const searchRegex = new RegExp(q, 'i');
    
    const locations = await Location.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    }).limit(10).sort({ rating: -1 });

    res.json({
      success: true,
      locations: locations,
      count: locations.length
    });

  } catch (error) {
    console.error('Location search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// 2. GET LOCATION BY NAME
router.get('/locations/:name', async (req, res) => {
  try {
    const locationName = decodeURIComponent(req.params.name);
    const location = await Location.findOne({ name: new RegExp(locationName, 'i') });
    
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }

    // Get places for this location
    const places = await Place.find({
      $or: [
        { locationName: location.name },
        { city: location.name },
        { state: location.name }
      ]
    }).limit(20).sort({ rating: -1 });

    res.json({
      success: true,
      location: location,
      places: places,
      placesCount: places.length
    });

  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch location'
    });
  }
});

// 3. GET PLACES BY LOCATION
router.get('/places', async (req, res) => {
  try {
    const { locationName, city, category, limit = 20 } = req.query;
    
    let query = {};
    
    if (locationName) {
      query.locationName = locationName;
    }
    
    if (city) {
      query.city = new RegExp(city, 'i');
    }
    
    if (category) {
      query.category = category;
    }

    const places = await Place.find(query)
      .limit(parseInt(limit))
      .sort({ rating: -1 });

    res.json({
      success: true,
      places: places,
      count: places.length
    });

  } catch (error) {
    console.error('Get places error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch places'
    });
  }
});

// 4. SEARCH PLACES
router.get('/places/search', async (req, res) => {
  try {
    const { q, limit = 15 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({ 
        success: true, 
        places: [] 
      });
    }

    const searchRegex = new RegExp(q, 'i');
    
    const places = await Place.find({
      $or: [
        { name: searchRegex },
        { city: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ]
    }).limit(parseInt(limit)).sort({ rating: -1 });

    res.json({
      success: true,
      places: places,
      count: places.length
    });

  } catch (error) {
    console.error('Place search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// 5. COMPREHENSIVE SEARCH (MAIN SEARCH)
// COMPREHENSIVE SEARCH - SIMPLE VERSION
router.get('/search/comprehensive', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.json({ success: true, result: null, places: [] });
    }

    const searchRegex = new RegExp(q, 'i');
    
    // 1. Check if it's a LOCATION first
    let location = await Location.findOne({ name: searchRegex });
    
    let targetLocationName = "";
    let result = null;
    let resultType = "location";

    if (location) {
      // It's a LOCATION search
      result = location;
      targetLocationName = location.name; // Use location's name
    } else {
      // 2. Check if it's a PLACE
      const place = await Place.findOne({ name: searchRegex });
      
      if (place) {
        // It's a PLACE search
        result = place;
        resultType = "place";
        targetLocationName = place.locationName; // Use place's locationName
      }
    }

    // 3. Get ALL places for the target location
    let places = [];
    if (targetLocationName) {
      places = await Place.find({ 
        locationName: targetLocationName 
      }).limit(25).sort({ rating: -1 });
    }

    res.json({
      success: true,
      query: q,
      result: result,
      resultType: resultType,
      places: places,
      placesCount: places.length,
      targetLocation: targetLocationName // For debugging
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// 6. GET ALL LOCATIONS (for dropdowns)
router.get('/locations/all', async (req, res) => {
  try {
    const locations = await Location.find({})
      .sort({ name: 1 })
      .select('name type');

    res.json({
      success: true,
      locations: locations,
      count: locations.length
    });

  } catch (error) {
    console.error('Get all locations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch locations'
    });
  }
});

// 7. ADD LOCATION (Admin)
router.post('/locations/add', async (req, res) => {
  try {
    const location = new Location(req.body);
    await location.save();
    
    res.json({
      success: true,
      message: 'Location added successfully',
      location: location
    });

  } catch (error) {
    console.error('Add location error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 8. ADD PLACE (Admin)
router.post('/places/add', async (req, res) => {
  try {
    const place = new Place(req.body);
    await place.save();
    
    res.json({
      success: true,
      message: 'Place added successfully',
      place: place
    });

  } catch (error) {
    console.error('Add place error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 9. HEALTH CHECK
router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  
  res.json({
    success: true,
    status: 'API is running',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /locations/search?q=...',
      'GET /locations/:name',
      'GET /places?locationName=...',
      'GET /places/search?q=...',
      'GET /search/comprehensive?q=...',
      'GET /locations/all',
      'POST /locations/add',
      'POST /places/add'
    ]
  });
});

module.exports = router;