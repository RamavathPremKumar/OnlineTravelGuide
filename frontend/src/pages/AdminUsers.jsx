import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminUsers.css";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Check authentication and load data
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const storedAdminData = localStorage.getItem("adminData");
    
    if (!token || !storedAdminData) {
      navigate("/admin");
      return;
    }

    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/users`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data?.users || []);
        setFilteredUsers(data.data?.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort users
  useEffect(() => {
    let result = [...users];

    // Search filter
    if (searchTerm) {
      result = result.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (selectedRole !== "all") {
      result = result.filter(user => user.role === selectedRole);
    }

    // Status filter
    if (selectedStatus !== "all") {
      if (selectedStatus === "active") result = result.filter(user => user.isActive === true);
      if (selectedStatus === "inactive") result = result.filter(user => user.isActive === false);
      if (selectedStatus === "verified") result = result.filter(user => user.isVerified === true);
      if (selectedStatus === "unverified") result = result.filter(user => user.isVerified === false);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "name":
          return (a.fullName || a.username || "").localeCompare(b.fullName || b.username || "");
        case "email":
          return (a.email || "").localeCompare(b.email || "");
        default:
          return 0;
      }
    });

    setFilteredUsers(result);
    setCurrentPage(1); // Reset to first page on filter change
  }, [users, searchTerm, selectedRole, selectedStatus, sortBy]);

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/users/${userToDelete._id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setUsers(users.filter(u => u._id !== userToDelete._id));
        setShowDeleteModal(false);
        setUserToDelete(null);
        alert("User deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const toggleStatus = async (user) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/users/${user._id}/toggle-status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setUsers(users.map(u => 
          u._id === user._id ? { ...u, isActive: !u.isActive } : u
        ));
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  const toggleVerification = async (user) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`${API_URL}/api/admin/users/${user._id}/toggle-verification`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setUsers(users.map(u => 
          u._id === user._id ? { ...u, isVerified: !u.isVerified } : u
        ));
      }
    } catch (error) {
      console.error("Error toggling verification:", error);
    }
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const getStats = () => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const verifiedUsers = users.filter(u => u.isVerified).length;
    const regularUsers = users.filter(u => u.role === 'user' || !u.role).length;
    const agentUsers = users.filter(u => u.role === 'agent').length;

    return {
      totalUsers,
      activeUsers,
      verifiedUsers,
      regularUsers,
      agentUsers,
      activePercentage: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0,
      verifiedPercentage: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(1) : 0
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="admin-users-loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading Users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-wrapper">
      {/* Header */}
      <div className="admin-users-header">
        <div className="header-left">
          <h1><i className="fas fa-users"></i> Users Management</h1>
          <p>Manage all registered users and their accounts</p>
        </div>
        <div className="header-right">
          <button 
            className="btn-export"
            onClick={() => alert("Export feature coming soon!")}
          >
            <i className="fas fa-download"></i> Export Users
          </button>
          <button 
            className="btn-add-user"
            onClick={() => navigate("/admin/users/add")}
          >
            <i className="fas fa-user-plus"></i> Add User
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-card total">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-icon">
            <i className="fas fa-user-check"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.activeUsers}</h3>
            <p>Active Users</p>
            <small>{stats.activePercentage}% active</small>
          </div>
        </div>
        <div className="stat-card verified">
          <div className="stat-icon">
            <i className="fas fa-shield-alt"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.verifiedUsers}</h3>
            <p>Verified Users</p>
            <small>{stats.verifiedPercentage}% verified</small>
          </div>
        </div>
        <div className="stat-card agents">
          <div className="stat-icon">
            <i className="fas fa-user-tie"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.agentUsers}</h3>
            <p>Travel Agents</p>
            <small>{stats.regularUsers} regular users</small>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search users by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Role:</label>
          <select 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="user">Regular User</option>
            <option value="agent">Travel Agent</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="email">Email (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        {filteredUsers.length === 0 ? (
          <div className="no-users-found">
            <i className="fas fa-users-slash"></i>
            <h3>No users found</h3>
            <p>{searchTerm ? `No results for "${searchTerm}"` : "No users in the system yet"}</p>
          </div>
        ) : (
          <>
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.fullName?.charAt(0) || user.username?.charAt(0) || "U"}
                        </div>
                        <div className="user-details">
                          <div className="user-name">
                            {user.fullName || user.username || "Unnamed User"}
                            {user.isVerified && (
                              <span className="verified-badge" title="Verified">
                                <i className="fas fa-check-circle"></i>
                              </span>
                            )}
                          </div>
                          <div className="user-username">@{user.username || "No username"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div className="email">{user.email || "No email"}</div>
                        {user.phone && (
                          <div className="phone">
                            <i className="fas fa-phone"></i> {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${user.role || 'user'}`}>
                        {user.role === 'agent' ? 'Travel Agent' : 
                         user.role === 'admin' ? 'Admin' : 'Regular User'}
                      </span>
                    </td>
                    <td>
                      <div className="status-cell">
                        <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="last-login">
                          {user.lastLogin ? `Last login: ${formatDate(user.lastLogin)}` : 'Never logged in'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        <div className="join-date">{formatDate(user.createdAt)}</div>
                        {user.lastLogin && (
                          <div className="last-active">
                            <i className="fas fa-clock"></i> {formatDate(user.lastLogin)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-action view"
                          onClick={() => viewUserDetails(user)}
                          title="View Details"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button 
                          className="btn-action edit"
                          onClick={() => navigate(`/admin/users/edit/${user._id}`)}
                          title="Edit User"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className={`btn-action status ${user.isActive ? 'active' : 'inactive'}`}
                          onClick={() => toggleStatus(user)}
                          title={user.isActive ? "Deactivate" : "Activate"}
                        >
                          <i className={`fas fa-${user.isActive ? 'eye' : 'eye-slash'}`}></i>
                        </button>
                        <button 
                          className={`btn-action verify ${user.isVerified ? 'verified' : 'unverified'}`}
                          onClick={() => toggleVerification(user)}
                          title={user.isVerified ? "Unverify" : "Verify"}
                        >
                          <i className="fas fa-shield-alt"></i>
                        </button>
                        <button 
                          className="btn-action delete"
                          onClick={() => handleDeleteClick(user)}
                          title="Delete User"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="page-btn"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-left"></i> Previous
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and pages around current
                      if (page === 1 || page === totalPages) return true;
                      if (page >= currentPage - 2 && page <= currentPage + 2) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      // Add ellipsis
                      const prevPage = array[index - 1];
                      if (prevPage && page - prevPage > 1) {
                        return (
                          <React.Fragment key={`ellipsis-${page}`}>
                            <span className="ellipsis">...</span>
                            <button
                              className={`page-number ${page === currentPage ? 'active' : ''}`}
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      }
                      
                      return (
                        <button
                          key={page}
                          className={`page-number ${page === currentPage ? 'active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      );
                    })}
                </div>
                
                <button 
                  className="page-btn"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content user-details-modal">
            <div className="modal-header">
              <h3><i className="fas fa-user"></i> User Details</h3>
              <button 
                className="close-modal"
                onClick={() => setShowDetailsModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="user-profile-header">
                <div className="profile-avatar">
                  {selectedUser.fullName?.charAt(0) || selectedUser.username?.charAt(0) || "U"}
                </div>
                <div className="profile-info">
                  <h4>{selectedUser.fullName || selectedUser.username || "Unnamed User"}</h4>
                  <p className="username">@{selectedUser.username || "No username"}</p>
                  <div className="profile-badges">
                    <span className={`role-badge ${selectedUser.role || 'user'}`}>
                      {selectedUser.role === 'agent' ? 'Travel Agent' : 
                       selectedUser.role === 'admin' ? 'Admin' : 'Regular User'}
                    </span>
                    <span className={`status-badge ${selectedUser.isActive ? 'active' : 'inactive'}`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {selectedUser.isVerified && (
                      <span className="verified-badge">
                        <i className="fas fa-check-circle"></i> Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <label><i className="fas fa-envelope"></i> Email</label>
                  <p>{selectedUser.email || "No email"}</p>
                </div>
                <div className="detail-item">
                  <label><i className="fas fa-phone"></i> Phone</label>
                  <p>{selectedUser.phone || "No phone number"}</p>
                </div>
                <div className="detail-item">
                  <label><i className="fas fa-map-marker-alt"></i> Location</label>
                  <p>{selectedUser.location || "Not specified"}</p>
                </div>
                <div className="detail-item">
                  <label><i className="fas fa-calendar-plus"></i> Joined</label>
                  <p>{formatDateTime(selectedUser.createdAt)}</p>
                </div>
                <div className="detail-item">
                  <label><i className="fas fa-clock"></i> Last Login</label>
                  <p>{selectedUser.lastLogin ? formatDateTime(selectedUser.lastLogin) : "Never"}</p>
                </div>
                <div className="detail-item">
                  <label><i className="fas fa-id-card"></i> User ID</label>
                  <p className="user-id">{selectedUser._id}</p>
                </div>
              </div>

              {selectedUser.bio && (
                <div className="bio-section">
                  <label><i className="fas fa-user-edit"></i> Bio</label>
                  <p className="bio-text">{selectedUser.bio}</p>
                </div>
              )}

              <div className="user-stats">
                <div className="stat-item">
                  <div className="stat-value">0</div>
                  <div className="stat-label">Bookings</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">0</div>
                  <div className="stat-label">Reviews</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">0</div>
                  <div className="stat-label">Photos</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn edit-user"
                onClick={() => {
                  setShowDetailsModal(false);
                  navigate(`/admin/users/edit/${selectedUser._id}`);
                }}
              >
                <i className="fas fa-edit"></i> Edit User
              </button>
              <button 
                className="modal-btn close-btn"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h3><i className="fas fa-exclamation-triangle"></i> Delete User</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete user <strong>"{userToDelete.fullName || userToDelete.username || "this user"}"</strong>?</p>
              <p className="warning-text">
                <i className="fas fa-exclamation-circle"></i> This action cannot be undone. All user data including bookings and reviews will be permanently deleted.
              </p>
              <div className="user-to-delete">
                <div className="delete-user-info">
                  <div className="delete-user-avatar">
                    {userToDelete.fullName?.charAt(0) || userToDelete.username?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div className="delete-user-name">{userToDelete.fullName || userToDelete.username}</div>
                    <div className="delete-user-email">{userToDelete.email}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn delete-confirm"
                onClick={confirmDelete}
              >
                <i className="fas fa-trash"></i> Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;