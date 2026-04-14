import React, { useState } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import './VoiceSearchButton.css'; // Optional CSS

const VoiceSearchButton = ({ onVoiceResult, inputRef }) => {
    const [isListening, setIsListening] = useState(false);
    
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    const startListening = () => {
        setIsListening(true);
        SpeechRecognition.startListening({ 
            continuous: true, 
            language: 'en-IN' 
        });
    };

    const stopListening = () => {
        setIsListening(false);
        SpeechRecognition.stopListening();
        if (transcript) {
            onVoiceResult(transcript);
            resetTranscript();
        }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    if (!browserSupportsSpeechRecognition) {
        return null; // Don't show button if not supported
    }

    return (
        <div className="voice-search-wrapper">
            <button 
                type="button"
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                onClick={toggleListening}
                title={isListening ? 'Click to stop listening' : 'Click to speak your search'}
            >
                <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                >
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="22"></line>
                </svg>
            </button>
            
            {isListening && (
                <div className="voice-listening-indicator">
                    <div className="voice-pulse"></div>
                    <span>Listening... Speak now</span>
                    {transcript && (
                        <div className="voice-transcript">
                            You said: "{transcript}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VoiceSearchButton;