import { Injectable } from '@angular/core';
import { WebcontainersService } from '../../services/webcontainers/webcontainers.service';
import {
    BehaviorSubject,
    EMPTY,
    catchError,
    map,
    mergeMap,
    of,
    switchMap,
    tap,
} from 'rxjs';
import { EditorService } from '../../services/editor/editor.service';
import { TerminalService } from '../../services/terminal/terminal.service';
import {
    NbDialogService,
    NbGlobalPhysicalPosition,
    NbToastrService,
} from '@nebular/theme';
import { ErrorDialogComponent } from '../../components/dialogs/error/error-dialog.component';
import { FileStorageService } from '../../services/files-storage/files-storage.service';
import { RestoreProjectDialogComponent } from '../../components/dialogs/restore-project-dialog/restore-project-dialog.component';
import { TaskService } from '../../services/task/task.service';
import { DirectoryNode, FileNode } from '@online-editor/types';
import { editor } from 'monaco-editor';

import { MonacoAutocompleteCodeAction } from '../../services/monaco-helper/monaco-helper.consts';
import { MonacoHelperService } from '../../services/monaco-helper/monaco-helper.service';
import { SupabaseService } from '../../services/supabase/supabase.service';
import { Router } from '@angular/router';
import { DownloadProjectFilesDialogComponent } from '../../components/dialogs/download-project-files/download-project-files-dialog.component';
import { RestoreProjectFilesDialogComponent } from '../../components/dialogs/restore-project-files/restore-project-files-dialog.component';

@Injectable({
    providedIn: 'root',
})
export class EditorFacadeService {
    private readonly nodes = new BehaviorSubject<
        Array<FileNode | DirectoryNode>
    >([{ name: '', children: [], path: '' }]);

    private readonly loading = new BehaviorSubject<boolean>(true);
    private readonly currentOpenedFilePath = new BehaviorSubject<string | null>(
        null
    );

    readonly currentOpenedDirectoryPath = new BehaviorSubject<string>('');

    readonly nodes$ = this.nodes.asObservable();
    readonly options$ = this.editorService.options$;
    readonly fileData$ = this.editorService.fileData$;
    readonly monacoEditorInstance =
        new BehaviorSubject<editor.IStandaloneCodeEditor | null>(null);
    readonly currentOpenedFilePath$ = this.currentOpenedFilePath.asObservable();
    readonly currentOpenedDirectoryPath$ =
        this.currentOpenedDirectoryPath.asObservable();
    readonly searchFileContentResult$ =
        this.webcontainersService.searchFileContentResult$;

    readonly loading$ = this.loading.asObservable();
    readonly containerAppUrl$ = this.webcontainersService.containerAppUrl$;

    constructor(
        private readonly webcontainersService: WebcontainersService,
        private readonly editorService: EditorService,
        private readonly terminalService: TerminalService,
        private readonly dialogService: NbDialogService,
        private readonly toastrService: NbToastrService,
        private readonly fileStorageService: FileStorageService,
        private readonly taskService: TaskService,
        private readonly monacoHelperService: MonacoHelperService,
        private readonly supabaseService: SupabaseService,
        private readonly router: Router
    ) {}

    boot(downloadProjectName?: string) {
        return this.webcontainersService.boot().pipe(
            mergeMap(() => this.terminalService.addShell()),
            tap(() => this.terminalService.selectShell(0)),
            tap(() => this.loading.next(false)),
            mergeMap(() => {
                if (!downloadProjectName) {
                    return of(false);
                }

                const dialogRef = this.dialogService.open(
                    DownloadProjectFilesDialogComponent,
                    {
                        closeOnBackdropClick: false,
                        closeOnEsc: false,
                    }
                );

                return this.downloadProject(downloadProjectName).pipe(
                    tap(() => dialogRef.close()),
                    map(() => true)
                );
            }),
            mergeMap((projectDownloaded) => {
                if (
                    projectDownloaded ||
                    !this.fileStorageService.isProjectSavedLocally()
                ) {
                    return of(false);
                }

                return this.dialogService
                    .open(RestoreProjectDialogComponent)
                    .onClose.pipe(
                        map((restore): restore is boolean => !!restore)
                    );
            }),
            mergeMap((restore) => {
                if (!restore) {
                    return of(null);
                }

                const dialogRef = this.dialogService.open(
                    RestoreProjectFilesDialogComponent
                );

                const directories =
                    this.fileStorageService.getDirectoriesStructure();

                if (!directories) {
                    return EMPTY;
                }

                return this.fileStorageService.getAllFiles().pipe(
                    mergeMap((files) =>
                        this.fileStorageService.restoreProject(
                            directories,
                            files
                        )
                    ),
                    tap(() => dialogRef.close())
                );
            }),
            catchError((error) => {
                this.dialogService.open(ErrorDialogComponent, {
                    context: {
                        errorMsg: error.message,
                    },
                    closeOnBackdropClick: false,
                    closeOnEsc: false,
                });

                return EMPTY;
            })
        );
    }

    watchFileChanges() {
        return this.webcontainersService.watchFileChanges();
    }

    updateFileSystemStructure(directoryNode: DirectoryNode) {
        this.nodes.next(directoryNode.children);
    }

