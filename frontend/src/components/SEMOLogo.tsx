import React, { useState } from 'react';
import './SEMOLogo.css';

interface SEMOLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

const SEMOLogo: React.FC<SEMOLogoProps> = ({ 
  size = 'medium', 
  showText = true,
  className = '' 
}) => {
  const [imgError, setImgError] = useState(false);

  const logoPaths = [
    '/assets/logos/semo-logo.png', // First try: PNG from public assets (copied from components/assets)
    '/assets/logos/semo logo.png',
    '/assets/logos/semo-logo.svg',
    '/src/components/assets/semo-logo.png' // Fallback to source folder
  ];

  const handleImageError = () => {
    setImgError(true);
  };

  // Try to load official PNG logo first, fallback to text-based design
  if (!imgError) {
    return (
      <div className={`semo-logo-wrapper ${size} ${className}`}>
        <img 
          src={logoPaths[0]}
          alt="Southeast Missouri State University"
          className="semo-logo-image"
          onError={handleImageError}
          onLoad={() => setImgError(false)}
        />
      </div>
    );
  }

  // Official SEMO Logo Design Fallback: Gold building icon + Red text
  return (
    <div className={`semo-logo-official ${size} ${className}`}>
      <div className="semo-logo-building">🏛️</div>
      <div className="semo-logo-text-container">
        <span className="semo-logo-primary">SOUTHEAST MISSOURI STATE UNIVERSITY</span>
        {showText && (
          <span className="semo-logo-secondary"> • 1873®</span>
        )}
      </div>
    </div>
  );
};

export default SEMOLogo;

