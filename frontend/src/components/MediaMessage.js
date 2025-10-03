import React, { useState } from 'react';
import './MediaMessage.css';

const MediaMessage = ({ message, isOutgoing }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderImage = () => (
    <div className="media-image-container">
      {isLoading && <div className="media-loading">Loading...</div>}
      {hasError ? (
        <div className="media-error">
          <span>📷</span>
          <p>Failed to load image</p>
        </div>
      ) : (
        <img
          src={message.fileUrl}
          alt={message.fileName}
          onLoad={handleLoad}
          onError={handleError}
          className="media-image"
        />
      )}
    </div>
  );

  const renderVideo = () => (
    <div className="media-video-container">
      <video
        controls
        className="media-video"
        onLoadedData={handleLoad}
        onError={handleError}
      >
        <source src={message.fileUrl} type={message.mimeType} />
        Your browser does not support the video tag.
      </video>
    </div>
  );

  const renderDocument = () => (
    <div className="media-document-container">
      <div className="document-icon">
        <span>📄</span>
      </div>
      <div className="document-info">
        <div className="document-name">{message.fileName}</div>
        <div className="document-size">{formatFileSize(message.fileSize)}</div>
      </div>
      <a
        href={message.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="document-download"
      >
        📥
      </a>
    </div>
  );

  const renderVoice = () => (
    <div className="media-voice-container">
      <div className="voice-icon">
        <span>🎵</span>
      </div>
      <div className="voice-info">
        <div className="voice-name">{message.fileName}</div>
        <audio controls className="voice-player">
          <source src={message.fileUrl} type={message.mimeType} />
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );

  const renderMedia = () => {
    switch (message.messageType) {
      case 'image':
        return renderImage();
      case 'video':
        return renderVideo();
      case 'document':
        return renderDocument();
      case 'voice':
        return renderVoice();
      default:
        return <div className="media-unsupported">Unsupported media type</div>;
    }
  };

  return (
    <div className={`media-message ${isOutgoing ? 'outgoing' : 'incoming'}`}>
      {renderMedia()}
      {message.content && (
        <div className="media-caption">{message.content}</div>
      )}
    </div>
  );
};

export default MediaMessage;