    openFile(filePath: string, lineNumber?: number) {
        const fileName = this.getFileName(filePath);

        if (!fileName) {
            return;
        }

        this.currentOpenedFilePath.next(filePath);

        this.currentOpenedDirectoryPath.next(
            this.getOpenedDirectoryPath(filePath)
        );

        this.webcontainersService
            .readFile(filePath)
            .pipe(
                mergeMap((fileData) => {
                    if (!this.monacoEditorInstance.value) {
                        return EMPTY;
                    }

                    return this.monacoHelperService.openFileAtSpecificLine(
                        fileName,
                        filePath,
                        fileData,
                        this.monacoEditorInstance.value,
                        lineNumber
                    );
                }),
                tap(() => this.restoreFileState(filePath))
            )
            .subscribe();
    }

    writeEditingFile(value: string) {
        if (!this.currentOpenedFilePath.value) {
            return EMPTY;
        }

        return this.webcontainersService
            .writeFile(this.currentOpenedFilePath.value, value)
            .pipe(
                tap(() => {
                    if (
                        !this.currentOpenedFilePath.value ||
                        !this.monacoEditorInstance.value
                    ) {
                        return;
                    }

                    this.monacoHelperService.updateModel(
                        this.currentOpenedFilePath.value,
                        value,
                        this.monacoEditorInstance.value
                    );
                })
            );
    }

    formatDocument() {
        const editorInstance = this.monacoEditorInstance.value;

        if (!editorInstance) {
            return;
        }

        this.monacoHelperService.formatDocument(editorInstance);
    }

    saveProjectLocally() {
        this.toastrService.show('', 'Saving files in progress', {
            position: NbGlobalPhysicalPosition.TOP_RIGHT,
            status: 'info',
            icon: 'save-outline',
            hasIcon: true,
            destroyByClick: true,
        });

        this.fileStorageService.addOrUpdateDirectoriesStructure(
            this.nodes.value
        );

        this.fileStorageService
            .clearFiles()
            .pipe(tap(() => this.saveNodesToIndexedDb(this.nodes.value)))
            .subscribe();
    }

    getCodeAutocompletion({
        selectedCode,
        lineNumber,
    }: MonacoAutocompleteCodeAction) {
        return this.taskService
            .createTaskForCodeAutocompletion(selectedCode)
            .pipe(
                switchMap(({ id }) => this.taskService.getTaskStatus(id)),
                map(({ result }) =>
                    this.pasteAutocompleteResultToEditor(result, lineNumber)
                )
            );
    }

    teardownWebcontainers() {
        this.webcontainersService.teardown();
    }

    searchFileContent(searchingFileContent: string) {
        return this.webcontainersService.searchFileContent(
            searchingFileContent
        );
    }

    updateFileState(filePath?: string) {
        const path = filePath ?? this.currentOpenedFilePath.value;

        if (!this.monacoEditorInstance.value || !path) {
            return;
        }

        this.monacoHelperService.updateFileState(
            path,
            this.monacoEditorInstance.value
        );
    }

    restoreFileState(filePath?: string) {
        const path = filePath ?? this.currentOpenedFilePath.value;

        if (!this.monacoEditorInstance.value || !path) {
            return;
        }

        this.monacoHelperService.restoreFileState(
            path,
            this.monacoEditorInstance.value
        );
    }

    shareProject() {
        const rootDirectories = this.nodes.value.filter(
            (node): node is DirectoryNode =>
                node.name !== 'node_modules' && 'children' in node
        );

        return this.fileStorageService
            .getProjectDataAsZip(rootDirectories)
            .pipe(
                map((blob) => ({
                    blob,
                    fileName:
                        this.fileStorageService.generateUniqueProjectFileName(),
                })),
                mergeMap(({ blob, fileName }) =>
                    this.supabaseService
                        .uploadFile(blob, `${fileName}.zip`)
                        .pipe(map(() => fileName))
                ),
                mergeMap((fileName) => this.router.navigate([`/p/${fileName}`]))
            );
    }

    private downloadProject(projectName: string) {
        return this.supabaseService
            .downloadFile(projectName)
            .pipe(
                mergeMap((blob) =>
                    this.fileStorageService.unzipDownloadedProject(blob)
                )
            );
    }

    private getFileName(filePath: string) {
        return filePath.split('/').pop();
    }

    private getOpenedDirectoryPath(filePath: string) {
        return filePath.split('/').slice(0, -1).join('/');
    }

    private saveNodesToIndexedDb(nodes: Array<FileNode | DirectoryNode>) {
        for (const node of nodes) {
            if ('children' in node) {
                if (node.name === 'node_modules') {
                    continue;
                }

                this.saveNodesToIndexedDb(node.children);

                continue;
            }

            this.saveFileToIndexedDb(node.path);
        }
    }

    private saveFileToIndexedDb(path: string) {
        this.webcontainersService
            .readFile(path)
            .pipe(
                mergeMap((content) =>
                    this.fileStorageService.addOrUpdateFile({
                        path,
                        content,
                    })
                )
            )
            .subscribe();
    }

    private pasteAutocompleteResultToEditor(
        result: string,
        lineNumber: number
    ) {
        const editorInstance = this.monacoEditorInstance.value;

        if (!editorInstance) {
            return;
        }

        this.monacoHelperService.pasteAutocompleteResultToEditor(
            result,
            lineNumber,
            editorInstance
        );
    }
}
