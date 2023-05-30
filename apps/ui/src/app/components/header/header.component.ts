import { ChangeDetectionStrategy, Component } from '@angular/core';
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
    constructor(private readonly editorFacade: EditorFacadeService) {}

    saveLocal() {
        this.editorFacade.saveProjectLocally();
    }

    share() {
        this.editorFacade.shareProject().pipe(untilDestroyed(this)).subscribe();
    }
}
