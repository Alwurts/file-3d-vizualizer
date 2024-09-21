export interface BaseItem {
	name: string;
	path: string;
	modifiedAt: Date;
}

export interface FileItem extends BaseItem {
	type: 'file';
	size: number;
	extension: string;
}

export interface FolderItem extends BaseItem {
	type: 'folder';
	itemCount: number;
}

export type FileSystemItem = FileItem | FolderItem;

export interface FolderContent {
	items: FileSystemItem[];
}

declare global {
	interface Window {
		electronAPI: {
			getFolderContent: (folderPath: string) => Promise<FolderContent>;
			selectFolder: () => Promise<string | null>;
			getParentDirectory: (currentPath: string) => Promise<string>;
		};
	}
}

export interface SceneProps {
	folderContent: FolderContent | null;
	onItemClick: (item: FileSystemItem) => void;
	onGoBack: () => void;
	canGoBack: boolean;
	onSelectNewFolder: () => void;
}
