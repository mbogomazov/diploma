import { Injectable } from '@angular/core';
import {
    BehaviorSubject,
    EMPTY,
    Observable,
    catchError,
    defer,
    filter,
    from,
    map,
    mergeMap,
    of,
    switchMap,
    take,
    tap,
    zip,
} from 'rxjs';
import { editor, languages } from 'monaco-editor';

import { MonacoAutocompleteCodeAction } from './monaco-helper.consts';
import { EditorService } from '../editor/editor.service';
import { languageTypeByExtensionMap } from '../../helpers/models';
import { WebcontainersService } from '../webcontainers/webcontainers.service';
import { TypingsPathsType } from '@online-editor/types';

declare const monaco: typeof import('monaco-editor');

@Injectable({
    providedIn: 'root',
})
export class MonacoHelperService {
    private worker!: Worker;

    private editorStates: Map<string, editor.ICodeEditorViewState> = new Map();

    private readonly autocompleteAction =
        new BehaviorSubject<MonacoAutocompleteCodeAction | null>(null);

    readonly autocompleteAction$ = this.autocompleteAction.asObservable();

    constructor(
        private readonly editorService: EditorService,
        private readonly webcontainersService: WebcontainersService
    ) {
        if (typeof Worker !== 'undefined') {
            this.worker = new Worker(
                new URL(
                    '../../workers/resolve-imports.worker.ts',
                    import.meta.url
                )
            );
        } else {
            console.warn('Web Workers are not supported in this environment.');
        }
    }

    setupMonacoHelpers(editorInstance: editor.IStandaloneCodeEditor) {
        this.setupOpenFileByImportClick(editorInstance);

        this.initMonacoOptions();

        this.addCodeAutocompleteAction();
    }

    addCodeAutocompleteAction() {
        const KeyCode = monaco.KeyCode;

        monaco.editor.addEditorAction({
            id: 'autocomplete-code',
            label: 'Autocomplete code',
            keybindings: [monaco.KeyMod.CtrlCmd | KeyCode.Enter],
            contextMenuOrder: 2,
            contextMenuGroupId: '1_modification',

            run: (ed: any) => {
                const selection = ed.getSelection();
                const model = ed.getModel();

                const lineNumber = selection.startLineNumber;

                if (selection && model.getValueInRange(selection)) {
                    this.autocompleteAction.next({
                        selectedCode: model.getValueInRange(selection),
                        lineNumber: lineNumber + 1,
                    });

                    return;
                }

                this.autocompleteAction.next({
                    selectedCode: model.getLineContent(lineNumber),
                    lineNumber: lineNumber + 1,
                });

                return;
            },
        });
    }

    openFileAtSpecificLine(
        name: string,
        path: string,
        fileData: string,
        editorInstance: editor.IStandaloneCodeEditor,
        lineNumber?: number
    ) {
        this.openFile(name, path, fileData, editorInstance);

        if (['js', 'jsx', 'ts', 'tsx'].includes(this.getExtension(path))) {
            return this.parseImports(fileData, name).pipe(
                mergeMap(({ npmImports, localImports }) =>
                    this.resolveNpmLibraryImports(path, npmImports).pipe(
                        map(() => localImports)
                    )
                ),
                mergeMap((localImports) =>
                    this.resolveLocalFileImports(
                        path,
                        localImports,
                        editorInstance
                    )
                )
            );
        }

        if (lineNumber !== undefined) {
            setTimeout(() => {
                editorInstance.revealLine(
                    lineNumber,
                    monaco.editor.ScrollType.Immediate
                );

                editorInstance.setPosition({ lineNumber, column: 1 });
                editorInstance.focus();
            }, 100);
        }

        return of(null);
    }

    formatDocument(editorInstance: editor.IStandaloneCodeEditor) {
        editorInstance.getAction('editor.action.formatDocument')!.run();
    }

    getLanguageByFilePath(filePath?: string) {
        if (!filePath) {
            return 'plaintext';
        }

        const extension = this.getExtension(filePath);

        if (!extension) {
            return 'plaintext';
        }

        return languageTypeByExtensionMap[extension] ?? 'plaintext';
    }

    pasteAutocompleteResultToEditor(
        result: string,
        lineNumber: number,
        editorInstance: editor.IStandaloneCodeEditor
    ) {
        const range = new monaco.Range(lineNumber, 1, lineNumber, 1);

        const edits = [
            {
                range: range,
                text: result,
                forceMoveMarkers: true,
            },
        ];

        editorInstance.executeEdits('my-source', edits);
    }

    updateModel(
        filePath: string,
        fileData: string,
        editorInstance: editor.IStandaloneCodeEditor
    ) {
        const model = this.getMonacoModel(filePath);

        if (!model) {
            this.createMonacoModel(
                fileData,
                this.getLanguageByFilePath(filePath),
                filePath
            );

            return;
        }

        const oldFullModelRange = model.getFullModelRange();

        editorInstance.pushUndoStop();

        model.pushEditOperations(
            [],
            [{ range: oldFullModelRange, text: fileData }],
            () => null
        );

        editorInstance.pushUndoStop();

        this.restoreFileState(filePath, editorInstance);
    }

    updateFileState(
        filePath: string,
        editorInstance: editor.IStandaloneCodeEditor
    ) {
        this.editorStates.set(filePath, editorInstance.saveViewState()!);
    }

    restoreFileState(
        filePath: string,
        editorInstance: editor.IStandaloneCodeEditor
    ) {
        const editorState = this.editorStates.get(filePath);

        if (!editorState) {
            return;
        }

        editorInstance.restoreViewState(editorState);
    }

