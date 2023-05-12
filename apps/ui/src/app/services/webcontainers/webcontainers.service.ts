import { Injectable } from '@angular/core';
import { WebContainer } from '@webcontainer/api';
import { BehaviorSubject, EMPTY, filter, from, map, mergeMap, tap } from 'rxjs';
import { setupPackageJson } from '../files/files.setup';
import { HttpClient } from '@angular/common/http';

export type FileChangeEvent =
    | 'add'
    | 'addDir'
    | 'change'
    | 'unlink'
    | 'unlinkDir';

@Injectable({
    providedIn: 'root',
})
export class WebcontainersService {
    static userSystemFolderPath = '/home/httplocalhost4200-mobu/';

    private webcontainerInstance!: WebContainer;
    private readonly outputTerminalPrompt = new BehaviorSubject<string | null>(
        null
    );
    private readonly fileSystemChanges = new BehaviorSubject<{
        event: FileChangeEvent;
        path: string;
    } | null>(null);

    private fileWatchScriptContent = '';
    private readonly commands: Array<string> = [];

    readonly containerAppUrl = new BehaviorSubject<string | null>(null);
    readonly inputTerminalPrompt = new BehaviorSubject<string | null>(null);

    readonly outputTerminalPrompt$ = this.outputTerminalPrompt.asObservable();
    readonly fileSystemChanges$ = this.fileSystemChanges.asObservable();

    constructor(private readonly http: HttpClient) {}

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
                mergeMap(() => this.startShell()),
                tap(() => {
                    this.webcontainerInstance?.on(
                        'server-ready',
                        (port, url) => {
                            this.containerAppUrl.next(url);
                        }
                    );

                    this.webcontainerInstance?.on('error', (error) =>
                        console.log(error)
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

    private startShell() {
        return from(this.webcontainerInstance.spawn('jsh')).pipe(
            map((shellProcess) => {
                shellProcess.output.pipeTo(
                    new WritableStream({
                        write: (data) => {
                            this.outputTerminalPrompt.next(data);
                        },
                    })
                );

                const input = shellProcess.input.getWriter();

                this.inputTerminalPrompt
                    .pipe(filter((data): data is string => !!data))
                    .subscribe((data) => {
                        input.write(data);
                    });
            })
        );
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
                            const [event, ...path] = data.split(' ');
                            this.commands.push(data);

                            if (!path.includes('node_modules')) {
                                console.log();
                            }

                            this.fileSystemChanges.next({
                                event: event as FileChangeEvent,
                                path: path
                                    .join(' ')
                                    .replace(/\n/g, '')
                                    .replace(
                                        WebcontainersService.userSystemFolderPath,
                                        ''
                                    ),
                            });
                        },
                    })
                );
            })
        );
    }
}
