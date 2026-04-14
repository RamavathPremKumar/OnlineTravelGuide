import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import './MySearchPage.css';

const MySearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    
    if (query) {
      setSearchQuery(query);
      handleSearch(query);
    }
  }, [location]);

  const handleSearch = async (query) => {
    setLoading(true);
    setError(null);
    setSearchResults(null);
    
    try {
      const data = await apiRequest(
        `/db/search/comprehensive?q=${encodeURIComponent(query)}`
      );
      
      if (data.success) {
        setSearchResults({
          query: data.query,
          result: data.result,
          resultType: data.resultType,
          places: data.places || [],
          placesCount: data.placesCount || 0
        });
      } else {
        setError(`No results found for "${query}"`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating || 0);
    return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
  };

  if (loading) {
    return (
      <div className="search-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Searching for "{searchQuery}"...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-page">
      <div className="container">
        {error ? (
          <div className="error-message">
            <h3>{error}</h3>
            <button onClick={() => navigate('/')} className="home-button">
              Go to Home
            </button>
          </div>
        ) : searchResults ? (
          <>
            {/* Main Result Header - Image on LEFT side */}
            <div className="location-header-section">
              {/* Left Side - Image */}
              <div className="location-image-left">
                {searchResults.result?.images && searchResults.result.images.length > 0 ? (
                  <img 
                    src={searchResults.result.images[0]} 
                    alt={searchResults.result.name}
                    className="location-main-image"
                  />
                ) : (
                  <div className="image-placeholder-large">
                    <span className="placeholder-text">
                      {searchResults.result?.name?.charAt(0) || searchResults.query?.charAt(0) || 'D'}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Right Side - Result Info */}
              <div className="location-info-right">
                <h1 className="location-title">
                  {searchResults.result?.name || searchResults.query}
                </h1>
                
                {searchResults.result?.rating && (
                  <div className="location-rating-large">
                    <span className="stars-large">{renderStars(searchResults.result.rating)}</span>
                    <span className="rating-text-large">
                      {searchResults.result.rating.toFixed(1)}/5.0
                    </span>
                  </div>
                )}
                
                {/* ONLY show description if it exists in database */}
                {searchResults.result?.description && (
                  <p className="location-description-large">
                    {searchResults.result.description}
                  </p>
                )}
                
                {/* Show result type if no description */}
                {!searchResults.result?.description && (
                  <div className="result-type-info">
                    <span className="type-badge">{searchResults.resultType}</span>
                    {searchResults.result?.city && (
                      <span className="location-info">📍 {searchResults.result.city}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Places to Visit Section */}
            {searchResults.places.length > 0 && (
              <div className="places-section">
                <h2 className="section-title">
                  {searchResults.resultType === 'location' 
                    ? `Places to Visit in ${searchResults.result?.name || 'this destination'}`
                    : 'Related Places'
                  }
                  <span className="count-badge">{searchResults.places.length} places</span>
                </h2>
                
                <div className="places-grid">
                  {searchResults.places.map((place) => (
                    <div key={place._id} className="place-card">
                      <div className="place-image">
                        {place.images && place.images.length > 0 ? (
                          <img 
                            src={place.images[0]} 
                            alt={place.name}
                            className="place-card-image"
                          />
                        ) : (
                          <div className="place-image-placeholder">
                            {place.category === 'temple' && '🛕'}
                            {place.category === 'monument' && '🗽'}
                            {place.category === 'beach' && '🏖️'}
                            {place.category === 'fort' && '🏰'}
                            {place.category === 'park' && '🌳'}
                            {!['temple', 'monument', 'beach', 'fort', 'park'].includes(place.category) && '📍'}
                          </div>
                        )}
                      </div>
                      
                      <div className="place-content">
                        <div className="place-header">
                          <h3>{place.name}</h3>
                          <div className="place-meta">
                            <span className="place-city">{place.city}</span>
                            {place.state && <span className="place-state">, {place.state}</span>}
                          </div>
                        </div>
                        
                        {place.rating && (
                          <div className="place-rating">
                            <span className="place-stars">{renderStars(place.rating)}</span>
                            <span className="place-rating-value">{place.rating}/5</span>
                          </div>
                        )}
                        
                        {/* Only show place description if it exists */}
                        {place.description && (
                          <p className="place-description">
                            {place.description.length > 150 
                              ? `${place.description.substring(0, 150)}...` 
                              : place.description}
                          </p>
                        )}
                        
                        <div className="place-details-simple">
                          {place.category && (
                            <span className="category-badge">{place.category}</span>
                          )}
                          {place.entryFee && (
                            <span className="entry-fee-badge">💰 {place.entryFee}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results Message */}
            {!searchResults.result && searchResults.places.length === 0 && (
              <div className="no-results">
                <div className="no-results-content">
                  <h3>No results found for "{searchResults.query}"</h3>
                  <p>Try searching for popular destinations:</p>
                  <div className="suggestions">
                    <button onClick={() => navigate('/search?q=India')} className="suggestion-btn">India</button>
                    <button onClick={() => navigate('/search?q=Mumbai')} className="suggestion-btn">Mumbai</button>
                    <button onClick={() => navigate('/search?q=Goa')} className="suggestion-btn">Goa</button>
                    <button onClick={() => navigate('/search?q=Delhi')} className="suggestion-btn">Delhi</button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="no-search">
            <h2>Search for a destination</h2>
            <p>Use the search bar in the navigation to find locations</p>
            <div className="search-examples">
              <p>Try searching for: <strong>India, Mumbai, Goa, Delhi, Taj Mahal</strong></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MySearchPage;