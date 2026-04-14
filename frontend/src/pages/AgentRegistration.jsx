import React, { useState } from "react";
import "./AgentRegistration.css";

const AgentRegistration = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    education: "",
    referenceName: "",
    comments: "",
    confirmation: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Data:", formData);
    alert("Form submitted!");
    // Add your form submission logic here
  };

  return (
    <div className="form-wrapper">
      <div id="agent-registration-container">
        <h2>Agent Registration Form</h2>

        <p><strong>Eligibility Criteria:</strong></p>
        <ul>
          <li>Bachelor's degree</li>
          <li>0-2 years of experience</li>
          <li>Fluent in English and any native language of India</li>
        </ul>

        <form id="registration-form" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label required" htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              className="form-control"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label required" htmlFor="email">Email Address:</label>
            <input
              type="email"
              id="email"
              className="form-control"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              required
            />
          </div>

          {/* Address */}
          <div className="form-group">
            <label className="form-label required" htmlFor="address">Address:</label>
            <input
              type="text"
              id="address"
              className="form-control"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Enter your address"
              required
            />
          </div>

          {/* Education */}
          <div className="form-group">
            <label className="form-label required" htmlFor="education">
              Highest Education Qualification:
            </label>
            <select
              id="education"
              className="form-control"
              name="education"
              value={formData.education}
              onChange={handleChange}
              required
            >
              <option value="">Select qualification</option>
              <option value="PG">Postgraduate</option>
              <option value="UG">Undergraduate</option>
              <option value="Diploma">Diploma</option>
            </select>
          </div>

          {/* Reference Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="referenceName">
              Reference Name and Email (if any):
            </label>
            <input
              type="text"
              id="referenceName"
              className="form-control"
              name="referenceName"
              value={formData.referenceName}
              onChange={handleChange}
              placeholder="Enter reference name and email"
            />
          </div>

          {/* Comments */}
          <div className="form-group">
            <label className="form-label" htmlFor="comments">
              Why do you want to join with us?
            </label>
            <textarea
              id="comments"
              className="text-area"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              placeholder="Share your reason"
            />
          </div>

          {/* Confirmation Checkbox */}
          <div className="form-group">
            <label className="checkbox-container">
              <input
                type="checkbox"
                id="confirmation"
                name="confirmation"
                checked={formData.confirmation}
                onChange={handleChange}
                required
              />
              <span className="checkbox-custom"></span>
              I confirm that all the information provided is accurate and true to my knowledge.
            </label>
          </div>

          {/* Submit */}
          <button type="submit" id="submitBtn">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default AgentRegistration;
