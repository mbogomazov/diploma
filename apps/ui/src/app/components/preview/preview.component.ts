import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Input,
    OnInit,
    Renderer2,
    ViewChild,
} from '@angular/core';
import { filter } from 'rxjs';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EditorFacadeService } from '../../facades/editor/editor-facade.service';

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

    constructor(
        private readonly editorFacade: EditorFacadeService,
        private readonly renderer: Renderer2
    ) {}

    previewUrl = new FormControl('');

    ngOnInit() {
        this.editorFacade.containerAppUrl$
            .pipe(
                filter((url): url is string => !!url),
                untilDestroyed(this)
            )
            .subscribe((url) => {
                this.previewUrl.patchValue(url);
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
