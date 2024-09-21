import { useState, useEffect } from 'react';
import type { FolderContent, FileSystemItem } from '../types/fileSystem';
import Scene from './Scene';
import WelcomeScene from './WelcomeScene';

const FolderExplorer: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [folderContent, setFolderContent] = useState<FolderContent | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (currentPath) {
      console.log('Loading folder content:', currentPath);
      loadFolderContent(currentPath);
      checkCanGoBack(currentPath);
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

  const checkCanGoBack = async (currentPath: string) => {
    const parentPath = await window.electronAPI.getParentDirectory(currentPath);
    setCanGoBack(parentPath !== currentPath);
  };

  const handleItemClick = (item: FileSystemItem) => {
    console.log('Item clicked:', item);
    if (item.type === 'folder') {
      setCurrentPath(item.path);
    } else {
      console.log('File clicked:', item);
      // Implement file handling logic here
    }
  };

  const handleGoBack = async () => {
    if (currentPath) {
      const parentPath = await window.electronAPI.getParentDirectory(currentPath);
      if (parentPath !== currentPath) {
        setCurrentPath(parentPath);
      }
    }
  };

  const handleSelectFolder = async () => {
    try {
      const folderPath = await window.electronAPI.selectFolder();
      if (folderPath) {
        setCurrentPath(folderPath);
        setFolderContent(null); // Reset folder content when selecting a new folder
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {currentPath === null ? (
        <WelcomeScene onSelectFolder={handleSelectFolder} />
      ) : folderContent ? (
        <Scene 
          folderContent={folderContent} 
          onItemClick={handleItemClick} 
          onGoBack={handleGoBack}
          canGoBack={canGoBack}
          onSelectNewFolder={handleSelectFolder}
        />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default FolderExplorer;