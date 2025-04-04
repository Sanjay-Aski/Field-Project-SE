import React, { useEffect, useState } from 'react';

const GoogleMapIframe = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  const handleIframeLoad = () => {
    setIsLoaded(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) {
        console.warn("Iframe failed to load.");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isLoaded]);

  return (
    <div style={{ textAlign: 'center' }}>
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d470.9547952855787!2d73.0931351!3d19.2109914!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7958f3113354d%3A0x8767a00550e36af4!2sPurva%20Society%2C%20Reti%20Bunder%2C%20Gograswadi%2C%20Dombivli%20East%2C%20Dombivli%2C%20Maharashtra%20421201!5e0!3m2!1sen!2sin!4v1743500089877!5m2!1sen!2sin"
        width="700"
        height="450"
        style={{ border: '0' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onLoad={handleIframeLoad}
        title="Google Map Location"
      ></iframe>

      {!isLoaded && <p>Loading map...</p>}
    </div>
  );
};

export default GoogleMapIframe;
