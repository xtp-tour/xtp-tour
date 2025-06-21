import React from 'react';

interface ShareEventModalProps {
  show: boolean;
  onHide: () => void;
  eventId: string;
  onShared?: () => void;
}

const ShareEventModal: React.FC<ShareEventModalProps> = ({ show, onHide, eventId, onShared }) => {
  const handleShare = (platform: string) => {
    const eventUrl = `${window.location.origin}/event/${eventId}`;
    
    switch (platform) {
      case 'copy':
        navigator.clipboard.writeText(eventUrl);
        break;
      case 'facebook': {
        const fbUrl = encodeURIComponent(eventUrl);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${fbUrl}`, '_blank');
        break;
      }
      case 'twitter': {
        const twitterUrl = encodeURIComponent(eventUrl);
        const twitterText = encodeURIComponent(`Join me for a tennis event! 🎾`);
        window.open(`https://twitter.com/intent/tweet?url=${twitterUrl}&text=${twitterText}`, '_blank');
        break;
      }
      case 'whatsapp': {
        const whatsappUrl = encodeURIComponent(eventUrl);
        const whatsappText = encodeURIComponent(`Join me for a tennis event! 🎾`);
        window.open(`https://wa.me/?text=${whatsappText}%20${whatsappUrl}`, '_blank');
        break;
      }
      case 'telegram': {
        const telegramUrl = encodeURIComponent(eventUrl);
        const telegramText = encodeURIComponent(`Join me for a tennis event! 🎾`);
        window.open(`https://t.me/share/url?url=${telegramUrl}&text=${telegramText}`, '_blank');
        break;
      }
    }
    
    onShared?.();
    onHide();
  };

  if (!show) return null;

  return (
    <>
      <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Share Event</h5>
              <button type="button" className="btn-close" onClick={onHide}></button>
            </div>
            <div className="modal-body">
              <div className="d-grid gap-2">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => handleShare('copy')}
                >
                  <i className="bi bi-clipboard me-2"></i>
                  Copy Link
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => handleShare('facebook')}
                >
                  <i className="bi bi-facebook me-2"></i>
                  Facebook
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => handleShare('twitter')}
                >
                  <i className="bi bi-twitter me-2"></i>
                  Twitter
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => handleShare('whatsapp')}
                >
                  <i className="bi bi-whatsapp me-2"></i>
                  WhatsApp
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => handleShare('telegram')}
                >
                  <i className="bi bi-telegram me-2"></i>
                  Telegram
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  );
};

export default ShareEventModal; 