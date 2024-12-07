import React, { useState, useEffect, useRef } from 'react';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [canPlaySound, setCanPlaySound] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPopup(true);
      if (canPlaySound && audioRef.current) {
        audioRef.current.play()
          .then(() => console.log("Audio played successfully"))
          .catch(error => console.error("Audio playback failed:", error));
      }
    }, 2000);

    const hideTimer = setTimeout(() => {
      setShowPopup(false);
    }, 12000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [canPlaySound]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    setShowPopup(false);
    setCanPlaySound(true);
    if (audioRef.current) {
      audioRef.current.play()
        .then(() => console.log("Audio played successfully"))
        .catch(error => console.error("Audio playback failed:", error));
    }
  };

  return (
    <div className="chatbot-container">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      {showPopup && !isOpen && (
        <div className="chatbot-popup">
          <span role="img" aria-label="Celebration and Chat">🎉 Get Your Exclusive Discount Code Now! 💬</span>
        </div>
      )}
      <button className="chatbot-toggle" onClick={toggleChatbot}>
        <i className="fas fa-comments"></i>
      </button>
      {isOpen && (
        <div className="chatbot-iframe-container">
          <iframe
            src="https://tixaeagents.ai/app/na/render/0975jcfk5to1dtup/iframe"
            style={{ width: '100%', height: '100%' }}
            frameBorder="0"
            title="Chatbot"
          />
        </div>
      )}
    </div>
  );
}

export default Chatbot;
