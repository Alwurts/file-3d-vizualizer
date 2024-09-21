import { useState, useEffect } from 'react';
import type { FolderContent, FileSystemItem } from '../types/fileSystem';
import Scene from './Scene';

declare global {
  interface Window {
    electronAPI: {
      getFolderContent: (folderPath: string) => Promise<FolderContent>;
    };
  }
}

const FolderExplorer: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('C:\\Users\\aleja\\Development');
  const [folderContent, setFolderContent] = useState<FolderContent | null>(null);
  const [pathHistory, setPathHistory] = useState<string[]>([]);

  useEffect(() => {
    if (currentPath) {
      console.log('Loading folder content:', currentPath);
      loadFolderContent(currentPath);
    }
  }, [currentPath]);

  const loadFolderContent = async (folderPath: string) => {
    try {
      const content = await window.electronAPI.getFolderContent(folderPath);
      console.log('Folder content loaded:', content);
      setFolderContent(content);
    } catch (error) {
      console.error('Error loading folder content:', error);
    }
  };

  const handleItemClick = (item: FileSystemItem) => {
    console.log('Item clicked:', item);
    if (item.type === 'folder') {
      setPathHistory(prev => [...prev, currentPath]);
      setCurrentPath(item.path);
    } else {
      console.log('File clicked:', item);
      // Implement file handling logic here
    }
  };

  const handleGoBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(prev => prev.slice(0, -1));
      setCurrentPath(previousPath);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {folderContent ? (
        <Scene 
          folderContent={folderContent} 
          onItemClick={handleItemClick} 
          onGoBack={handleGoBack}
          canGoBack={pathHistory.length > 0}
        />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default FolderExplorer;