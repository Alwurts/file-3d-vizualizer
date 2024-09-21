import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import type { FolderContent, FileSystemItem } from '../types/fileSystem';

interface SceneProps {
  folderContent: FolderContent | null;
  onItemClick: (item: FileSystemItem) => void;
}

const FILE_BASE_HEIGHT = 0.1;
const FILE_MAX_HEIGHT = 2;
const ITEM_BASE_SIZE = [0.8, 0.8, 0.8] as const;
const ITEM_SPACING = 1.2;

const COLORS = {
  BASE: 'rgb(60, 60, 60)',
  FOLDER: 'rgb(255, 190, 70)',
  FILE: 'rgb(100, 180, 255)'
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

function FolderBase({ size, position }: { size: [number, number, number], position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={COLORS.BASE} />
    </mesh>
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

  return (
    <group position={[x, y + height / 2, z]}>
      <mesh onClick={onClick}>
        <boxGeometry args={[ITEM_BASE_SIZE[0], height, ITEM_BASE_SIZE[2]]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, height / 2 + 0.4, 0]}
        fontSize={0.15}
        color="white"
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
        color="white"
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

function FolderContent({ items, onItemClick, position }: { items: FileSystemItem[]; onItemClick: (item: FileSystemItem) => void; position: [number, number, number] }) {
  const gridSize = Math.ceil(Math.sqrt(items.length));
  const baseSize: [number, number, number] = [gridSize * ITEM_SPACING, 0.2, gridSize * ITEM_SPACING];

  return (
    <group position={position}>
      <FolderBase size={baseSize} position={[0, -0.1, 0]} />
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

export default function Scene({ folderContent, onItemClick }: SceneProps) {
  if (!folderContent) {
    return null;
  }

  return (
    <Canvas camera={{ position: [0, 10, 20], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <FolderContent
        items={folderContent.items}
        onItemClick={onItemClick}
        position={[0, 0, 0]}
      />
      <OrbitControls />
    </Canvas>
  );
}