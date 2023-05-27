import { Injectable } from '@angular/core';
import { DBConfig, NgxIndexedDBService } from 'ngx-indexed-db';
import { EMPTY, Observable, defer, from } from 'rxjs';
import { switchMap, mergeMap, map } from 'rxjs/operators';
import { WebcontainersService } from '../webcontainers/webcontainers.service';
import { DirectoryNode, FileNode } from '@online-editor/types';
import * as JSZip from 'jszip';

export const fileDbConfig: DBConfig = {
    name: 'FileDb',
    version: 1,
    objectStoresMeta: [
        {
            store: 'files',
            storeConfig: { keyPath: 'path', autoIncrement: false },
            storeSchema: [
                { name: 'path', keypath: 'path', options: { unique: true } },
                {
                    name: 'content',
                    keypath: 'content',
                    options: { unique: false },
                },
            ],
        },
    ],
};

type FileStorageNode = {
    path: string;
    content: string;
};

const fileSystemDirectoriesStoreName = 'fileSystemDirectoriesStoreName';

@Injectable({
    providedIn: 'root',
})
export class FileStorageService {
    constructor(
        private readonly dbService: NgxIndexedDBService,
        private readonly webcontainersService: WebcontainersService
    ) {}

    addOrUpdateFile(file: FileStorageNode): Observable<FileStorageNode> {
        return this.dbService.getByKey('files', file.path).pipe(
            switchMap((existingEntry) => {
                if (existingEntry) {
                    return this.dbService.update<FileStorageNode>(
                        'files',
                        file
                    );
                } else {
                    return this.dbService.add<FileStorageNode>('files', file);
                }
            })
        );
    }

    getFileByPath(path: string): Observable<FileStorageNode> {
        return this.dbService.getByKey('files', path);
    }

    deleteFile(path: string): Observable<unknown[]> {
        return this.dbService.delete('files', path);
    }

    clearFiles() {
        return this.dbService.clear('files');
    }

    getAllFiles() {
        return this.dbService.getAll<{ path: string; content: string }>(
            'files'
        );
    }

    addOrUpdateDirectoriesStructure(
        nodes: Array<FileNode | DirectoryNode>
    ): void {
        const onlyDirectoriesNodes = nodes
            .filter(
                (node): node is DirectoryNode =>
                    'children' in node && node.name !== 'node_modules'
            )
            .map((node) => this.getDirectoriesOnly(node));

        localStorage.setItem(
            fileSystemDirectoriesStoreName,
            JSON.stringify(onlyDirectoriesNodes)
        );
    }

    getDirectoriesStructure(): Array<DirectoryNode> | undefined {
        const stringifiedFilesStructure = localStorage.getItem(
            fileSystemDirectoriesStoreName
        );

        if (!stringifiedFilesStructure) {
            return;
        }

        return JSON.parse(stringifiedFilesStructure);
    }

    deleteDirectoriesStructure() {
        localStorage.removeItem(fileSystemDirectoriesStoreName);
    }

    isProjectSavedLocally() {
        return fileSystemDirectoriesStoreName in localStorage;
    }

    restoreProject() {
        const directories = this.getDirectoriesStructure();

        if (!directories) {
            return EMPTY;
        }

        return this.restoreDirectories(directories).pipe(
            mergeMap(() => this.getAllFiles()),
            mergeMap((files) => from(files)),
            mergeMap(({ path, content }) =>
                this.webcontainersService.writeFile(path, content)
            )
        );
    }

    getProjectDataAsZip(rootDirectories: Array<DirectoryNode>) {
        return this.getAllFiles().pipe(
            map((files) => this.getBlob(files)),
            map((blob) => [
                this.getBlob(this.getAllDirectories(rootDirectories)),
                blob,
            ]),
            mergeMap(([directories, files]) => {
                const zip = new JSZip();

                zip.file('directories.json', directories);
                zip.file('files.json', files);

                return defer(() => zip.generateAsync({ type: 'blob' }));
            })
        );
    }

    private getDirectoriesOnly(node: DirectoryNode): DirectoryNode {
        return {
            ...node,
            children: node.children
                .filter(
                    (child): child is DirectoryNode =>
                        'children' in child && child.name !== 'node_modules'
                )
                .map((child) => this.getDirectoriesOnly(child)),
        };
    }

    private restoreDirectories(directories: Array<DirectoryNode>) {
        const flattenDirectories = this.getAllDirectories(directories);

        return from(flattenDirectories).pipe(
            mergeMap(({ path }) => this.webcontainersService.mkDir(path))
        );
    }

    private getAllDirectories(
        directories: Array<DirectoryNode>
    ): DirectoryNode[] {
        const allDirectories: Array<DirectoryNode> = [];

        for (const directory of directories) {
            this.dfs(allDirectories, directory);
        }

        return allDirectories;
    }

    private dfs(
        directories: Array<DirectoryNode>,
        curDirectory: DirectoryNode
    ) {
        directories.push(curDirectory);

        for (const child of curDirectory.children) {
            this.dfs(directories, child as DirectoryNode);
        }
    }

    private getBlob(data: any) {
        return new Blob([JSON.stringify(data)], {
            type: 'application/json',
        });
    }
}
