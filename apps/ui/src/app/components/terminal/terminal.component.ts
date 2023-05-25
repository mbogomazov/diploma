import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ViewChild,
} from '@angular/core';
import { NgTerminal } from 'ng-terminal';
import { combineLatest, filter, map, tap } from 'rxjs';

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

    constructor(private readonly terminalService: TerminalService) {}

    readonly shellsIndexes$ = this.terminalService.shellsAmount$.pipe(
        map((amount) => Array.from(Array(amount).keys()))
    );

    showTerminalPanel = this.terminalService.shellsAmount$.pipe(
        map((amount) => amount > 1)
    );

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

        console.log(this.child.underlying.textarea?.value);
    }
}
