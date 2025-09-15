import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { useFrame, Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import './AudioMode.css';

// Ready Player Me Avatar Model Component
function Model({ isTalking }) {
  const { scene, nodes } = useGLTF('/avatar.glb');   // nodes gives you meshes
  const modelRef = useRef();
  const headRef = useRef(); // will hold the head mesh that has blendshapes

  useEffect(() => {
    if (!modelRef.current) return;

    // Center/raise the avatar so you see the head
    modelRef.current.position.set(0, -0.8, 0);

    // Look up the mesh that contains mouth blendshapes
    // Inspect your .glb in https://gltf-viewer.donmccurdy.com/
    // and replace 'Wolf3D_Head' if it’s named differently.
    headRef.current = nodes.Wolf3D_Head;
  }, [nodes]);

  // Animate mouthOpen morph target
  useFrame((state) => {
    if (!headRef.current) return;
    const idx = headRef.current.morphTargetDictionary?.mouthOpen;
    if (idx === undefined) return;
    headRef.current.morphTargetInfluences[idx] =
      isTalking ? 0.3 + 0.2 * Math.sin(state.clock.elapsedTime * 10) : 0;
  });

  return <primitive ref={modelRef} object={scene} scale={[2, 2, 2]} />;
}


// Main Avatar Component - Using CSS classes
function Avatar({ isTalking = false, size = "large" }) {
  const avatarClass = size === "large"
    ? `woman_avatar audio-large ${isTalking ? 'talking' : ''}`
    : `woman_avatar ${isTalking ? 'talking' : ''}`;

  return (
    <div className={avatarClass}>
      <Canvas camera={{ position: [0, 0.2, 3], fov: 35 }}>

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[0, 2, 2]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-2, 0, 1]} intensity={0.3} color="#a7c5f7" />

        <Model isTalking={isTalking} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 3}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}

const AudioMode = ({ goBack }) => {
  const [isListening, setIsListening] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [currentText, setCurrentText] = useState("Bonjour! Je suis votre assistant français. Cliquez sur le microphone et commencez à parler en français!");
  const [status, setStatus] = useState({ message: '', type: '' });
  const [recognition, setRecognition] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  // Speech recognition setup
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'fr-FR';

      recognitionInstance.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setCurrentText(`Vous avez dit: "${transcript}"`);

        // ✅ Correct call and update conversation history
        const response = await generateResponse(conversationHistory, transcript);


        setConversationHistory(prev => [
          ...prev,
          { role: "user", content: transcript },
          { role: "assistant", content: response }
        ]);

        setTimeout(() => {
          setCurrentText(response);
          if (!isMuted) {
            speakText(response);
          }
        }, 1000);
      };


      recognitionInstance.onerror = (event) => {
        showStatus(`Erreur: ${event.error}`, 'error');
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [isMuted]);

  const showStatus = (message, type) => {
    setStatus({ message, type });
    setTimeout(() => setStatus({ message: '', type: '' }), 3000);
  };

  const generateResponse = async (conversationHistory, userInput) => {
    try {
      const response = await fetch("https://frenchai.onrender.com/chat", {
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
    if (!('speechSynthesis' in window) || isMuted) return;

    // Stop any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;

    const voices = speechSynthesis.getVoices();
    const french = voices.find(v =>
      v.name.includes("French") && v.name.includes("France")
    );
    if (french) utterance.voice = french;

    utterance.onstart = () => setIsTalking(true);
    utterance.onend = () => setIsTalking(false);

    speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognition) {
      showStatus('Speech recognition not supported', 'error');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      // Stop any ongoing speech before listening
      speechSynthesis.cancel();
      setIsTalking(false);

      recognition.start();
      setIsListening(true);
      setCurrentText("🎤 J'écoute... Parlez maintenant!");
      showStatus('Listening... Speak in French', 'success');
    }
  };

  const toggleMute = () => {
    if (!isMuted && isTalking) {
      speechSynthesis.cancel();
      setIsTalking(false);
    }
    setIsMuted(!isMuted);
  };

  return (
    <div className="audio-mode">
      {/* Header */}
      <div className="audio-header">
        <div className="audio-header-content">
          <button onClick={goBack} className="audio-back-button">
            <ArrowLeft size={20} />
            Back to Mode Selection
          </button>

          <h1 className="audio-title">
            🎙️ Audio French Practice
          </h1>

          <button
            onClick={toggleMute}
            className="audio-mute-button"
            title={isMuted ? "Unmute responses" : "Mute responses"}
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="audio-main-content">
        {/* Avatar Section */}
        <div className="audio-avatar-section">
          <Avatar isTalking={isTalking} size="large" />
        </div>

        {/* Text Display */}
        <div className="audio-text-display">
          <p className="audio-text-content">
            {currentText}
          </p>
        </div>

        {/* Controls */}
        <div className="audio-controls">
          <button
            onClick={toggleListening}
            className={`audio-main-btn ${isListening ? 'recording' : ''}`}
          >
            {isListening ? <MicOff size={48} /> : <Mic size={48} />}
          </button>
        </div>

        {/* Status Display */}
        {status.message && (
          <div className={`audio-status ${status.type}`}>
            {status.message}
          </div>
        )}

        {/* Instructions */}
        <div className="audio-instructions">
          <p className="audio-instructions-text">
            Click the microphone to start a voice conversation in French.
            I'll listen, respond, and help you practice!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AudioMode;