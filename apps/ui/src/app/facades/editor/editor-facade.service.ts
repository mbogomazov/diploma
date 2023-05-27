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

    private containerAppUrl = new BehaviorSubject<string | null>(null);

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
    readonly containerAppUrl$ = this.containerAppUrl.asObservable();

    constructor(
        private readonly webcontainersService: WebcontainersService,
        private readonly editorService: EditorService,
        private readonly terminalService: TerminalService,
        private readonly dialogService: NbDialogService,
        private readonly toastrService: NbToastrService,
        private readonly fileStorageService: FileStorageService,
        private readonly taskService: TaskService,
        private readonly monacoHelperService: MonacoHelperService
    ) {}

    boot() {
        return this.webcontainersService.boot().pipe(
            tap((url) => this.containerAppUrl.next(url)),
            mergeMap(() => this.terminalService.addShell()),
            tap(() => this.terminalService.selectShell(0)),
            tap(() => this.loading.next(false)),
            mergeMap(() => {
                if (!this.fileStorageService.isProjectSavedLocally()) {
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

                return this.fileStorageService.restoreProject();
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
                mergeMap((fileData) =>
                    this.monacoHelperService.openFileAtSpecificLine(
                        fileName,
                        filePath,
                        fileData,
                        this.monacoEditorInstance.value,
                        lineNumber
                    )
                ),
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
                    if (!this.currentOpenedFilePath.value) {
                        return;
                    }

                    this.monacoHelperService.updateModel(
                        this.currentOpenedFilePath.value,
                        value
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

        this.fileStorageService
            .getProjectDataAsZip(rootDirectories)
            .pipe()
            .subscribe();
    }

    private getFileName(filePath: string) {
        return filePath.split('/').pop();
    }

    private getOpenedDirectoryPath(filePath: string) {
        return filePath.split('/').slice(0, -1).join('/');
    }

    // TODO: refactor
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
