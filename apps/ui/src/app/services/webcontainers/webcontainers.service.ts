import { Injectable } from '@angular/core';
import { WebContainer } from '@webcontainer/api';
import {
    BehaviorSubject,
    EMPTY,
    Observable,
    catchError,
    concatMap,
    defer,
    filter,
    forkJoin,
    map,
    mergeMap,
    take,
    tap,
    throwError,
} from 'rxjs';
import { setupPackageJson } from '../files/files.setup';
import { HttpClient } from '@angular/common/http';
import {
    DirectoryNode,
    FileModelUpdate,
    SearchResultsByFile,
} from '@online-editor/types';
import { JsonParseService } from '../json-parse/json-parse.service';

@Injectable({
    providedIn: 'root',
})
export class WebcontainersService {
    static userSystemFolderPath = '/home/httplocalhost4200-mobu/';

    private webcontainerInstance!: WebContainer;

    private readonly helperScriptsfileNames = [
        'chokidar',
        'search-replace-file-content',
        'monaco-models-watcher',
    ];

    private readonly fileSystemChanges =
        new BehaviorSubject<DirectoryNode | null>(null);

    private readonly searchFileContentResult =
        new BehaviorSubject<Array<SearchResultsByFile> | null>(null);

    private readonly monacoModelsChanges =
        new BehaviorSubject<Array<FileModelUpdate> | null>(null);

    private helperScriptsFileContents: string[] = [];

    readonly containerAppUrl = new BehaviorSubject<string | null>(null);
    readonly inputTerminalPrompt = new BehaviorSubject<string | null>(null);

    readonly fileSystemChanges$ = this.fileSystemChanges.asObservable();
    readonly searchFileContentResult$ =
        this.searchFileContentResult.asObservable();
    readonly monacoModelsChanges$ = this.monacoModelsChanges.asObservable();

    constructor(
        private readonly http: HttpClient,
        private readonly jsonParseServer: JsonParseService
    ) {}

    boot() {
        return this.getHelpersFiles().pipe(
            tap((content) => {
                this.helperScriptsFileContents = content;
            }),
            mergeMap(() =>
                defer(() =>
                    WebContainer.boot({
                        coep: 'credentialless',
                    })
                )
            ),
            tap((webcontainerInstance) => {
                this.webcontainerInstance = webcontainerInstance;
            }),
            mergeMap(() =>
                defer(
                    () =>
                        this.webcontainerInstance.mount({
                            'package.json': setupPackageJson,
                            '.chokidar': {
                                file: {
                                    contents: this.helperScriptsFileContents[0],
                                },
                            },
                            '.search-replace-file-content': {
                                file: {
                                    contents: this.helperScriptsFileContents[1],
                                },
                            },
                            '.monaco-models-watcher': {
                                file: {
                                    contents: this.helperScriptsFileContents[2],
                                },
                            },
                        }) ?? EMPTY
                )
            ),
            concatMap(() => this.moveHelperScripts()),
            concatMap(() => this.watchFileChanges()),
            // concatMap(() => this.watchCodeFilesChangesForMonaco()),
            tap(() => {
                this.webcontainerInstance?.on('server-ready', (port, url) => {
                    this.containerAppUrl.next(url);
                });

                this.webcontainerInstance?.on('error', (error) => {
                    console.log(error.message);

                    return throwError(() => new Error(error.message));
                });
            })
        );
    }

    writeFile(path: string, data: string) {
        return defer(() =>
            this.webcontainerInstance?.fs.writeFile(path, data)
        ).pipe(
            take(1),
            catchError((error) => {
                console.log(error.message);

                return throwError(() => new Error(error.message));
            })
        );
    }

    readFile(path: string) {
        return defer(
            () => this.webcontainerInstance?.fs.readFile(path) ?? EMPTY
        ).pipe(
            map((buffer) => new TextDecoder().decode(buffer)),
            take(1)
        );
    }

