import React from "react";
import "./Gallery.css";

// Complete gallery data
const galleryData = [
  {
    title: "Rajasthan",
    images: [
      { src: "/jaipur.jpg", alt: "Jaipur", text: "Jaipur" },
      { src: "/udaipur.jpeg", alt: "Udaipur", text: "Udaipur" },
      { src: "/jaisalmer.jpeg", alt: "Jaisalmer", text: "Jaisalmer" },
      { src: "/jodhpur.jpeg", alt: "Jodhpur", text: "Jodhpur" },
    ],
  },
  {
    title: "Uttar Pradesh",
    images: [
      { src: "/agra.jpeg", alt: "Agra", text: "Agra" },
      { src: "/varanasi.jpeg", alt: "Varanasi", text: "Varanasi" },
      { src: "/lucknow.jpeg", alt: "Lucknow", text: "Lucknow" },
      { src: "/mathura.jpeg", alt: "Mathura", text: "Mathura" },
    ],
  },
  {
    title: "Kerala",
    images: [
      { src: "/allepey.jpeg", alt: "Alleppey", text: "Alleppey" },
      { src: "/munnar.jpeg", alt: "Munnar", text: "Munnar" },
      { src: "/kochi.jpeg", alt: "Kochi", text: "Kochi" },
      { src: "/varkala.jpeg", alt: "Varkala", text: "Varkala" },
    ],
  },
  {
    title: "Maharashtra",
    images: [
      { src: "/mumbai.jpeg", alt: "Mumbai", text: "Mumbai" },
      { src: "/pune.jpeg", alt: "Pune", text: "Pune" },
      { src: "/aurangabad.jpeg", alt: "Aurangabad", text: "Aurangabad" },
      { src: "/nashik.jpeg", alt: "Nashik", text: "Nashik" },
    ],
  },
  {
    title: "Tamil Nadu",
    images: [
      { src: "/chennai.jpeg", alt: "Chennai", text: "Chennai" },
      { src: "/madhurai.jpeg", alt: "Madurai", text: "Madurai" },
      { src: "/kanyakumari.jpeg", alt: "Kanyakumari", text: "Kanyakumari" },
      { src: "/ooty.jpeg", alt: "Ooty", text: "Ooty" },
    ],
  },
  {
    title: "Karnataka",
    images: [
      { src: "/bengaluru.jpeg", alt: "Bengaluru", text: "Bengaluru" },
      { src: "/mysore.jpeg", alt: "Mysore", text: "Mysore" },
      { src: "/harmpi.jpeg", alt: "Hampi", text: "Hampi" },
      { src: "/coorg.jpeg", alt: "Coorg", text: "Coorg" },
    ],
  },
  {
    title: "West Bengal",
    images: [
      { src: "/kolkata.jpeg", alt: "Kolkata", text: "Kolkata" },
      { src: "/darjeeling.jpeg", alt: "Darjeeling", text: "Darjeeling" },
      { src: "/sundarbans.jpeg", alt: "Sundarbans", text: "Sundarbans" },
      { src: "/shantiniketan.jpeg", alt: "Shantiniketan", text: "Shantiniketan" },
    ],
  },
  {
    title: "Gujarat",
    images: [
      { src: "/ahmedabad.jpeg", alt: "Ahmedabad", text: "Ahmedabad" },
      { src: "/kutch.jpeg", alt: "Kutch", text: "Kutch" },
      { src: "/gir_national_park.jpeg", alt: "Gir National Park", text: "Gir National Park" },
      { src: "/somanath.jpeg", alt: "Somnath", text: "Somnath" },
    ],
  },
  {
    title: "Punjab",
    images: [
      { src: "/amritsar.jpeg", alt: "Amritsar", text: "Amritsar" },
      { src: "/chandigarh.jpeg", alt: "Chandigarh", text: "Chandigarh" },
      { src: "/ludhiana.jpeg", alt: "Ludhiana", text: "Ludhiana" },
      { src: "/patiala.jpeg", alt: "Patiala", text: "Patiala" },
    ],
  },
  {
    title: "Telangana",
    images: [
      { src: "/hyderabad.jpeg", alt: "Hyderabad", text: "Hyderabad" },
      { src: "/warangal.jpeg", alt: "Warangal", text: "Warangal" },
      { src: "/ramoji.jpeg", alt: "Ramoji Film City", text: "Ramoji Film City" },
      { src: "/khammam.jpeg", alt: "Khammam", text: "Khammam" },
    ],
  },
  {
    title: "Odisha",
    images: [
      { src: "/bhubaneswar.jpeg", alt: "Bhubaneswar", text: "Bhubaneswar" },
      { src: "/puri.jpeg", alt: "Puri", text: "Puri" },
      { src: "/konark.jpeg", alt: "Konark", text: "Konark" },
      { src: "/ganjam.jpeg", alt: "Ganjam", text: "Ganjam" },
    ],
  },
  {
    title: "Andhra Pradesh",
    images: [
      { src: "/vizag.jpeg", alt: "Vishakapatnam", text: "Vishakapatnam" },
      { src: "/amaravathi.jpeg", alt: "Amaravathi", text: "Amaravathi" },
      { src: "/tirupathi.jpeg", alt: "Tirupathi", text: "Tirupathi" },
      { src: "/kadapa.jpeg", alt: "Kadapa", text: "Kadapa" },
    ],
  },
  {
    title: "Delhi",
    images: [
      { src: "/redfort.jpeg", alt: "Red Fort", text: "Red Fort" },
      { src: "/qutub_minar.jpeg", alt: "Qutub Minar", text: "Qutub Minar" },
      { src: "/india_gate.jpeg", alt: "India Gate", text: "India Gate" },
      { src: "/humayuns_tomb.jpeg", alt: "Humayun's Tomb", text: "Humayun's Tomb" },
    ],
  },
];

const Gallery = () => {
  return (
    <>
      <div className="container-gallery-section">
        {galleryData.map((section, idx) => (
          <section key={idx}>
            <h2 className="gallery-title">{section.title}</h2>
            <div className="gallery-row">
              {section.images.map((img, id) => (
                <div className="gallery-img-container" key={id}>
                  <img src={img.src} alt={img.alt} className="gallery-img" />
                  <div className="img-text">{img.text}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      
    </>
  );
};

export default Gallery;
