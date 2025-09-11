/* Website's 'Text Mode'
   Each message object has:
   - text (what was said),
   - isUser (true = user, false = bot),
   - corrections (grammar fixes),
   - suggestions (encouragement, tips)

   Other states:
   - inputText → what's typed in the input box or transcribed from speech.
   - isRecording → whether the mic is listening.
   - status → temporary UI messages (e.g. "Listening…").
   - recognition → the speech recognition object.
*/


import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, MessageCircle, Lightbulb, ArrowLeft } from 'lucide-react';
import './AudioMode.css';

const TextMode = ({ goBack }) => {
    // Your ORIGINAL state variables - UNCHANGED
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Bonjour! Je suis votre assistant français. Commencez à parler en français et je vous aiderai avec des corrections et des suggestions!",
            isUser: false,
            timestamp: new Date().toLocaleTimeString(),
            corrections: [],
            suggestions: []
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [status, setStatus] = useState({ message: '', type: '' });
    const [recognition, setRecognition] = useState(null);

    const [isTalking, setIsTalking] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Your ORIGINAL speech recognition setup - UNCHANGED
    // preload voices + speech recognition
    useEffect(() => {
        if ('speechSynthesis' in window) {
            // ensures Chrome/Edge loads available voices early
            speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
        }

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'fr-FR';

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputText(transcript);
                showStatus(`Speech recognized: ${transcript}`, 'success');
            };
            recognitionInstance.onerror = (event) => {
                showStatus(`Speech recognition error: ${event.error}`, 'error');
                setIsRecording(false);
            };
            recognitionInstance.onend = () => setIsRecording(false);
            setRecognition(recognitionInstance);
        }
    }, []);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Your ORIGINAL functions - UNCHANGED
    const showStatus = (message, type) => {
        setStatus({ message, type });
        setTimeout(() => setStatus({ message: '', type: '' }), 3000);
    };

    const analyzeFrenchText = async (text) => {
        try {
            const response = await fetch("https://api.languagetool.org/v2/check", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ text: text, language: "fr" })
            });

            const data = await response.json();
            const corrections = data.matches.map(match => {
                const replacement = match.replacements[0]?.value;
                return replacement ? `${match.message} → Essayez: "${replacement}"` : match.message;
            });

            const suggestions = [];
            if (text.split(" ").length > 5) suggestions.push("Super phrase complète !");

            return { corrections, suggestions };
        } catch (err) {
            console.error("Grammar API error:", err);
            return { corrections: [], suggestions: [] };
        }
    };

    const generateResponse = async (conversationHistory, userInput) => {
        try {
            const response = await fetch("http://localhost:5000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ history: conversationHistory, userInput })
            });

            const data = await response.json();
            console.log("Backend returned:", data);
            return data.reply || "Erreur de réponse API";
        } catch (err) {
            console.error("Error calling backend:", err);
            return "Désolé, je n'ai pas compris.";
        }
    };

    const speakText = (text) => {
        if (!('speechSynthesis' in window)) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.9;

        const voices = speechSynthesis.getVoices();
        const french = voices.find(v =>
            v.name === "Microsoft VivienneMultilingual Online (Natural) - French (France)"
        );
        if (french) utterance.voice = french;

        // NEW: toggle talking animation
        utterance.onstart = () => setIsTalking(true);
        utterance.onend = () => setIsTalking(false);

        speechSynthesis.speak(utterance);
    };



    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const userMessage = {
            id: messages.length + 1,
            text: inputText,
            isUser: true,
            timestamp: new Date().toLocaleTimeString(),
            corrections: [],
            suggestions: []
        };

        const { corrections, suggestions } = await analyzeFrenchText(inputText);
        const responseText = await generateResponse(messages, inputText);

        const botMessage = {
            id: messages.length + 2,
            text: responseText,
            isUser: false,
            timestamp: new Date().toLocaleTimeString(),
            corrections,
            suggestions
        };

        setMessages(prev => [...prev, userMessage, botMessage]);
        setInputText('');
        setTimeout(() => speakText(responseText), 500);
    };

    const toggleRecording = () => {
        if (!recognition) {
            showStatus('Speech recognition not supported in this browser', 'error');
            return;
        }
        if (isRecording) recognition.stop();
        else {
            recognition.start();
            showStatus('Listening... Speak in French', 'success');
        }
        setIsRecording(!isRecording);
    };

    const fillInput = (text) => {
        setInputText(text);
        inputRef.current?.focus();
    };

    // Your ORIGINAL constants - UNCHANGED
    const quickPhrases = [
        "Bonjour, comment allez-vous?",
        "Je suis en train d'apprendre le français",
        "Pouvez-vous m'aider?",
        "Qu'est-ce que vous pensez?",
        "Comment dit-on... en français?",
        "Je ne comprends pas"
    ];

    const learningTips = [
        "🗣️ Try speaking aloud for pronunciation practice",
        "📝 Pay attention to article agreement (le/la/les)",
        "🔄 Practice verb conjugations regularly",
        "✅ Don't worry about mistakes - they help you learn!",
        "🎯 Start with simple sentences and build up",
        "📚 Use common phrases daily"
    ];

    return (
        <div className="app">
            <div className="container">
                {/* Header with back button */}
                <div className="header">
                    <div className="header-content">
                        <button onClick={goBack} className="back-button">
                            <ArrowLeft size={20} />
                            Back to Mode Selection
                        </button>
                        <div className="header-text">
                            <h1>🇫🇷 French Conversational Buddy</h1>
                            <p>Practice your French with AI-powered corrections and feedback</p>
                        </div>
                    </div>
                </div>

                <div className="main-content">

                    <div className={`woman_avatar ${isTalking ? 'talking' : ''}`}>
                        <img src="/woman.jpg" alt="French Woman Avatar" />
                    </div>


                    {/* Chat Area */}
                    <div className="chat-area">
                        <div className="messages-container">
                            <div className="messages">
                                {messages.map((message) => (
                                    <div key={message.id} className="message-group">
                                        <div className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}>
                                            <div className="message-text">{message.text}</div>
                                            <div className="timestamp">{message.timestamp}</div>
                                        </div>

                                        {message.corrections.map((correction, idx) => (
                                            <div key={idx} className="correction">
                                                <span className="correction-label">⚠️ Correction:</span>
                                                <span className="correction-text">{correction}</span>
                                            </div>
                                        ))}

                                        {message.suggestions.map((suggestion, idx) => (
                                            <div key={idx} className="suggestion">
                                                <span className="suggestion-label">💡 Suggestion:</span>
                                                <span className="suggestion-text">{suggestion}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Section */}
                        <div className="input-section">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Tapez votre message en français..."
                                className="text-input"
                            />
                            <button onClick={sendMessage} className="send-btn">
                                <Send size={20} /> ENVOYER
                            </button>
                            <button
                                onClick={toggleRecording}
                                className={`mic-btn ${isRecording ? 'recording' : ''}`}
                            >
                                {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                            </button>
                        </div>

                        {status.message && (
                            <div className={`status ${status.type}`}>
                                {status.message}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="sidebar">
                        <div className="sidebar-section">
                            <h3 className="sidebar-title"><Lightbulb size={24} /> Tips for Learning</h3>
                            <ul className="tips-list">
                                {learningTips.map((tip, idx) => (
                                    <li key={idx}>{tip}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="sidebar-section">
                            <h3 className="sidebar-title"><MessageCircle size={24} /> Quick Phrases</h3>
                            <div className="phrases-container">
                                {quickPhrases.map((phrase, idx) => (
                                    <button key={idx} onClick={() => fillInput(phrase)} className="phrase-btn">
                                        {phrase}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="voice-info">
                            <h4 className="voice-title"><Volume2 size={20} /> Voice Features</h4>
                            <p className="voice-description">
                                • Click the microphone to speak in French<br />
                                • Responses are automatically spoken aloud<br />
                                • Works best in Chrome/Edge browsers
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default TextMode;
