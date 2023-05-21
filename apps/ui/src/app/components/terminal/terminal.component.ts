import { AfterViewInit, ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core';
import { NgTerminal } from 'ng-terminal';
import { filter } from 'rxjs';
import { TerminalService } from '../../services/terminal/terminal.service';

@Component({
    selector: 'online-editor-terminal',
    templateUrl: './terminal.component.html',
    styleUrls: ['./terminal.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalComponent implements AfterViewInit {
    @ViewChild('term', { static: false }) child!: NgTerminal;

    constructor(private readonly terminalService: TerminalService) { }

    ngAfterViewInit() {
        this.child.setXtermOptions({
            convertEol: true,
            cursorBlink: true,
        });

        this.child.onData().subscribe((input) => {
            this.terminalService.inputTerminalPrompt.next(input);
        });

        this.terminalService.outputTerminalPrompt$
            .pipe(filter((data): data is string => !!data))
            .subscribe((data) => this.child.write(data));
    }

    addShell() {
        // this.t
    }
}
