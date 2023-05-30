import { Injectable } from '@angular/core';
import { WebcontainersService } from '../webcontainers/webcontainers.service';
import {
    BehaviorSubject,
    NEVER,
    Subscription,
    defer,
    filter,
    map,
    take,
    tap,
} from 'rxjs';
import { WebContainerProcess } from '@webcontainer/api';
import { clearString } from '../../helpers/helpers';

const TERMINAL_OUTPUT_LIMIT = 100000;

@Injectable({
    providedIn: 'root',
})
export class TerminalService {
    private readonly outputTerminals = new BehaviorSubject<
        Record<string, Array<string>>
    >({});

    private readonly shells = new BehaviorSubject<
        Array<{ key: string; process: WebContainerProcess }>
    >([]);
    readonly currentShellIndex = new BehaviorSubject<number | null>(null);
    readonly currentInputTerminalWriter =
        new BehaviorSubject<WritableStreamDefaultWriter<string> | null>(null);

    private readonly outputTerminalPrompt = new BehaviorSubject<string | null>(
        null
    );
    private outputTerminalSubscription: Subscription | null = null;
    private inputTerminalSubscription: Subscription | null = null;
    private currentWriter: WritableStreamDefaultWriter | null = null;

    readonly inputTerminalPrompt = new BehaviorSubject<string | null>(null);

    readonly shellsAmount$ = this.shells.pipe(map((shells) => shells.length));
    readonly currentShellIndex$ = this.currentShellIndex.asObservable();

    readonly outputTerminalPrompt$ = this.outputTerminalPrompt.asObservable();

    constructor(private readonly webcontainersService: WebcontainersService) {}

    addShell() {
        return this.webcontainersService.startShell().pipe(
            tap((shellProcess) => {
                const processKey = this.getRandomKey();

                // store shells with process object to iterate with them
                // and keys to get ouput history when terminal was switched
                this.shells.next([
                    ...this.shells.value,
                    { key: processKey, process: shellProcess },
                ]);

                shellProcess.output.pipeTo(
                    new WritableStream({
                        write: (data) => {
                            if (!this.outputTerminals.value[processKey]) {
                                this.outputTerminals.value[processKey] = [];
                            }

                            this.outputTerminals.value[processKey].push(data);

                            this.outputTerminals.next(
                                this.outputTerminals.value
                            );
                        },
                    })
                );
            })
        );
    }

    removeShell(index: number) {
        const [{ key, process }] = this.shells.value.splice(index, 1);

        return defer(async () => process.kill).pipe(
            tap(() => {
                this.shells.next(this.shells.value);

                delete this.outputTerminals.value[key];

                this.outputTerminals.next(this.outputTerminals.value);
            })
        );
    }

    selectShell(shellIndex: number) {
        const shellsArray = this.shells.value;

        const shellProcess:
            | { key: string; process: WebContainerProcess }
            | undefined = shellsArray[shellIndex];

        if (!shellProcess) {
            return;
        }

        const input = this.getWriter(shellProcess.process.input);

        // if another terminal was selected for input value
        //  unsubscribe from previous input subscription
        if (this.inputTerminalSubscription) {
            this.inputTerminalSubscription.unsubscribe();
            this.inputTerminalSubscription = null;
        }

        this.inputTerminalSubscription = this.inputTerminalPrompt
            .pipe(filter((data): data is string => !!data))
            .subscribe((data) => {
                input.write(data);
            });

        // if another terminal was selected for output value
        //  unsubscribe from previous output subscription
        if (this.outputTerminalSubscription) {
            this.outputTerminalSubscription.unsubscribe();
            this.outputTerminalSubscription = null;
        }

        this.outputTerminalSubscription = this.outputTerminals
            .pipe(map((terminals) => terminals[shellProcess.key]))
            .subscribe((output) => {
                if (!output) {
                    return;
                }

                this.outputTerminalPrompt.next(output.slice(-1).join(''));
            });

        this.currentShellIndex.next(shellIndex);

        this.outputTerminals.value[shellProcess.key] = [];

        this.outputTerminals.next(this.outputTerminals.value);
    }

    getTerminalOutputHistory(index: number) {
        if (!this.shells.value[index]) {
            return '';
        }

        const { key } = this.shells.value[index];

        const previousData: Array<string> | undefined =
            this.outputTerminals.value[key];

        if (!previousData) {
            return '';
        }

        return `${clearString(
            previousData.join('').slice(-TERMINAL_OUTPUT_LIMIT)
        )}`;
    }

    private getRandomKey() {
        return Math.random().toString(36).slice(2, 7);
    }

    private getWriter(stream: WritableStream) {
        if (this.currentWriter) {
            this.currentWriter.releaseLock();
            this.currentWriter = null;
        }

        this.currentWriter = stream.getWriter();

        return this.currentWriter;
    }
}
