export type FileNode = {
    name: string;
    path: string;
};

export type DirectoryNode = {
    name: string;
    path: string;
    children: Array<FileNode | DirectoryNode>;
};
