import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { EditorFacadeService } from '../../facades/editor/editor-facade.service';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
    selector: 'online-editor-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
    providers: [{ provide: Window, useValue: window }],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements OnInit, OnDestroy {
    private downloadProjectName: string | undefined;

    readonly loading$ = this.editorFacade.loading$;

    showIframeHider = false;

    constructor(
        private readonly window: Window,
        private readonly editorFacade: EditorFacadeService,
        private readonly route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.downloadProjectName = this.route.firstChild?.snapshot.url[1]?.path;

        this.window.addEventListener('load', this.boot.bind(this));
    }

    private boot() {
        this.editorFacade
            .boot(this.downloadProjectName)
            .pipe(untilDestroyed(this))
            .subscribe();
    }

    ngOnDestroy() {
        this.editorFacade.teardownWebcontainers();
    }
}
