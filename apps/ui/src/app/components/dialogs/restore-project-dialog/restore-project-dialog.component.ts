import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
    selector: 'online-editor-restore-project-dialog',
    templateUrl: './restore-project-dialog.component.html',
    styleUrls: ['./restore-project-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestoreProjectDialogComponent {
    constructor(
        private readonly dialogRef: NbDialogRef<RestoreProjectDialogComponent>
    ) {}

    cancel() {
        this.dialogRef.close(false);
    }

    restore() {
        this.dialogRef.close(true);
    }
}
