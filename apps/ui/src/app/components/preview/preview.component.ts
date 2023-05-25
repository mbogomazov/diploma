import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Input,
    OnInit,
    Renderer2,
    ViewChild,
} from '@angular/core';
import { BehaviorSubject, filter } from 'rxjs';
import { WebcontainersService } from '../../services/webcontainers/webcontainers.service';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
    selector: 'online-editor-preview',
    templateUrl: './preview.component.html',
    styleUrls: ['./preview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewComponent implements OnInit {
    @ViewChild('previewContent', { static: false })
    previewContentRef?: ElementRef;

    @Input() showIframeHider = false;

    webcontainerUrl$ = new BehaviorSubject<string | null>(null);

    constructor(
        private readonly webcontainersService: WebcontainersService,
        private readonly renderer: Renderer2
    ) {}

    previewUrl = new FormControl('');

    ngOnInit() {
        this.webcontainersService.containerAppUrl
            .pipe(
                filter((url): url is string => !!url),
                untilDestroyed(this)
            )
            .subscribe((url) => {
                this.previewUrl.patchValue(url);
                this.webcontainerUrl$.next(url);
            });

        this.previewUrl.valueChanges
            .pipe(
                filter((url): url is string => url !== null),
                untilDestroyed(this)
            )
            .subscribe((url) => {
                if (!this.previewContentRef) {
                    return;
                }

                // it is necessary to update iframe content
                // after backend app was reloaded
                this.renderer.setAttribute(
                    this.previewContentRef.nativeElement,
                    'src',
                    url
                );
            });
    }

    goHistoryBack() {
        if (!this.previewContentRef) {
            return;
        }

        this.previewContentRef.nativeElement.contentWindow.history.go(-1);
    }

    goHistoryForward() {
        if (!this.previewContentRef) {
            return;
        }

        this.previewContentRef.nativeElement.contentWindow.history.go(1);
    }

    reload() {
        if (!this.previewContentRef || !this.previewUrl.value) {
            return;
        }

        // it is necessary to update iframe content
        // after backend app was reloaded
        this.renderer.setAttribute(
            this.previewContentRef.nativeElement,
            'src',
            this.previewUrl.value
        );
    }
}
