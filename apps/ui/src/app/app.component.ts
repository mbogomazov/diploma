import { Component, HostListener, OnInit } from '@angular/core';
import { BehaviorSubject, from, tap } from 'rxjs';
import { WebcontainersService } from './services/webcontainers/webcontainers.service';

@Component({
    selector: 'online-editor-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    providers: [{ provide: Window, useValue: window }],
})
export class AppComponent implements OnInit {
    readonly loading = new BehaviorSubject<boolean>(true);

    readonly webcontainerUrl$ = new BehaviorSubject<string | null>(null);

    showIframeHider = false;

    constructor(
        private readonly window: Window,
        private readonly webcontainersService: WebcontainersService
    ) {}

    @HostListener('window:beforeunload', ['$event'])
    leaveSiteConfirm($event: any) {
        $event.preventDefault();
        $event.returnValue = true;
    }

    ngOnInit() {
        this.window.addEventListener('load', this.boot.bind(this));
    }

    private boot() {
        this.webcontainersService
            .boot()
            .pipe(tap(() => this.loading.next(false)))
            .subscribe();
    }
}
