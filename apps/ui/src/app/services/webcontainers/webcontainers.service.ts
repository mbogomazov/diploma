import { Injectable } from '@angular/core';
import { WebContainer } from '@webcontainer/api';
import { BehaviorSubject, EMPTY, from, map, mergeMap, tap, throwError } from 'rxjs';
import { setupPackageJson } from '../files/files.setup';
import { HttpClient } from '@angular/common/http';
import { DirectoryNode } from '../../facades/editor/editor-facade.service';

@Injectable({
    providedIn: 'root',
})
export class WebcontainersService {
    static userSystemFolderPath = '/home/httplocalhost4200-mobu/';

    private webcontainerInstance!: WebContainer;

    private readonly fileSystemChanges =
        new BehaviorSubject<DirectoryNode | null>(null);

    private fileWatchScriptContent = '';

    readonly containerAppUrl = new BehaviorSubject<string | null>(null);
    readonly inputTerminalPrompt = new BehaviorSubject<string | null>(null);

    readonly fileSystemChanges$ = this.fileSystemChanges.asObservable();

    constructor(private readonly http: HttpClient) { }

    boot() {
        return this.http
            .get('assets/file-watch-script/chokidar.js', {
                responseType: 'text',
            })
            .pipe(
                map((content) => (this.fileWatchScriptContent = content)),
                mergeMap(() =>
                    from(
                        WebContainer.boot({
                            coep: 'credentialless',
                        })
                    )
                ),
                tap((webcontainerInstance) => {
                    this.webcontainerInstance = webcontainerInstance;
                }),
                mergeMap(() =>
                    from(
                        this.webcontainerInstance.mount({
                            'package.json': setupPackageJson,
                            '.chokidar': {
                                file: { contents: this.fileWatchScriptContent },
                            },
                        }) ?? EMPTY
                    )
                ),
                mergeMap(() => this.watchFileChanges()),
                tap(() => {
                    this.webcontainerInstance?.on(
                        'server-ready',
                        (port, url) => {
                            this.containerAppUrl.next(url);
                        }
                    );

                    this.webcontainerInstance?.on('error', (error) =>
                        throwError(() => new Error(error.message))
                    );
                })
            );
    }

    writeFile(path: string, data: string) {
        return from(
            this.webcontainerInstance?.fs.writeFile(path, data) ?? EMPTY
        );
    }

    readFile(path: string) {
        return from(this.webcontainerInstance?.fs.readFile(path) ?? EMPTY).pipe(
            map((buffer) => new TextDecoder().decode(buffer))
        );
    }

    readDir(directory: string) {
        return from(
            this.webcontainerInstance?.fs.readdir(directory, {
                encoding: 'utf8',
                withFileTypes: true,
            }) ?? EMPTY
        );
    }

    startShell() {
        return from(this.webcontainerInstance.spawn('jsh'));
    }

    private watchFileChanges() {
        return from(
            this.webcontainerInstance.spawn('mv', [
                '.chokidar',
                '../../usr/local/lib/',
            ])
        ).pipe(
            mergeMap(() =>
                this.webcontainerInstance.spawn('node', [
                    '../../usr/local/lib/.chokidar',
                ])
            ),
            tap((shellProcess) => {
                shellProcess.output.pipeTo(
                    new WritableStream({
                        write: (data) => {
                            const rootFileSystemStructure: DirectoryNode =
                                JSON.parse(data);

                            this.fileSystemChanges.next(
                                rootFileSystemStructure
                            );
                        },
                    })
                );
            })
        );
    }
}
