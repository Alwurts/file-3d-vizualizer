import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Environment, PerspectiveCamera, Sky, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { FolderContent, FileSystemItem } from '../types/fileSystem';
import type { ThreeEvent } from '@react-three/fiber';

interface SceneProps {
  folderContent: FolderContent | null;
  onItemClick: (item: FileSystemItem) => void;
  onGoBack: () => void;
  canGoBack: boolean;
  onSelectNewFolder: () => void;
}

const FILE_BASE_HEIGHT = 0.1;
const FILE_MAX_HEIGHT = 2;
const ITEM_BASE_SIZE = [0.8, 0.8, 0.8] as const;
const ITEM_SPACING = 1.2;

const COLORS = {
  BASE: '#2c3e50',
  FOLDER: '#f39c12',
  FILE: '#3498db',
  TEXT: '#000000'
};

function formatSize(size: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let scaledSize = size;

  while (scaledSize >= 1024 && unitIndex < units.length - 1) {
    unitIndex += 1;
    scaledSize /= 1024;
  }

  return `${scaledSize.toFixed(1)} ${units[unitIndex]}`;
}

function formatFolderSize(items: FileSystemItem[]): string {
  const totalSize = items.reduce((sum, item) => {
    if (item.type === 'file') {
      return sum + item.size;
    }
    return sum;
  }, 0);
  return formatSize(totalSize);
}

function FolderBase({ size, position, items }: { size: [number, number, number], position: [number, number, number], items: FileSystemItem[] }) {
  const [width, height, depth] = size;
  const folderSize = formatFolderSize(items);

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={COLORS.BASE} />
      </mesh>
      <Text
        position={[0, height / 2 + 0.01, depth / 2 - 0.1]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        rotation={[-Math.PI / 2, 0, 0]}
      >
        {folderSize}
      </Text>
    </group>
  );
}

function ItemBlock({ item, onClick, position }: { item: FileSystemItem; onClick: () => void; position: [number, number, number] }) {
  const [x, y, z] = position;
  const height = useMemo(() => {
    if (item.type === 'file') {
      return Math.max(FILE_BASE_HEIGHT, Math.min(FILE_MAX_HEIGHT, item.size / 1000000));
    }
    return ITEM_BASE_SIZE[1]; // Default height for folders
  }, [item]);

  const color = item.type === 'folder' ? COLORS.FOLDER : COLORS.FILE;
  const metadata = item.type === 'file' ? formatSize(item.size) : `${item.itemCount} items`;

  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const clickStartPosition = useRef<THREE.Vector2 | null>(null);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, isHovered ? 1.1 : 1, 0.1);
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, isHovered ? 1.1 : 1, 0.1);
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, isHovered ? 1.1 : 1, 0.1);
    }
  });

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    setIsClicking(true);
    clickStartPosition.current = new THREE.Vector2(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (isClicking && clickStartPosition.current) {
      const endPosition = new THREE.Vector2(event.clientX, event.clientY);
      const distance = clickStartPosition.current.distanceTo(endPosition);
      
      if (distance < 5) { // Adjust this threshold as needed
        onClick();
      }
    }
    setIsClicking(false);
    clickStartPosition.current = null;
  };

  const handlePointerLeave = () => {
    setIsClicking(false);
    setIsHovered(false);
    clickStartPosition.current = null;
  };

  const hoverColor = new THREE.Color(color).multiplyScalar(1.2).getHexString();

  return (
    <group position={[x, y + height / 2, z]}>
      <mesh 
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerEnter={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        <boxGeometry args={[ITEM_BASE_SIZE[0], height, ITEM_BASE_SIZE[2]]} />
        <meshStandardMaterial color={isHovered ? `#${hoverColor}` : color} roughness={0.7} metalness={0.3} />
      </mesh>
      <Text
        position={[0, height / 2 + 0.4, 0]}
        fontSize={0.15}
        color={COLORS.TEXT}
        anchorY="bottom"
        anchorX="center"
        maxWidth={ITEM_BASE_SIZE[0] * 0.9}
        textAlign="center"
        overflowWrap="break-word"
      >
        {item.name}
      </Text>
      <Text
        position={[0, height / 2 + 0.2, 0]}
        fontSize={0.1}
        color={COLORS.TEXT}
        anchorY="bottom"
        anchorX="center"
        maxWidth={ITEM_BASE_SIZE[0] * 0.9}
        textAlign="center"
      >
        {metadata}
      </Text>
    </group>
  );
}

function FolderContentGroup({ items, onItemClick, position }: { items: FileSystemItem[]; onItemClick: (item: FileSystemItem) => void; position: [number, number, number] }) {
  const gridSize = Math.ceil(Math.sqrt(items.length));
  const baseSize: [number, number, number] = [gridSize * ITEM_SPACING, 0.2, gridSize * ITEM_SPACING];

  return (
    <group position={position}>
      <FolderBase size={baseSize} position={[0, -0.1, 0]} items={items} />
      {items.map((item, index) => {
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const itemX = (col - gridSize / 2 + 0.5) * ITEM_SPACING;
        const itemZ = (row - gridSize / 2 + 0.5) * ITEM_SPACING;
        return (
          <ItemBlock
            key={item.path}
            item={item}
            onClick={() => onItemClick(item)}
            position={[itemX, 0, itemZ]}
          />
        );
      })}
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

function GoBackButton({ onClick, canGoBack }: { onClick: () => void; canGoBack: boolean }) {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      zIndex: 1000
    }}>
      <button 
        onClick={onClick} 
        disabled={!canGoBack}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: canGoBack ? '#3498db' : '#bdc3c7',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: canGoBack ? 'pointer' : 'not-allowed'
        }}
        type="button"
      >
        Go Back
      </button>
    </div>
  );
}

function SelectNewFolderButton({ onClick }: { onClick: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000
    }}>
      <button 
        onClick={onClick}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#2ecc71',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
        type="button"
      >
        Select New Folder
      </button>
    </div>
  );
}

export default function Scene({ folderContent, onItemClick, onGoBack, canGoBack, onSelectNewFolder }: SceneProps) {
  if (!folderContent) {
    return null;
  }

  return (
    <>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 10, 20]} fov={50} />
        <Background />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#ff8080" />
        <directionalLight position={[-5, 5, 5]} intensity={0.5} castShadow />
        <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.8} castShadow />
        <FolderContentGroup
          items={folderContent.items}
          onItemClick={onItemClick}
          position={[0, 0, 0]}
        />
        <OrbitControls enableDamping dampingFactor={0.05} />
        <Environment preset="sunset" />
      </Canvas>
      <GoBackButton onClick={onGoBack} canGoBack={canGoBack} />
      <SelectNewFolderButton onClick={onSelectNewFolder} />
    </>
  );
}