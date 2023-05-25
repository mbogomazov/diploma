import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NbDialogRef } from '@nebular/theme';

@Component({
    selector: 'online-editor-add-file-folder',
    templateUrl: './add-file-folder.component.html',
    styleUrls: ['./add-file-folder.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFileFolderComponent {
    @Input() type: 'file' | 'folder' = 'file';

    inputControl = new FormControl();

    constructor(
        private readonly dialogRef: NbDialogRef<AddFileFolderComponent>
    ) {}

    submit() {
        this.dialogRef.close(this.inputControl.value);
    }
}
