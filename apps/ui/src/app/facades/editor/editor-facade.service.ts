import { Injectable } from '@angular/core';
import { WebcontainersService } from '../../services/webcontainers/webcontainers.service';
import { BehaviorSubject, EMPTY, catchError, map, mergeMap, tap } from 'rxjs';
import { ITreeNode } from '@circlon/angular-tree-component/lib/defs/api';
import { EditorService } from '../../services/editor/editor.service';
import { TerminalService } from '../../services/terminal/terminal.service';
import { NbDialogService, NbGlobalPhysicalPosition, NbToastrService } from '@nebular/theme';
import { ErrorDialogComponent } from '../../components/error-dialog/error-dialog.component';
import { FileStorageService } from '../../services/files-storage/files-storage.service';

export type FileNode = {
    name: string;
    path: string;
}

export type DirectoryNode = {
    name: string;
    path: string;
    children: Array<FileNode | DirectoryNode>
}

@Injectable({
    providedIn: 'root',
})
export class EditorFacadeService {
    private readonly nodes = new BehaviorSubject<
        Array<FileNode | DirectoryNode>
    >([{ name: '', children: [], path: '' }]);

    readonly nodes$ = this.nodes.asObservable();
    readonly currentOpenedFilePath = new BehaviorSubject<string | null>(null);
    readonly options$ = this.editorService.options$;
    readonly fileData$ = this.editorService.fileData$;
    readonly monacoEditorInstance = new BehaviorSubject<any | null>(null);

    constructor(
        private readonly webcontainersService: WebcontainersService,
        private readonly editorService: EditorService,
        private readonly terminalService: TerminalService,
        private readonly dialogService: NbDialogService,
        private readonly toastrService: NbToastrService,
        private readonly fileStorageService: FileStorageService,
    ) { }

    boot() {
        return this.webcontainersService.boot().pipe(
            mergeMap(() => this.terminalService.addShell()),
            tap(() => this.terminalService.selectShell(0)),
            catchError((error) => {
                this.dialogService.open(ErrorDialogComponent, {
                    context: {
                        errorMsg: error.message
                    },
                    closeOnBackdropClick: false,
                    closeOnEsc: false,
                });

                return EMPTY;
            }),
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

        this.webcontainersService.readFile(path).subscribe((data) => {
            this.currentOpenedFilePath.next(path);

            this.editorService.setFileData(name, data, path);
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
    }

    formatDocument() {
        const editorInstance = this.monacoEditorInstance.value;

        if (!editorInstance) {
            return;
        }

        editorInstance.getAction('editor.action.formatDocument').run();

        // this.writeEditingFile();
    }

    saveProjectLocally() {
        this.toastrService.show('', 'Saving files in progress', {
            position: NbGlobalPhysicalPosition.TOP_RIGHT,
            status: 'info',
            icon: 'save-outline',
            hasIcon: true,
            destroyByClick: true,
        });

        this.fileStorageService.addOrUpdateDirectoriesStructure(this.nodes.value)

        this.saveNodesToIndexedDb(this.nodes.value);
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
        this.webcontainersService.readFile(path).pipe(mergeMap((content) =>
            this.fileStorageService.addOrUpdateFile({
                path,
                content
            })
        ),
            mergeMap(() => this.fileStorageService.getFileByPath(path)),
            map(content => console.log(content))).subscribe();
    }
}
