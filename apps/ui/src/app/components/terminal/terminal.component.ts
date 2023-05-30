import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ViewChild,
} from '@angular/core';
import { NgTerminal } from 'ng-terminal';
import { combineLatest, filter, map, take, tap } from 'rxjs';

import { TerminalService } from '../../services/terminal/terminal.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
    selector: 'online-editor-terminal',
    templateUrl: './terminal.component.html',
    styleUrls: ['./terminal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalComponent implements AfterViewInit {
    @ViewChild('term', { static: false }) child!: NgTerminal;

    readonly shellsIndexes$ = this.terminalService.shellsAmount$.pipe(
        map((amount) => Array.from(Array(amount).keys()))
    );

    readonly currentShellIndex$ = this.terminalService.currentShellIndex$;

    showTerminalPanel = this.terminalService.shellsAmount$.pipe(
        map((amount) => amount > 1)
    );

    constructor(private readonly terminalService: TerminalService) {}

    ngAfterViewInit() {
        this.child.setXtermOptions({
            convertEol: true,
            cursorBlink: true,
        });

        this.child
            .onData()
            .pipe(untilDestroyed(this))
            .subscribe((input) => {
                this.terminalService.inputTerminalPrompt.next(input);
            });

        this.terminalService.outputTerminalPrompt$
            .pipe(
                filter((data): data is string => !!data),
                untilDestroyed(this)
            )
            .subscribe((data) => this.child.write(data));
    }

    addShell() {
        combineLatest([
            this.terminalService.addShell(),
            this.terminalService.shellsAmount$,
        ])
            .pipe(
                take(1),
                tap(([_, amount]) => {
                    this.selectShell(amount - 1);
                }),
                untilDestroyed(this)
            )
            .subscribe();
    }

    selectShell(index: number) {
        this.child.underlying.clear();

        this.child.write(this.terminalService.getTerminalOutputHistory(index));

        this.terminalService.selectShell(index);
    }

    removeShell(index: number, event: MouseEvent) {
        event.stopPropagation();

        this.terminalService
            .removeShell(index)
            .pipe(
                tap(() => {
                    this.selectShell(index - 1 < 0 ? 0 : index - 1);
                })
            )
            .subscribe();
    }
}
