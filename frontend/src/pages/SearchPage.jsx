import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './SearchPage.css';

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    
    setSearchQuery(query);
    setSearchType(type);
    
    if (query) {
      fetchSearchResults(query, type);
    } else {
      setLoading(false);
      setResults(null);
    }
  }, [location]);

  const fetchSearchResults = async (query, type) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `http://localhost:5000/api/search/results?q=${encodeURIComponent(query)}&type=${type}`
      );
      
      if (response.data.success) {
        setResults(response.data);
      } else {
        setError('No results found');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to load search results');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`);
    }
  };

  const formatType = (type) => {
    const typeMap = {
      'hotel': '🏨 Hotel',
      'museum': '🏛️ Museum',
      'attraction': '📍 Attraction',
      'beach': '🏖️ Beach',
      'park': '🌳 Park',
      'restaurant': '🍽️ Restaurant',
      'monument': '🗽 Monument',
      'historic': '🏺 Historic Site'
    };
    return typeMap[type] || '📍 Place';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'accommodation': 'bg-blue-100 text-blue-800',
      'culture': 'bg-purple-100 text-purple-800',
      'sightseeing': 'bg-green-100 text-green-800',
      'nature': 'bg-emerald-100 text-emerald-800',
      'food': 'bg-orange-100 text-orange-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="search-page">
        <div className="search-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Searching for "{searchQuery}"...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-page">
        <div className="search-container">
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/')} className="back-btn">
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="search-page">
      {/* Search Header */}
      <div className="search-header">
        <div className="search-container">
          <div className="search-header-top">
            <button
               onClick={() => navigate('/')}
               className="back-to-home-btn"
            >
              ← Back to Home
            </button>
          </div>
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destinations..."
              className="search-input-large"
            />
            <button type="submit" className="search-btn-large">
              Search
            </button>
          </form>
          
          {results && (
            <div className="search-info">
              <h1>Search Results for  <span>{results.query}</span></h1>
              {results.city && (
                <div className="city-info">
                  <h2>{results.city.name}, {results.city.country}</h2>
                  <div className="city-location">
                    <span>📍</span> 
                    <span>{results.city.lat.toFixed(4)}, {results.city.lon.toFixed(4)}</span>
                  </div>
                </div>
              )}
              <p className="results-count">
                {results.totalResults} places found
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="results-container">
        {results && results.places.length > 0 ? (
          <div className="places-grid">
            {results.places.map((place) => (
              <div key={place.id} className="place-card">
                <div className="place-header">
                  <h3>{place.name}</h3>
                  <span className="place-type">{formatType(place.type)}</span>
                </div>
                
                <div className="place-content">
                  <p className="place-description">{place.description}</p>
                  
                  <div className="place-details">
                    <span className={`category-badge ${getCategoryColor(place.category)}`}>
                      {place.category}
                    </span>
                    
                    {place.tags && (
                      <div className="place-tags">
                       
                        {place.tags.phone && (
                          <span className="place-phone">📞 {place.tags.phone}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="place-actions">
                    
                    <a 
                      href={`https://www.google.com/maps?q=${place.lat},${place.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-map-btn"
                    >
                      View on Map
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : results && results.city ? (
          <div className="no-results">
            <h2>No specific places found in {results.city.name}</h2>
            <p>But you can explore the city itself!</p>
            <button 
              className="explore-city-btn"
              onClick={() => navigate(`/city/${results.city.name.toLowerCase().replace(/\s+/g, '-')}`)}
            >
              Explore {results.city.name}
            </button>
          </div>
        ) : (
          <div className="no-results">
            <h2>No results found for "{searchQuery}"</h2>
            <p>Try a different search term or check the spelling.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;