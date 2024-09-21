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
