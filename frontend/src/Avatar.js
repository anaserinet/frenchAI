import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { useRef, useEffect } from 'react';

function Model({ isTalking }) {
  const { scene } = useGLTF('/avatar.glb'); // put the .glb file in /public
  const modelRef = useRef();

  useEffect(() => {
    if (modelRef.current) {
      // Add subtle talking animation
      if (isTalking) {
        const interval = setInterval(() => {
          modelRef.current.rotation.y += 0.01;
        }, 50);
        return () => clearInterval(interval);
      }
    }
  }, [isTalking]);

  return <primitive ref={modelRef} object={scene} />;
}

export default function Avatar({ isTalking = false }) {
  return (
    <div style={{ 
      width: 300, 
      height: 300, 
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: isTalking ? '0 0 20px rgba(74, 144, 226, 0.5)' : '0 4px 8px rgba(0,0,0,0.1)',
      transition: 'box-shadow 0.3s ease'
    }}>
      <Canvas camera={{ position: [0, 0, 2] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Model isTalking={isTalking} />
        <OrbitControls enableZoom={false} />
      </Canvas>
    </div>
  );
}