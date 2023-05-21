import { Injectable } from '@angular/core';
import { WebcontainersService } from '../webcontainers/webcontainers.service';
import { BehaviorSubject, filter, from, tap } from 'rxjs';
import { WebContainerProcess } from '@webcontainer/api';

@Injectable({
    providedIn: 'root',
})
export class TerminalService {
    private readonly shells = new BehaviorSubject<Array<WebContainerProcess>>(
        []
    );

    private readonly outputTerminalPrompt = new BehaviorSubject<string | null>(
        null
    );
    readonly inputTerminalPrompt = new BehaviorSubject<string | null>(null);

    readonly outputTerminalPrompt$ = this.outputTerminalPrompt.asObservable();

    constructor(private readonly webcontainersService: WebcontainersService) { }

    addShell() {
        return this.webcontainersService
            .startShell()
            .pipe(
                tap((shellProcess) =>
                    this.shells.next([...this.shells.value, shellProcess])
                )
            );
    }

    removeShell(index: number) {
        const [deletedShell] = this.shells.value.splice(index, 1);

        return from(deletedShell.exit).pipe(
            tap(() => this.shells.next(this.shells.value))
        );
    }

    selectShell(shellIndex: number) {
        const shellsArray = this.shells.value;

        const shellProcess: WebContainerProcess | undefined = shellsArray[shellIndex];

        if (!shellProcess) {
            return;
        }

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
    }
}
