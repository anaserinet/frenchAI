import { useState } from 'react';
import { Type, Headphones } from 'lucide-react';
import TextMode from './TextMode';
import AudioMode from './AudioMode';
import './App.css';

const FrenchBuddy = () => {
    const [mode, setMode] = useState(null); // null, 'text', or 'audio'

    const goBackToSelection = () => {
        setMode(null);
    };

    // Mode selection screen
    if (!mode) {
        return (
            <div className="app">
                <div className="container">
                    <div className="header">
                        <h1>🇫🇷 French Conversational Buddy</h1>
                        <p>Choose your preferred learning mode</p>
                    </div>

                    <div className="mode-selection">
                        <div className="mode-cards">
                            <div
                                className="mode-card text-mode"
                                onClick={() => setMode('text')}
                            >
                                <div className="mode-icon">
                                    <Type size={48} />
                                </div>
                                <h3>Textual Conversation</h3>
                                <p>Practice writing in French with detailed grammar corrections and suggestions</p>
                                <ul className="mode-features">
                                    <li>✏️ Type messages in French</li>
                                    <li>📝 Get grammar corrections</li>
                                    <li>💡 Receive learning suggestions</li>
                                    <li>🎵 Optional voice synthesis</li>
                                    <li>📚 Quick phrase helpers</li>
                                </ul>
                                <button className="mode-button">Start Text Chat</button>
                            </div>

                            <div
                                className="mode-card audio-mode"
                                onClick={() => setMode('audio')}
                            >
                                <div className="mode-icon">
                                    <Headphones size={48} />
                                </div>
                                <h3>Audio Conversation</h3>
                                <p>Practice speaking French with real-time voice interaction</p>
                                <ul className="mode-features">
                                    <li>🎤 Voice-to-voice conversation</li>
                                    <li>🗣️ Pronunciation practice</li>
                                    <li>⚡ Real-time responses</li>
                                    <li>🎯 Natural conversation flow</li>
                                    <li>🔊 French pronunciation</li>
                                </ul>
                                <button className="mode-button">Start Voice Chat</button>
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        );
    }

    // Render the selected mode component
    if (mode === 'text') {
        return <TextMode goBack={goBackToSelection} />;
    }

    if (mode === 'audio') {
        return <AudioMode goBack={goBackToSelection} />;
    }
};

export default FrenchBuddy;

