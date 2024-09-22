import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Environment, PerspectiveCamera, Sky } from '@react-three/drei';
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

const MIN_HEIGHT = 0.2;
const MAX_HEIGHT = 2;

const COLORS = {
  BASE: '#2c3e50',
  FOLDER: '#f39c12',
  FILE: '#3498db',
  TEXT: '#000000'
};

function formatSize(size: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
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

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
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

function ItemBlock({ item, onClick, position, minSize, maxSize, showNames, isTextVisible }: { 
  item: FileSystemItem; 
  onClick: () => void; 
  position: [number, number, number];
  minSize: number;
  maxSize: number;
  showNames: boolean;
  isTextVisible: boolean;
}) {
  const [x, y, z] = position;
  const height = useMemo(() => {
    if (minSize === maxSize) {
      return (MIN_HEIGHT + MAX_HEIGHT) / 2;
    }
    const sizeRatio = (item.size - minSize) / (maxSize - minSize);
    return MIN_HEIGHT + sizeRatio * (MAX_HEIGHT - MIN_HEIGHT);
  }, [item, minSize, maxSize]);

  const color = item.type === 'folder' ? COLORS.FOLDER : COLORS.FILE;
  const metadata = item.type === 'file' ? formatSize(item.size) : `${item.itemCount} items, ${formatSize(item.size)}`;

  const meshRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const clickStartPosition = useRef<THREE.Vector2 | null>(null);

  const { raycaster, camera } = useThree();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, isHovered ? 1.1 : 1, 0.1);
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, isHovered ? 1.1 : 1, 0.1);
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, isHovered ? 1.1 : 1, 0.1);
    }
  });

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (meshRef.current) {
      const intersects = raycaster.intersectObject(meshRef.current, true);
      if (intersects.length > 0) {
        const intersect = intersects[0];
        const distance = intersect.point.distanceTo(camera.position);
        if (distance < camera.far) {
          setIsHovered(true);
        } else {
          setIsHovered(false);
        }
      } else {
        setIsHovered(false);
      }
    }
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setIsClicking(true);
    clickStartPosition.current = new THREE.Vector2(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (isClicking && clickStartPosition.current) {
      const endPosition = new THREE.Vector2(event.clientX, event.clientY);
      const distance = clickStartPosition.current.distanceTo(endPosition);
      
      if (distance < 5) {
        onClick();
      }
    }
    setIsClicking(false);
    clickStartPosition.current = null;
  };

  const handlePointerLeave = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    setIsClicking(false);
    setIsHovered(false);
    clickStartPosition.current = null;
  };

  const hoverColor = new THREE.Color(color).multiplyScalar(1.2).getHexString();

  const nameFontSize = showNames ? 0.15 : (isHovered || isTextVisible ? 0.2 : 0);
  const metadataFontSize = showNames ? 0.1 : (isHovered || isTextVisible ? 0.15 : 0);

  const displayName = showNames && !isHovered && !isTextVisible ? truncateText(item.name, 15) : item.name;

  return (
    <group position={[x, y + height / 2, z]}>
      <mesh 
        ref={meshRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        <boxGeometry args={[ITEM_BASE_SIZE[0], height, ITEM_BASE_SIZE[2]]} />
        <meshStandardMaterial color={isHovered || isTextVisible ? `#${hoverColor}` : color} roughness={0.7} metalness={0.3} />
      </mesh>
      {(showNames || isHovered || isTextVisible) && (
        <>
          <Text
            position={[0, height / 2 + 0.4, 0]}
            fontSize={nameFontSize}
            color={COLORS.TEXT}
            anchorY="bottom"
            anchorX="center"
            maxWidth={ITEM_BASE_SIZE[0] * 0.9}
            textAlign="center"
            overflowWrap="break-word"
          >
            {displayName}
          </Text>
          <Text
            position={[0, height / 2 + 0.2, 0]}
            fontSize={metadataFontSize}
            color={COLORS.TEXT}
            anchorY="bottom"
            anchorX="center"
            maxWidth={ITEM_BASE_SIZE[0] * 0.9}
            textAlign="center"
          >
            {metadata}
          </Text>
        </>
      )}
    </group>
  );
}

function FolderContentGroup({ items, onItemClick, position, showNames, visibleTextItems }: { items: FileSystemItem[]; onItemClick: (item: FileSystemItem) => void; position: [number, number, number]; showNames: boolean; visibleTextItems: Set<string>; }) {
  const gridSize = Math.ceil(Math.sqrt(items.length));
  const baseSize: [number, number, number] = [gridSize * ITEM_SPACING, 0.2, gridSize * ITEM_SPACING];

  const sizes = items.map(item => item.size);
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);

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
            minSize={minSize}
            maxSize={maxSize}
            showNames={showNames}
            isTextVisible={visibleTextItems.has(item.path)}
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

type SortOption = 'name' | 'size' | 'type';

function SortSelector({ onSortChange }: { onSortChange: (option: SortOption) => void }) {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000
    }}>
      <select 
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        style={{
          padding: '10px',
          fontSize: '16px',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        <option value="name">Sort by Name</option>
        <option value="size">Sort by Size</option>
        <option value="type">Sort by Type</option>
      </select>
    </div>
  );
}

function ToggleNamesButton({ showNames, onToggle }: { showNames: boolean; onToggle: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 1000
    }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        backgroundColor: '#3498db',
        padding: '10px',
        borderRadius: '5px',
        color: 'white'
      }}>
        <input
          type="checkbox"
          checked={showNames}
          onChange={onToggle}
          style={{ marginRight: '10px' }}
        />
        Always Show Names
      </label>
    </div>
  );
}

function CameraController({ folderContent }: { folderContent: FolderContent | null }) {
  const controlsRef = useRef<typeof OrbitControls>(null);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [folderContent]);

  return <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05} />;
}

export default function Scene({ folderContent, onItemClick, onGoBack, canGoBack, onSelectNewFolder }: SceneProps) {
  const [sortOption, setSortOption] = useState<SortOption>('name');
  const [showNames, setShowNames] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const sortedItems = useMemo(() => {
    if (!folderContent) return [];
    return [...folderContent.items].sort((a, b) => {
      switch (sortOption) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return b.size - a.size;
        case 'type':
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'folder' ? -1 : 1;
        default:
          return 0;
      }
    });
  }, [folderContent, sortOption]);

  const handleItemClick = (item: FileSystemItem) => {
    if (item.type === 'file') {
      setSelectedItem(prev => prev === item.path ? null : item.path);
    } else {
      // For folders, reset selected item and call the original onItemClick
      setSelectedItem(null);
      onItemClick(item);
    }
  };

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
          items={sortedItems}
          onItemClick={handleItemClick}
          position={[0, 0, 0]}
          showNames={showNames}
          visibleTextItems={new Set(selectedItem ? [selectedItem] : [])}
        />
        <CameraController key={folderContent?.items.length} folderContent={folderContent} />
        <Environment preset="sunset" />
      </Canvas>
      <GoBackButton onClick={onGoBack} canGoBack={canGoBack} />
      <SelectNewFolderButton onClick={onSelectNewFolder} />
      <SortSelector onSortChange={setSortOption} />
      <ToggleNamesButton showNames={showNames} onToggle={() => setShowNames(!showNames)} />
    </>
  );
}