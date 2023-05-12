import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FunctionsUsingCSI, NgTerminal } from 'ng-terminal';
import { filter } from 'rxjs';
import { WebcontainersService } from '../../services/webcontainers/webcontainers.service';

@Component({
    selector: 'online-editor-terminal',
    templateUrl: './terminal.component.html',
    styleUrls: ['./terminal.component.scss'],
})
export class TerminalComponent implements AfterViewInit {
    @ViewChild('term', { static: false }) child!: NgTerminal;

    constructor(private readonly webcontainersService: WebcontainersService) {}

    ngAfterViewInit() {
        this.child.setXtermOptions({
            convertEol: true,
            cursorBlink: true,
        });

        this.child.onData().subscribe((input) => {
            this.webcontainersService.inputTerminalPrompt.next(input);
        });

        this.webcontainersService.outputTerminalPrompt$
            .pipe(filter((data): data is string => !!data))
            .subscribe((data) => this.child.write(data));
    }
}
