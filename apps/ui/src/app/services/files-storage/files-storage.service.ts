import { Injectable } from '@angular/core';
import { DBConfig, NgxIndexedDBService } from 'ngx-indexed-db';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DirectoryNode, FileNode } from '../../facades/editor/editor-facade.service';

export const fileDbConfig: DBConfig = {
    name: 'FileDb',
    version: 1,
    objectStoresMeta: [{
        store: 'files',
        storeConfig: { keyPath: 'path', autoIncrement: false },
        storeSchema: [
            { name: 'path', keypath: 'path', options: { unique: true } },
            { name: 'content', keypath: 'content', options: { unique: false } }
        ]
    }]
};

type FileStorageNode = {
    path: string;
    content: string;
}

const fileSystemDirectoriesStoreName = 'fileSystemDirectoriesStoreName';

@Injectable({
    providedIn: 'root'
})
export class FileStorageService {
    constructor(private dbService: NgxIndexedDBService) { }

    addOrUpdateFile(file: FileStorageNode): Observable<FileStorageNode> {
        return this.dbService.getByKey('files', file.path).pipe(
            switchMap(existingEntry => {
                if (existingEntry) {
                    return this.dbService.update<FileStorageNode>('files', file);
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

    addOrUpdateDirectoriesStructure(nodes: Array<FileNode | DirectoryNode>): void {
        localStorage.setItem(fileSystemDirectoriesStoreName, JSON.stringify(nodes));
    }

    getDirectoriesStructureByPath(): Array<DirectoryNode> | undefined {
        const stringifiedFilesStructure = localStorage.getItem(fileSystemDirectoriesStoreName);

        if (!stringifiedFilesStructure) {
            return;
        }

        return JSON.parse(stringifiedFilesStructure);
    }

    deleteDirectoriesStructure() {
        localStorage.removeItem(fileSystemDirectoriesStoreName);
    }

    isProjectSavedLocally() {
        return fileSystemDirectoriesStoreName in localStorage
    }
}