    readDir(directory: string) {
        return defer(
            () =>
                this.webcontainerInstance?.fs.readdir(directory, {
                    encoding: 'utf8',
                    withFileTypes: true,
                }) ?? EMPTY
        ).pipe(take(1));
    }

    mkDir(directoryPath: string) {
        return defer(
            () =>
                this.webcontainerInstance?.fs.mkdir(directoryPath, {
                    recursive: true,
                }) ?? EMPTY
        ).pipe(take(1));
    }

    startShell() {
        return defer(() => this.webcontainerInstance.spawn('jsh')).pipe(
            take(1)
        );
    }

    private moveHelperScripts() {
        return forkJoin(
            this.helperScriptsfileNames.map((scriptFileName) =>
                this.moveHelperScriptFile(scriptFileName)
            )
        ).pipe(
            tap(() => {
                this.helperScriptsFileContents = [];
            })
        );
    }

    private moveHelperScriptFile(fileName: string) {
        return defer(() =>
            this.webcontainerInstance.spawn('mv', [
                `.${fileName}`,
                '../../usr/local/lib/',
            ])
        ).pipe(take(1));
    }

    searchFileContent(search: string) {
        return defer(() =>
            this.webcontainerInstance.spawn('node', [
                '../../usr/local/lib/.search-replace-file-content',
                search,
            ])
        ).pipe(
            tap((shellProcess) => {
                shellProcess.output.pipeTo(
                    new WritableStream({
                        write: (data) => {
                            this.searchFileContentResult.next(JSON.parse(data));
                        },
                    })
                );
            }),
            take(1)
        );
    }

    private watchFileChanges() {
        return defer(() =>
            this.webcontainerInstance.spawn('node', [
                '../../usr/local/lib/.chokidar',
            ])
        ).pipe(
            tap((shellProcess) => {
                shellProcess.output.pipeTo(
                    new WritableStream({
                        write: (data) => {
                            console.log('Watch all file changes');

                            try {
                                this.jsonParseServer
                                    .parseJson(data)
                                    .subscribe((rootFileSystemStructure) => {
                                        this.fileSystemChanges.next(
                                            rootFileSystemStructure as DirectoryNode
                                        );
                                    });
                            } catch (error) {
                                console.error(error);
                            }
                        },
                        close() {
                            console.log('Sink closed');
                        },
                        abort(err) {
                            console.log('Sink error:', err);
                        },
                    })
                );
            }),
            take(1)
        );
    }

    private watchCodeFilesChangesForMonaco() {
        return defer(() =>
            this.webcontainerInstance.spawn('node', [
                '../../usr/local/lib/.monaco-models-watcher',
            ])
        ).pipe(
            tap((shellProcess) => {
                shellProcess.output.pipeTo(
                    new WritableStream({
                        write: (data) => {
                            console.log('Watch code files changes');

                            try {
                                this.jsonParseServer
                                    .parseJson(data)
                                    .subscribe((fileModelUpdate) => {
                                        this.monacoModelsChanges.next(
                                            fileModelUpdate as Array<FileModelUpdate>
                                        );
                                    });
                            } catch (error) {
                                console.error(error);
                            }
                        },
                        close() {
                            console.log('Sink closed');
                        },
                        abort(err) {
                            console.log('Sink error:', err);
                        },
                    })
                );
            }),
            take(1)
        );
    }

    private getHelpersFiles(): Observable<[string, string]> {
        return forkJoin(
            this.helperScriptsfileNames.map((fileName) =>
                this.getJsFileContent(fileName)
            )
        ).pipe(
            filter(
                (filesContent): filesContent is [string, string] =>
                    filesContent.length === this.helperScriptsfileNames.length
            )
        );
    }

    private getJsFileContent(fileName: string): Observable<string> {
        return this.http.get(`assets/webcontainers-helpers/${fileName}.js`, {
            responseType: 'text',
        });
    }
}
