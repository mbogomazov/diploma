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
import { ITreeNode } from '@circlon/angular-tree-component/lib/defs/api';
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
import { parse } from 'comment-json';
import { TaskService } from '../../services/task/task.service';
import { DirectoryNode, FileNode } from '@online-editor/types';
import { NgxEditorModel } from 'ngx-monaco-editor-emmet';

declare const monaco: any;

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
    private readonly currentModel = new BehaviorSubject<NgxEditorModel | null>(
        null
    );

    readonly currentOpenedDirectoryPath = new BehaviorSubject<string>('');

    readonly nodes$ = this.nodes.asObservable();
    readonly options$ = this.editorService.options$;
    readonly fileData$ = this.editorService.fileData$;
    readonly monacoEditorInstance = new BehaviorSubject<any | null>(null);
    readonly currentOpenedFilePath$ = this.currentOpenedFilePath.asObservable();
    readonly currentOpenedDirectoryPath$ =
        this.currentOpenedDirectoryPath.asObservable();
    readonly currentModel$ = this.currentModel.asObservable();

    readonly loading$ = this.loading.asObservable();

    constructor(
        private readonly webcontainersService: WebcontainersService,
        private readonly editorService: EditorService,
        private readonly terminalService: TerminalService,
        private readonly dialogService: NbDialogService,
        private readonly toastrService: NbToastrService,
        private readonly fileStorageService: FileStorageService,
        private readonly taskService: TaskService
    ) {}

    boot() {
        return this.webcontainersService.boot().pipe(
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

    updateFileSystemStructure(directoryNode: DirectoryNode) {
        this.nodes.next(directoryNode.children);
    }

    onFileActivated(node: ITreeNode) {
        const { name, path } = node.data as {
            name: string;
            path: string;
        };

        this.currentOpenedFilePath.next(path);
        this.currentOpenedDirectoryPath.next(
            path.split('/').slice(0, -1).join('/')
        );

        this.webcontainersService.readFile(path).subscribe((data) => {
            const extension = name.split('.').slice(-1).pop();

            if (!extension) {
                return;
            }

            if (['ts', 'tsx'].includes(extension)) {
                // const currentDirectoryPath = path
                //     .split('/')
                //     .slice(0, -1)
                //     .join('/');
                // this.findNearestTsconfig(currentDirectoryPath);
            }

            const model = monaco.editor.getModel(monaco.Uri.file(path));

            const editorInstance = this.monacoEditorInstance.value;

            if (!model || !editorInstance) {
                this.editorService.setFileData(name, data);

                return;
            }

            // update model value by opened file data
            model.setValue(data);

            editorInstance.setModel(model);

            const editorService = editorInstance._codeEditorService;

            const openEditorBase =
                editorService.openCodeEditor.bind(editorService);

            // TODO: refactor it
            editorService.openCodeEditor = async (
                input: { resource: any },
                source: any
            ) => {
                const result = await openEditorBase(input, source);

                if (result === null) {
                    // console.log("Open definition for:", input);
                    // console.log("Corresponding model:", monaco.editor.getModel(input.resource));
                    const model = monaco.editor.getModel(input.resource);
                    editorInstance.setModel(model);
                }

                return result; // always return the base result
            };
        });
    }

    writeEditingFile(value: string) {
        if (!this.currentOpenedFilePath.value) {
            return;
        }

        this.webcontainersService.writeFile(
            this.currentOpenedFilePath.value,
            value
        );

        const model = monaco.editor.getModel(
            monaco.Uri.file(this.currentOpenedFilePath.value)
        );

        if (!model) {
            return;
        }

        model.setValue(value);
    }

    formatDocument() {
        const editorInstance = this.monacoEditorInstance.value;

        if (!editorInstance) {
            return;
        }

        editorInstance.getAction('editor.action.formatDocument').run();
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

    getCodeAutocompletion(codePiece: string, lineNumber: number) {
        this.taskService
            .createTaskForCodeAutocompletion(codePiece)
            .pipe(
                switchMap(({ id }) => this.taskService.getTaskStatus(id)),
                map(({ result }) =>
                    this.pasteResultToEditor(result, lineNumber)
                )
            )
            .subscribe();
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

    // private findNearestTsconfig(directoryPath: string) {
    //     const currentPath = directoryPath.split('/');

    //     if (currentPath.length <= 0) {
    //         return;
    //     }

    //     const potentialTsconfigPath = [...currentPath, 'tsconfig.json'].join(
    //         '/'
    //     );

    //     this.webcontainersService
    //         .readFile(potentialTsconfigPath)
    //         .pipe(
    //             catchError((error) => {
    //                 if (
    //                     !error.message.includes(
    //                         'ENOENT: no such file or directory, open'
    //                     )
    //                 ) {
    //                     return throwError(() => error.message);
    //                 }

    //                 currentPath.pop();

    //                 this.findNearestTsconfig(currentPath.join('/'));

    //                 return EMPTY;
    //             })
    //         )
    //         .subscribe((tsConfigFileData) => {
    //             const tsConfigOptions: any | null = parse(tsConfigFileData);

    //             if (!tsConfigOptions) {
    //                 return;
    //             }

    //             const editorInstance = this.monacoEditorInstance.value;

    //             if (!editorInstance) {
    //                 return;
    //             }

    //             monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
    //                 {
    //                     target: monaco.languages.typescript.ScriptTarget.ES2016,
    //                     allowNonTsExtensions: true,
    //                     moduleResolution:
    //                         monaco.languages.typescript.ModuleResolutionKind
    //                             .NodeJs,
    //                     module: monaco.languages.typescript.ModuleKind.CommonJS,
    //                     noEmit: true,
    //                     typeRoots: ['node_modules/@types'],
    //                     baseUrl: './',
    //                 }
    //             );

    //             monaco.languages.typescript.javascriptDefaults.setEagerModelSync(
    //                 true
    //             );

    //             monaco.languages.typescript.typescriptDefaults.setEagerModelSync(
    //                 true
    //             );
    //         });
    // }

    pasteResultToEditor(result: string, lineNumber: number) {
        const range = new monaco.Range(lineNumber, 1, lineNumber, 1);

        const edits = [
            {
                range: range,
                text: result,
                forceMoveMarkers: true,
            },
        ];

        const editorInstance = this.monacoEditorInstance.value;

        if (!editorInstance) {
            return;
        }

        editorInstance.executeEdits('my-source', edits);
    }
}
