import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { NbDialogRef } from '@nebular/theme';
import { WebcontainersService } from '../../../services/webcontainers/webcontainers.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject, EMPTY, catchError, mergeMap, tap } from 'rxjs';

@UntilDestroy()
@Component({
    selector: 'online-editor-add-file-folder',
    templateUrl: './add-file-folder.component.html',
    styleUrls: ['./add-file-folder.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFileFolderComponent {
    @Input() type: 'file' | 'folder' = 'file';
    @Input() action: 'add' | 'rename' = 'add';
    @Input() editingPath: string | null = null;
    @Input() editingName: string | null = null;

    inputControl = new FormControl();

    errorMsg = new BehaviorSubject<string>('');

    constructor(
        private readonly dialogRef: NbDialogRef<AddFileFolderComponent>,
        private readonly webcontainersService: WebcontainersService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    submit() {
        if (this.type === 'file') {
            if (this.action === 'rename') {
                this.renameFile();

                return;
            }

            this.addFile();

            return;
        }

        this.addFolder();
    }

    private addFile() {
        if (this.editingPath === null) {
            return;
        }

        this.inputControl.setErrors(null);

        this.webcontainersService
            .readDir(`${this.editingPath}`)
            .pipe(
                mergeMap((parentDirectoryContent) => {
                    const fileExists =
                        parentDirectoryContent.filter(
                            (node) =>
                                node.isFile() &&
                                node.name === this.inputControl.value
                        ).length > 0;

                    if (fileExists) {
                        this.errorMsg.next('This file already exists');
                        this.inputControl.setErrors({ alreadyExists: true });
                        this.changeDetectorRef.markForCheck();

                        return EMPTY;
                    }

                    return this.webcontainersService
                        .writeFile(
                            `${this.editingPath}/${this.inputControl.value}`,
                            ''
                        )
                        .pipe(tap(() => this.dialogRef.close()));
                }),

                catchError((error) => {
                    console.error(error);
                    return EMPTY;
                }),
                untilDestroyed(this)
            )
            .subscribe();
    }

    private addFolder() {
        if (this.editingPath === null) {
            return;
        }

        this.inputControl.setErrors(null);

        this.webcontainersService
            .readDir(`${this.editingPath}`)
            .pipe(
                mergeMap((parentDirectoryContent) => {
                    const fileExists =
                        parentDirectoryContent.filter(
                            (node) =>
                                node.isDirectory() &&
                                node.name === this.inputControl.value
                        ).length > 0;

                    if (fileExists) {
                        this.errorMsg.next('This folder already exists');
                        this.inputControl.setErrors({ alreadyExists: true });
                        this.changeDetectorRef.markForCheck();

                        return EMPTY;
                    }

                    return this.webcontainersService
                        .mkDir(`${this.editingPath}/${this.inputControl.value}`)
                        .pipe(tap(() => this.dialogRef.close()));
                }),

                catchError((error) => {
                    console.error(error);
                    return EMPTY;
                }),
                untilDestroyed(this)
            )
            .subscribe();
    }

    private renameFile() {
        if (this.editingPath === null) {
            return;
        }

        this.inputControl.setErrors(null);

        this.webcontainersService
            .readDir(`${this.editingPath}`)
            .pipe(
                mergeMap((parentDirectoryContent) => {
                    const fileExists =
                        parentDirectoryContent.filter(
                            (node) =>
                                node.isFile() &&
                                node.name === this.inputControl.value
                        ).length > 0;

                    if (fileExists) {
                        this.errorMsg.next('This file already exists');
                        this.inputControl.setErrors({ alreadyExists: true });
                        this.changeDetectorRef.markForCheck();

                        return EMPTY;
                    }

                    return this.webcontainersService
                        .mvFile(
                            `${this.editingPath}/${this.editingName}`,
                            `${this.editingPath}/${this.inputControl.value}`
                        )
                        .pipe(tap(() => this.dialogRef.close()));
                }),

                catchError((error) => {
                    console.error(error);
                    return EMPTY;
                }),
                untilDestroyed(this)
            )
            .subscribe();
    }
}
