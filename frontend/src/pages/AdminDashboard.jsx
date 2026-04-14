import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [authChecked, setAuthChecked] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLocations: 0,
    totalPlaces: 0,
    totalHotels: 0,
    pendingApprovals: 0,
    recentUsers: [],
    recentPlaces: [],
    recentHotels: []
  });


  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("adminToken");
      const storedAdminData = localStorage.getItem("adminData");
      
      if (!token || !storedAdminData) {
        navigate("/admin", { replace: true });
        return;
      }
      
      try {
        const admin = JSON.parse(storedAdminData);
        setAdminData(admin);
        setAuthChecked(true);
      } catch (error) {
        console.error("Error parsing admin data:", error);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminData");
        navigate("/admin", { replace: true });
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Fetch dashboard data
  useEffect(() => {
    if (!authChecked) return;
    
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        const data = await apiRequest("/admin/dashboard", "GET", null, token);

        setStats({
          totalUsers: data.data?.totalUsers || 0,
          totalLocations: data.data?.totalLocations || 0,
          totalPlaces: data.data?.totalPlaces || 0,
          totalHotels: data.data?.totalHotels || 0,
          pendingApprovals: data.data?.pendingApprovals || 0,
          recentUsers: data.data?.recentUsers || [],
          recentPlaces: data.data?.recentPlaces || [],
          recentHotels: data.data?.recentHotels || []
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authChecked, API_URL]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    navigate("/admin", { replace: true });
    setTimeout(() => window.location.reload(), 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading || !authChecked) {
    return (
      <div className="admin-dashboard-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-wrapper" style={{ marginTop: '0', paddingTop: '0' }}>
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <h2><i className="fas fa-compass"></i> Travel Guide</h2>
          <p className="admin-role">Admin Panel</p>
        </div>
        
        <div className="admin-profile">
          <div className="admin-avatar">
            <i className="fas fa-user-shield"></i>
          </div>
          <div className="admin-info">
            <h3>{adminData?.adminName || "Admin"}</h3>
            <p>{adminData?.email || "admin@travelguide.com"}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li className={activeTab === "dashboard" ? "active" : ""}>
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab("dashboard"); }}>
                <i className="fas fa-tachometer-alt"></i> Dashboard
              </a>
            </li>
            
            <li className={activeTab === "users" ? "active" : ""}>
              <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setActiveTab("users");
                navigate("/admin/users");
              }}>
                <i className="fas fa-users"></i> Users Management
              </a>
            </li>
            
            <li className={activeTab === "locations" ? "active" : ""}>
              <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setActiveTab("locations");
                navigate("/admin/locations");
              }}>
                <i className="fas fa-globe"></i> Locations
              </a>
            </li>
            
            <li className={activeTab === "places" ? "active" : ""}>
              <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setActiveTab("places");
                navigate("/admin/places");
              }}>
                <i className="fas fa-map-marker-alt"></i> Tourist Places
                <span className="badge-count">{stats.totalPlaces}</span>
              </a>
            </li>
            
            <li className={activeTab === "hotels" ? "active" : ""}>
              <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setActiveTab("hotels");
                navigate("/admin/hotels");
              }}>
                <i className="fas fa-hotel"></i> Hotels Management
                <span className="badge-count">{stats.totalHotels}</span>
              </a>
            </li>
            
            <li className={activeTab === "mapping" ? "active" : ""}>
              <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setActiveTab("mapping");
                navigate("/admin/mapping");
              }}>
                <i className="fas fa-link"></i> Place-Hotel Mapping
              </a>
            </li>
            
            <li className={activeTab === "images" ? "active" : ""}>
              <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setActiveTab("images");
                navigate("/admin/images");
              }}>
                <i className="fas fa-images"></i> Images & Media
              </a>
            </li>
            
            <li className={activeTab === "approvals" ? "active" : ""}>
              <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setActiveTab("approvals");
                navigate("/admin/approvals");
              }}>
                <i className="fas fa-check-circle"></i> Approvals
                {stats.pendingApprovals > 0 && (
                  <span className="badge-pending">{stats.pendingApprovals}</span>
                )}
              </a>
            </li>
            
            <li className={activeTab === "reports" ? "active" : ""}>
              <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setActiveTab("reports");
                navigate("/admin/reports");
              }}>
                <i className="fas fa-chart-bar"></i> Reports
              </a>
            </li>
            
            <li className={activeTab === "settings" ? "active" : ""}>
              <a href="#" onClick={(e) => { 
                e.preventDefault(); 
                setActiveTab("settings");
                navigate("/admin/settings");
              }}>
                <i className="fas fa-cog"></i> System Settings
              </a>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-main-content">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
            <p className="welcome-message">
              Welcome back, <span className="admin-name">{adminData?.adminName || "Admin"}</span>
              <span className="last-login">Last login: {formatDate(adminData?.lastLogin)}</span>
            </p>
          </div>
          <div className="header-right">
            <div className="header-actions">
              <button 
                className="refresh-btn"
                onClick={() => window.location.reload()}
                title="Refresh Dashboard"
              >
                <i className="fas fa-redo"></i>
              </button>
              <div className="current-time">
                <i className="fas fa-clock"></i> {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Stats Overview */}
          <div className="stats-grid">
            <div className="stat-card total-users">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.totalUsers}</h3>
                <p>Total Users</p>
              </div>
              <div className="stat-action">
                <button 
                  className="view-btn"
                  onClick={() => navigate("/admin/users")}
                >
                  View All <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>

            <div className="stat-card total-locations">
              <div className="stat-icon">
                <i className="fas fa-globe-asia"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.totalLocations}</h3>
                <p>Cities/Locations</p>
              </div>
              <div className="stat-action">
                <button 
                  className="view-btn"
                  onClick={() => navigate("/admin/locations")}
                >
                  Manage <i className="fas fa-edit"></i>
                </button>
              </div>
            </div>

            <div className="stat-card total-places">
              <div className="stat-icon">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.totalPlaces}</h3>
                <p>Tourist Places</p>
                <small className="stat-sub">Admin: {stats.totalPlaces} | API: 0</small>
              </div>
              <div className="stat-action">
                <button 
                  className="view-btn"
                  onClick={() => navigate("/admin/places")}
                >
                  Manage <i className="fas fa-edit"></i>
                </button>
              </div>
            </div>

            <div className="stat-card total-hotels">
              <div className="stat-icon">
                <i className="fas fa-hotel"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.totalHotels}</h3>
                <p>Hotels Listed</p>
                <small className="stat-sub">Mapped to places: 0</small>
              </div>
              <div className="stat-action">
                <button 
                  className="view-btn"
                  onClick={() => navigate("/admin/hotels")}
                >
                  Manage <i className="fas fa-edit"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-section">
            <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
            <div className="actions-grid">
              <button 
                className="action-btn add-place"
                onClick={() => navigate("/admin/places/add")}
              >
                <i className="fas fa-plus-circle"></i>
                <span>Add New Place</span>
                <small>Tourist attraction</small>
              </button>
              
              <button 
                className="action-btn add-hotel"
                onClick={() => navigate("/admin/hotels/add")}
              >
                <i className="fas fa-hotel"></i>
                <span>Add New Hotel</span>
                <small>With location mapping</small>
              </button>
              
              <button 
                className="action-btn add-location"
                onClick={() => navigate("/admin/locations/add")}
              >
                <i className="fas fa-city"></i>
                <span>Add Location</span>
                <small>City/Region</small>
              </button>
              
              <button 
                className="action-btn map-hotels"
                onClick={() => navigate("/admin/mapping")}
              >
                <i className="fas fa-link"></i>
                <span>Map Hotels to Places</span>
                <small>Create relations</small>
              </button>
              
              <button 
                className="action-btn import-api"
                onClick={() => navigate("/admin/import")}
              >
                <i className="fas fa-download"></i>
                <span>Import from API</span>
                <small>Enrich external data</small>
              </button>
              
              <button 
                className="action-btn system-check"
                onClick={() => navigate("/admin/system")}
              >
                <i className="fas fa-server"></i>
                <span>System Check</span>
                <small>API & Database status</small>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="recent-activity-grid">
            {/* Recent Users */}
            <div className="activity-card">
              <div className="card-header">
                <h3><i className="fas fa-user-plus"></i> Recent Users</h3>
                <Link to="/admin/users" className="view-all">View All →</Link>
              </div>
              <div className="card-content">
                {stats.recentUsers.length > 0 ? (
                  <div className="user-list">
                    {stats.recentUsers.slice(0, 5).map((user, index) => (
                      <div key={user._id || index} className="user-item">
                        <div className="user-avatar">
                          {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                        </div>
                        <div className="user-details">
                          <div className="user-name">{user.name || "New User"}</div>
                          <div className="user-email">{user.email || "No email"}</div>
                          <div className="user-date">Joined: {formatDate(user.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">No recent users</div>
                )}
              </div>
            </div>

            {/* Recent Places */}
            <div className="activity-card">
              <div className="card-header">
                <h3><i className="fas fa-map-marked-alt"></i> Recent Places Added</h3>
                <Link to="/admin/places" className="view-all">View All →</Link>
              </div>
              <div className="card-content">
                {stats.recentPlaces.length > 0 ? (
                  <div className="places-list">
                    {stats.recentPlaces.slice(0, 5).map((place, index) => (
                      <div key={place._id || index} className="place-item">
                        <div className="place-icon">
                          <i className="fas fa-landmark"></i>
                        </div>
                        <div className="place-details">
                          <div className="place-name">{place.name || "New Place"}</div>
                          <div className="place-location">
                            <i className="fas fa-map-pin"></i> {place.city || place.location || "Unknown"}
                          </div>
                          <div className="place-type">
                            <span className="type-badge">{place.type || "Attraction"}</span>
                            <span className="place-date">{formatDate(place.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">No places added yet</div>
                )}
              </div>
            </div>

            {/* Recent Hotels */}
            <div className="activity-card">
              <div className="card-header">
                <h3><i className="fas fa-hotel"></i> Recent Hotels Added</h3>
                <Link to="/admin/hotels" className="view-all">View All →</Link>
              </div>
              <div className="card-content">
                {stats.recentHotels.length > 0 ? (
                  <div className="hotels-list">
                    {stats.recentHotels.slice(0, 5).map((hotel, index) => (
                      <div key={hotel._id || index} className="hotel-item">
                        <div className="hotel-icon">
                          <i className="fas fa-hotel"></i>
                        </div>
                        <div className="hotel-details">
                          <div className="hotel-name">{hotel.name || "New Hotel"}</div>
                          <div className="hotel-location">
                            <i className="fas fa-map-pin"></i> {hotel.city || "Unknown"}
                          </div>
                          <div className="hotel-info">
                            <span className="rating">
                              <i className="fas fa-star"></i> {hotel.rating || "N/A"}
                            </span>
                            <span className="price-range">{hotel.priceRange || "$$"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">No hotels added yet</div>
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="activity-card system-status">
              <div className="card-header">
                <h3><i className="fas fa-server"></i> System Status</h3>
              </div>
              <div className="card-content">
                <div className="status-item">
                  <span className="status-label">Database</span>
                  <span className="status-value online">
                    <i className="fas fa-circle"></i> Connected
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">External API</span>
                  <span className="status-value online">
                    <i className="fas fa-circle"></i> Available
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Storage Used</span>
                  <span className="status-value">2.4 GB / 10 GB</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '24%'}}></div>
                  </div>
                </div>
                <div className="status-item">
                  <span className="status-label">Last Data Sync</span>
                  <span className="status-value">Today, 02:00 AM</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Pending Actions</span>
                  <span className="status-value warning">{stats.pendingApprovals}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notes Section */}
          <div className="notes-section">
            <h3><i className="fas fa-info-circle"></i> Important Notes</h3>
            <div className="notes-grid">
              <div className="note-card important">
                <i className="fas fa-exclamation-triangle"></i>
                <h4>Hotel-Place Mapping</h4>
                <p>Map hotels to tourist places for better search results. If no hotels mapped to a place, system will show hotels from the same city.</p>
                <button 
                  className="note-action"
                  onClick={() => navigate("/admin/mapping")}
                >
                  Go to Mapping <i className="fas fa-arrow-right"></i>
                </button>
              </div>
              
              <div className="note-card info">
                <i className="fas fa-database"></i>
                <h4>Data Enrichment</h4>
                <p>Import places from external APIs and enrich them with your own images, ratings, and descriptions.</p>
                <button 
                  className="note-action"
                  onClick={() => navigate("/admin/import")}
                >
                  Import Data <i className="fas fa-download"></i>
                </button>
              </div>
              
              <div className="note-card tip">
                <i className="fas fa-lightbulb"></i>
                <h4>Search Priority</h4>
                <p>Your manually added places and hotels appear first in search results. API data is used as fallback.</p>
                <button 
                  className="note-action"
                  onClick={() => navigate("/admin/settings")}
                >
                  Configure <i className="fas fa-cog"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;