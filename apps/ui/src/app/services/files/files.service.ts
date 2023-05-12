import { Injectable } from '@angular/core';
import {
    FileChangeEvent,
    WebcontainersService,
} from '../webcontainers/webcontainers.service';
import { ITreeNode } from '@circlon/angular-tree-component/lib/defs/api';
import { EditorService } from '../editor/editor.service';
import {
    BehaviorSubject,
    Subject,
    filter,
    map,
    merge,
    withLatestFrom,
} from 'rxjs';

export type FileNode = {
    name: string;
    path: string;
    language: string;
};

export type DirectoryNode = {
    name: string;
    path: string;
    children: Array<FileNode | DirectoryNode>;
};

@Injectable({
    providedIn: 'root',
})
export class FilesService {
    constructor(
        private readonly webcontainersService: WebcontainersService,
        private readonly editorService: EditorService
    ) {
        this.filesStructureTasks.subscribe({
            next: (task) => {
                task();

                const rootNode = this.directoryMap.get('');

                this.nodes.next(
                    rootNode ? Array.from(rootNode.children.values()) : []
                );
            },
            error: (error) => {
                console.error('Task error', error);
            },
        });
    }

    private currentEditingFilePath = '';

    private rootDirectory: DirectoryNode = { name: '', children: [], path: '' };

    private readonly nodes = new BehaviorSubject<
        Array<FileNode | DirectoryNode>
    >([this.rootDirectory]);

    private readonly filesStructureTasks = new Subject<() => void>();

    private readonly directoryMap = new Map<string, DirectoryNode>([
        ['', this.rootDirectory],
    ]);

    readonly nodes$ = this.nodes.asObservable();

    onFileActivated(node: ITreeNode) {
        const { name, path } = node.data as {
            name: string;
            path: string;
        };

        this.webcontainersService.readFile(path).subscribe((data) => {
            this.currentEditingFilePath = path;

            this.editorService.setFileData(name, data);
        });
    }

    writeEditingFile(value: string) {
        if (!this.currentEditingFilePath) {
            return;
        }

        this.webcontainersService.writeFile(this.currentEditingFilePath, value);
    }

    processFileEvent(event: FileChangeEvent, path: string) {
        const task = this[event](path);

        this.filesStructureTasks.next(task);
    }

    private add(filePath: string): () => void {
        return () => {
            const segments = filePath.split('/');
            const fileName = segments.pop();
            const directoryPath = segments.join('/');

            // TODO: add language recognition logic
            const language = '';

            const parentDirectory =
                this.directoryMap.get(directoryPath) ||
                this.directoryMap.get('');

            if (!fileName || !parentDirectory) {
                return;
            }

            const fileNode: FileNode = {
                name: fileName,
                path: filePath,
                language,
            };

            parentDirectory.children.push(fileNode);
            parentDirectory.children.sort(this.sortFunction);
        };
    }

    private addDir(directoryPath: string): () => void {
        return () => {
            const segments = directoryPath.split('/');
            const directoryName = segments.pop();
            const parentPath = segments.join('/');
            const parentDirectory =
                this.directoryMap.get(parentPath) || this.directoryMap.get('');

            if (!directoryName || !parentDirectory) {
                return;
            }

            const directoryNode: DirectoryNode = {
                name: directoryName,
                path: directoryPath,
                children: [],
            };

            parentDirectory.children.push(directoryNode);
            parentDirectory.children.sort(this.sortFunction);

            this.addToDirectoryMap(directoryPath, directoryNode);
        };
    }

    private unlink(filePath: string): () => void {
        return () => {
            const segments = filePath.split('/');
            const fileName = segments.pop();
            const directoryPath = segments.join('/');
            const parentDirectory =
                this.directoryMap.get(directoryPath) ||
                this.directoryMap.get('');

            if (!parentDirectory) {
                return;
            }

            const index = parentDirectory.children.findIndex((child) =>
                'children' in child ? false : child.name === fileName
            );

            parentDirectory.children.splice(index, 1);
        };
    }

    private change(path: string): () => void {
        return () => {
            console.log(path);
        };
    }

    private unlinkDir(directoryPath: string): () => void {
        return () => {
            const segments = directoryPath.split('/');
            const directoryName = segments.pop();
            const parentPath = segments.join('/');
            const parentDirectory =
                this.directoryMap.get(parentPath) || this.directoryMap.get('');

            if (!parentDirectory) {
                return;
            }

            const index = parentDirectory.children.findIndex(
                (child) => 'children' in child && child.name === directoryName
            );

            parentDirectory.children.splice(index, 1);

            this.directoryMap.delete(directoryPath);
        };
    }

    private addToDirectoryMap(path: string, directory: DirectoryNode): void {
        this.directoryMap.set(path, directory);
        directory.children.forEach((child) => {
            if ('children' in child) {
                this.addToDirectoryMap(`${path}/${child.name}`, child);
            }
        });
    }

    private sortFunction(
        a: FileNode | DirectoryNode,
        b: FileNode | DirectoryNode
    ): number {
        const aIsDirectory = 'children' in a;
        const bIsDirectory = 'children' in b;

        if (aIsDirectory && bIsDirectory) {
            return a.name.localeCompare(b.name);
        }
        if (aIsDirectory) {
            return -1;
        }
        if (bIsDirectory) {
            return 1;
        }
        if (a.name.length !== b.name.length) {
            return a.name.length - b.name.length;
        }
        return a.name.localeCompare(b.name);
    }
}
