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
    ) { }

    ngOnInit() {
        this.webcontainersService.containerAppUrl
            .pipe(filter((url): url is string => !!url))
            .subscribe((url) => {
                // it is necessary to update iframe content
                // after backend app was reloaded
                if (this.previewContentRef) {
                    this.renderer.setAttribute(
                        this.previewContentRef.nativeElement,
                        'src',
                        url
                    );
                }

                this.webcontainerUrl$.next(url);
            });
    }
}
