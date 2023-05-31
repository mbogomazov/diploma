import { Component, Input } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { WebcontainersService } from '../../../services/webcontainers/webcontainers.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { tap } from 'rxjs';

@UntilDestroy()
@Component({
    selector: 'online-editor-delete-file-folder',
    templateUrl: './delete-file-folder.component.html',
    styleUrls: ['./delete-file-folder.component.scss'],
})
export class DeleteFileFolderComponent {
    @Input() filePath: string | null = null;

    constructor(
        private readonly dialogRef: NbDialogRef<DeleteFileFolderComponent>,
        private readonly webcontainersService: WebcontainersService
    ) {}

    cancel() {
        this.dialogRef.close();
    }

    delete() {
        if (!this.filePath) {
            return;
        }

        this.webcontainersService
            .rm(this.filePath)
            .pipe(
                tap(() => this.dialogRef.close()),
                untilDestroyed(this)
            )
            .subscribe();
    }
}
