import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Output,
} from '@angular/core';
import { EditorFacadeService } from '../../facades/editor/editor-facade.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
    selector: 'online-editor-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
    @Output() togglePreviewEvent = new EventEmitter<void>();

    constructor(private readonly editorFacade: EditorFacadeService) {}

    saveLocal() {
        this.editorFacade
            .saveProjectLocally()
            .pipe(untilDestroyed(this))
            .subscribe();
    }

    share() {
        this.editorFacade.shareProject().pipe(untilDestroyed(this)).subscribe();
    }

    triggerTogglePreview() {
        this.togglePreviewEvent.emit();
    }
}
