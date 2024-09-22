import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, PerspectiveCamera, OrbitControls, MeshWobbleMaterial, Sphere, Sky } from '@react-three/drei';
import * as THREE from 'three';

interface WelcomeSceneProps {
  onSelectFolder: () => void;
}

function WelcomeItem({ onClick }: { onClick: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  // Remove the texture for now
  // const texture = useTexture('/folder-texture.jpg');

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime()) * 0.2;
    }
  });

  return (
    <group>
      <Sphere
        ref={meshRef}
        args={[1.5, 64, 64]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <MeshWobbleMaterial
          factor={0.3}
          speed={1}
          // Remove the map property
          // map={texture}
          color={hovered ? '#f39c12' : '#3498db'}
          emissive={hovered ? new THREE.Color('#f39c12') : new THREE.Color('#3498db')}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </Sphere>
      <pointLight position={[0, 0, 2]} intensity={1} color={hovered ? '#f39c12' : '#3498db'} />
    </group>
  );
}

function WelcomeText() {
  return (
    <group position={[0, 3, 0]}>
      <Text
        fontSize={0.8}
        color="#000"
        anchorX="center"
        anchorY="middle"
        // Remove the font property for now
        // font="/fonts/Roboto-Bold.ttf"
      >
        Welcome to Folder Explorer
      </Text>
      <Text
        position={[0, -1, 0]}
        fontSize={0.4}
        color="#000"
        anchorX="center"
        anchorY="middle"
        // Remove the font property for now
        // font="/fonts/Roboto-Regular.ttf"
      >
        Click the sphere to select a folder
      </Text>
    </group>
  );
}

function Background() {
  return (
    <Sky 
      distance={450000} 
      sunPosition={[0, 1, 0]} 
      inclination={0} 
      azimuth={0.25} 
    />
  );
}

export default function WelcomeScene({ onSelectFolder }: WelcomeSceneProps) {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 10]} />
      <Background />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <WelcomeItem onClick={onSelectFolder} />
      <WelcomeText />
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}