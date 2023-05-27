import {
    ChangeDetectionStrategy,
    Component,
    HostListener,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { BehaviorSubject, take } from 'rxjs';
import { NbIconLibraries } from '@nebular/theme';
import { EditorFacadeService } from '../../facades/editor/editor-facade.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
    selector: 'online-editor-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    providers: [{ provide: Window, useValue: window }],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
    readonly loading$ = this.editorFacade.loading$;

    readonly webcontainerUrl$ = new BehaviorSubject<string | null>(null);

    showIframeHider = false;

    constructor(
        private readonly window: Window,
        private readonly editorFacade: EditorFacadeService,
        private readonly iconLibraries: NbIconLibraries
    ) {
        this.iconLibraries.registerSvgPack('custom', {
            prettier: '<img src="assets/prettier.svg" width="20px">',
        });
    }

    @HostListener('window:beforeunload', ['$event'])
    leaveSiteConfirm($event: any) {
        $event.preventDefault();
        $event.returnValue = true;
    }

    ngOnInit() {
        this.window.addEventListener('load', this.boot.bind(this));
    }

    private boot() {
        this.editorFacade
            .boot()
            .pipe(take(1), untilDestroyed(this))
            .subscribe();
    }

    ngOnDestroy() {
        this.editorFacade.teardownWebcontainers();
    }
}
