import React from "react";

const Footer = () => {
  return (
    <footer className="footer bg-dark text-white text-center py-3">
      <div className="container d-flex flex-column flex-md-row justify-content-center justify-content-md-between align-items-center">
        <div className="text-center mb-3 mb-md-0">
          <p className="m-0">© 2024 Online Tour Guide. All rights reserved.</p>
          <div className="footer-icons">
            <a href="https://www.facebook.com/share/boJXacJUyFAjLFUn/" target="_blank" aria-label="Facebook">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://x.com/InfosysBatch2?s=08" target="_blank" aria-label="Twitter">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://www.instagram.com/online_travelguide/" target="_blank" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://www.linkedin.com/in/online-travel-guide-637431336/" target="_blank" aria-label="LinkedIn">
              <i className="fab fa-linkedin-in"></i>
            </a>
          </div>
        </div>
        <div className="contact-info text-md-right">
          <p className="contact-title">Contact Us</p>
          <p className="contact-item">
            <span className="email-symbol">✉</span> Tours69@gmail.com
          </p>
          <p className="contact-item">
            <span className="phone-symbol">☎</span> 918767899
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
