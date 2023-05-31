import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
    selector: 'online-editor-loading-popup-dialog',
    templateUrl: './loading-popup-dialog.component.html',
    styleUrls: ['./loading-popup-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingPopupDialogComponent {
    @Input() title: string | undefined;

    constructor(
        private readonly dialogRef: NbDialogRef<LoadingPopupDialogComponent>
    ) {}
}
