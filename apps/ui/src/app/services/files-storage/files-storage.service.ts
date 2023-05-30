import { Injectable } from '@angular/core';
import { DBConfig, NgxIndexedDBService } from 'ngx-indexed-db';
import { EMPTY, Observable, combineLatest, defer, from, of } from 'rxjs';
import { switchMap, mergeMap, map, tap, finalize } from 'rxjs/operators';
import { WebcontainersService } from '../webcontainers/webcontainers.service';
import { DirectoryNode, FileNode } from '@online-editor/types';
import * as JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';

const directoriesFilename = 'directories.json';
const filesFilename = 'files.json';

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
    private dfsWorker!: Worker;

    constructor(
        private readonly dbService: NgxIndexedDBService,
        private readonly webcontainersService: WebcontainersService
    ) {
        if (typeof Worker !== 'undefined') {
            this.dfsWorker = new Worker(
                new URL('../../workers/dfs.worker.ts', import.meta.url)
            );
        } else {
            console.warn('Web Workers are not supported in this environment.');
        }
    }

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

    restoreProject(
        directories: Array<DirectoryNode>,
        files: Array<{ path: string; content: string }>
    ) {
        return this.restoreDirectories(directories).pipe(
            mergeMap(() => from(files)),
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

                zip.file(directoriesFilename, directories);
                zip.file(filesFilename, files);

                return defer(() => zip.generateAsync({ type: 'blob' }));
            })
        );
    }

    unzipDownloadedProject(zipFile: Blob) {
        return defer(() => new JSZip().loadAsync(zipFile)).pipe(
            mergeMap((zipData) => {
                const directoriesZip = zipData.file(directoriesFilename);
                const filesZip = zipData.file(filesFilename);

                if (!directoriesZip || !filesZip) {
                    return EMPTY;
                }

                return combineLatest([
                    directoriesZip.async('string'),
                    filesZip.async('string'),
                ]);
            }),
            mergeMap(([directories, files]) => {
                const parsedDirectories: Array<DirectoryNode> =
                    JSON.parse(directories);

                const parsedFiles: Array<{ path: string; content: string }> =
                    JSON.parse(files);

                return this.restoreProject(parsedDirectories, parsedFiles);
            })
        );
    }

    generateUniqueProjectFileName() {
        return uuidv4();
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
        return this.getAllDirectories(directories).pipe(
            mergeMap((directories) => from(directories)),
            mergeMap(({ path }) => this.webcontainersService.mkDir(path))
        );
    }

    private getAllDirectories(directories: Array<DirectoryNode>) {
        let allDirectories: Array<DirectoryNode> = [];

        return of(...directories).pipe(
            mergeMap((directory) => this.dfs(allDirectories, directory)),
            tap((newAllDirectories) => {
                allDirectories = newAllDirectories;
            }),
            finalize(() => allDirectories)
        );
    }

    private dfs(
        directories: Array<DirectoryNode>,
        curDirectory: DirectoryNode
    ) {
        return defer<Promise<Array<DirectoryNode>>>(
            () =>
                new Promise((resolve, reject) => {
                    this.dfsWorker.onmessage = ({ data }) => {
                        resolve(data);
                    };

                    this.dfsWorker.onerror = (error) => {
                        reject(error);
                    };

                    this.dfsWorker.postMessage({ directories, curDirectory });
                })
        );
    }

    private getBlob(data: any) {
        return new Blob([JSON.stringify(data)], {
            type: 'application/json',
        });
    }
}