    parseImports(
        fileData: string,
        fileName: string
    ): Observable<{ npmImports: Array<string>; localImports: Array<string> }> {
        return defer<
            Promise<{ npmImports: Array<string>; localImports: Array<string> }>
        >(
            () =>
                new Promise((resolve, reject) => {
                    this.worker.onmessage = ({ data }) => {
                        resolve(data);
                    };

                    this.worker.onerror = (error) => {
                        reject(error);
                    };

                    this.worker.postMessage({ fileData, fileName });
                })
        );
    }

    private openFile(
        name: string,
        path: string,
        fileData: string,
        editorInstance: editor.IStandaloneCodeEditor
    ) {
        const extension = this.getExtension(name);

        if (!extension) {
            return;
        }

        if (['ts', 'tsx'].includes(extension)) {
            // TODO: add tsconfig.json
        }

        if (!editorInstance) {
            this.editorService.setFileData(name, fileData);

            return;
        }

        const model = this.getMonacoModel(path);

        if (!model) {
            const language = this.getLanguageByFilePath(path);

            this.createMonacoModel(fileData, language, path);

            editorInstance.setModel(this.getMonacoModel(path));

            return;
        }

        model.setValue(fileData);

        editorInstance.setModel(model);
    }

    private getExtension(fileName: string) {
        return fileName.split('.').slice(-1).pop() ?? '';
    }

    private initMonacoOptions() {
        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

        monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

        const diagnosticsOptions: languages.typescript.DiagnosticsOptions = {
            noSemanticValidation: false,
            noSyntaxValidation: false,
        };

        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(
            diagnosticsOptions
        );

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2015,
            allowNonTsExtensions: true,
            moduleResolution:
                monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            typeRoots: ['node_modules'],
        });
    }

    private createMonacoModel(
        content: string,
        language: string,
        filePath: string
    ) {
        monaco.editor.createModel(content, language, monaco.Uri.file(filePath));
    }

    private getMonacoModel(filePath: string) {
        return monaco.editor.getModel(monaco.Uri.file(filePath));
    }

    private setupOpenFileByImportClick(editorInstance: any) {
        const editorService = editorInstance._codeEditorService;

        const openEditorBase = editorService.openCodeEditor.bind(editorService);

        editorService.openCodeEditor = async (
            input: { resource: any },
            source: any
        ) => {
            const result = await openEditorBase(input, source);

            if (result === null) {
                const model = this.getMonacoModel(input.resource.path);

                editorInstance.setModel(model);
            }

            return result;
        };
    }

    private resolveLocalFileImports(
        path: string,
        localFileImports: Array<string>,
        editorInstance: editor.IStandaloneCodeEditor
    ) {
        return from(localFileImports).pipe(
            mergeMap((localFilePath) =>
                this.resolveLocalFileImport(path, localFilePath, editorInstance)
            )
        );
    }

    private resolveLocalFileImport(
        currentFilePath: string,
        localImportingFilePath: string,
        editorInstance: editor.IStandaloneCodeEditor
    ) {
        const baseDir = currentFilePath.substring(
            0,
            currentFilePath.lastIndexOf('/')
        );

        const relativeParts = localImportingFilePath.split('/');

        const baseDirParts = baseDir.split('/').filter((part) => part !== '');

        for (const part of relativeParts) {
            if (part === '..') {
                baseDirParts.pop();
            } else if (part !== '.') {
                baseDirParts.push(part);
            }
        }

        const absoluteImportingFilePath = `${baseDirParts.join(
            '/'
        )}.${this.getExtension(currentFilePath)}`;

        return this.webcontainersService
            .readFile(absoluteImportingFilePath)
            .pipe(
                tap((fileData) => {
                    if (!editorInstance) {
                        return;
                    }

                    this.updateModel(
                        absoluteImportingFilePath,
                        fileData,
                        editorInstance
                    );
                }),
                catchError(() => EMPTY)
            );
    }

    private resolveNpmLibraryImports(
        filepath: string,
        npmPackageNames: Array<string>
    ) {
        // call webcontainers script to get npm package path
        // after that generate path to index.d.ts and try to read it
        // if success add extraLib to monaco

        return this.webcontainersService
            .getNpmPackagePaths(filepath, npmPackageNames.join(','))
            .pipe(
                filter(
                    (
                        npmPackagesPathsString
                    ): npmPackagesPathsString is string =>
                        !!npmPackagesPathsString &&
                        npmPackagesPathsString !== 'Error\r\n'
                ),
                take(1),
                map(
                    (npmPackagesPathsString) =>
                        JSON.parse(npmPackagesPathsString) as TypingsPathsType
                ),
                mergeMap((typingNamePaths) =>
                    from(typingNamePaths).pipe(
                        filter(
                            (
                                typingNamePath
                            ): typingNamePath is {
                                packageName: string;
                                packagePath: string;
                            } => !!typingNamePath.packagePath
                        ),
                        switchMap(({ packageName, packagePath }) =>
                            this.webcontainersService
                                .readFile(packagePath.trim())
                                .pipe(
                                    map((fileData) => ({
                                        fileData,
                                        packageName,
                                    }))
                                )
                        ),
                        tap(({ fileData, packageName }) => {
                            this.addExtraLib(fileData, packageName);
                        })
                    )
                ),
                catchError((error) => {
                    console.error(error);

                    return EMPTY;
                })
            );
    }

    private addExtraLib(fileData: string, npmPackageName: string) {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
            fileData,
            `file:///node_modules/${npmPackageName}/index.d.ts`
        );

        monaco.languages.typescript.javascriptDefaults.addExtraLib(
            fileData,
            `file:///node_modules/${npmPackageName}/index.d.ts`
        );
    }
}
