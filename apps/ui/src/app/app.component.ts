import { Component, HostListener, OnInit } from '@angular/core';
import { BehaviorSubject, from, tap } from 'rxjs';
import { WebcontainersService } from './services/webcontainers/webcontainers.service';
import { EditorFacadeService } from './facades/editor/editor-facade.service';
import { NbMenuItem, NbMenuService } from '@nebular/theme';
import { IOutputData } from 'angular-split';

@Component({
    selector: 'online-editor-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    providers: [{ provide: Window, useValue: window }],
})
export class AppComponent implements OnInit {
    readonly loading = new BehaviorSubject<boolean>(true);
    readonly terminalMinHeight = new BehaviorSubject<number | null>(null);

    readonly webcontainerUrl$ = new BehaviorSubject<string | null>(null);

    readonly items: NbMenuItem[] = [
        {
            title: '',
            icon: 'file-text-outline'
        },
        {
            title: '',
            icon: 'search-outline'
        },
        {
            title: '',
            icon: 'settings-2-outline',
        },
    ];

    showIframeHider = false;

    constructor(
        private readonly window: Window,
        private readonly editorFacade: EditorFacadeService,
    ) { }

    @HostListener('window:beforeunload', ['$event'])
    leaveSiteConfirm($event: any) {
        $event.preventDefault();
        $event.returnValue = true;
    }

    ngOnInit() {
        this.window.addEventListener('load', this.boot.bind(this));
    }

    horizontalDragStart(event: IOutputData) {
        this.horizontalDrag(event);
    }

    horizontalDragEnd(event: IOutputData) {
        this.horizontalDrag(event);
    }

    private horizontalDrag(event: IOutputData) {
        this.terminalMinHeight.next(event.sizes[1] === '*' ? null : event.sizes[1]);
    }

    private boot() {
        this.editorFacade.boot()
            .pipe(tap(() => this.loading.next(false)))
            .subscribe();
    }
}
