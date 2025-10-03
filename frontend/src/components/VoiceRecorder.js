import React, { useState, useRef, useEffect } from 'react';
import './VoiceRecorder.css';

const VoiceRecorder = ({ onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playPreview = () => {
    if (audioBlob && audioRef.current) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      const file = new File([audioBlob], `voice_${Date.now()}.wav`, { type: 'audio/wav' });
      onRecordingComplete(file);
    }
  };

  const handleCancel = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
    onCancel();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="voice-recorder">
      <div className="recorder-header">
        <span className="recorder-title">Voice Message</span>
        <button className="cancel-btn" onClick={handleCancel}>✕</button>
      </div>

      <div className="recorder-content">
        {!audioBlob ? (
          <div className="recording-section">
            <div className="recording-indicator">
              <div className={`record-button ${isRecording ? 'recording' : ''}`}
                   onClick={isRecording ? stopRecording : startRecording}>
                <span className="record-icon">
                  {isRecording ? '⏹️' : '🎤'}
                </span>
              </div>
              <div className="recording-time">
                {formatTime(recordingTime)}
              </div>
            </div>

            <div className="recording-instructions">
              {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
            </div>

            {isRecording && (
              <div className="recording-animation">
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="preview-section">
            <div className="audio-preview">
              <button
                className="play-btn"
                onClick={playPreview}
                disabled={isPlaying}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <div className="audio-duration">
                {formatTime(recordingTime)}
              </div>
            </div>

            <audio
              ref={audioRef}
              onEnded={() => setIsPlaying(false)}
              style={{ display: 'none' }}
            />

            <div className="preview-actions">
              <button className="re-record-btn" onClick={() => {
                setAudioBlob(null);
                setRecordingTime(0);
              }}>
                🔄 Re-record
              </button>
              <button className="send-btn" onClick={handleSend}>
                ➡️ Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;