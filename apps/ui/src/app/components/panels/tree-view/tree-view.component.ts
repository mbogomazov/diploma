import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
} from '@angular/core';
import {
    ITreeNode,
    ITreeState,
} from '@circlon/angular-tree-component/lib/defs/api';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { BehaviorSubject, EMPTY, catchError, mergeMap, take } from 'rxjs';
import { EditorFacadeService } from '../../../facades/editor/editor-facade.service';
import { NbDialogService } from '@nebular/theme';
import { AddFileFolderComponent } from '../../dialogs/add-file-folder/add-file-folder.component';
import { DirectoryNode, FileNode } from '@online-editor/types';
import { DeleteFileFolderComponent } from '../../dialogs/delete-file/delete-file-folder.component';

@UntilDestroy()
@Component({
    selector: 'online-editor-tree-view',
    templateUrl: './tree-view.component.html',
    styleUrls: ['./tree-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTreeViewComponent implements OnInit, AfterViewInit {
    @ViewChild('parentElem', { read: ElementRef })
    private parentTreeElem?: ElementRef;

    readonly options = {
        useVirtualScroll: true,
        nodeHeight: 20,
        idField: 'path',
        hasChildrenField: 'children',
        animateExpand: true,
        scrollOnActivate: true,
        animateSpeed: 30,
        animateAcceleration: 1.2,
    };

    readonly bodyContainerHeight = new BehaviorSubject<number | null>(null);

    readonly nodes$ = this.editorFacadeService.nodes$;

    editingNode!: ITreeNode;

    state: ITreeState = {};

    constructor(
        private readonly editorFacadeService: EditorFacadeService,
        private readonly dialogService: NbDialogService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.editorFacadeService
            .watchFileChanges()
            .pipe(untilDestroyed(this))
            .subscribe();
    }

    ngAfterViewInit() {
        if (!this.parentTreeElem) {
            return;
        }

        this.bodyContainerHeight.next(
            // parent container - header height + padding
            this.parentTreeElem.nativeElement.clientHeight - 57 + 5
        );

        this.changeDetectorRef.detectChanges();
    }

    onActivate({ node }: { eventName: 'activate'; node: ITreeNode }) {
        const data: FileNode | DirectoryNode = node.data;

        if ('children' in data) {
            this.editorFacadeService.currentOpenedDirectoryPath.next(
                node.data.path
            );

            return;
        }

        this.editingNode = node;

        const { path } = node.data as {
            path: string;
        };

        this.editorFacadeService.openFile(path);
    }

    addFile() {
        this.editorFacadeService.currentOpenedDirectoryPath$
            .pipe(
                take(1),
                mergeMap(
                    (currentOpenedDirectoryPath) =>
                        this.dialogService.open(AddFileFolderComponent, {
                            context: {
                                type: 'file',
                                action: 'add',
                                editingPath: currentOpenedDirectoryPath,
                            },
                        }).onClose
                ),
                catchError((error) => {
                    console.error(error);

                    return EMPTY;
                }),
                untilDestroyed(this)
            )
            .subscribe();
    }

    addFolder() {
        this.editorFacadeService.currentOpenedDirectoryPath$
            .pipe(
                take(1),
                mergeMap(
                    (currentOpenedDirectoryPath) =>
                        this.dialogService.open(AddFileFolderComponent, {
                            context: {
                                type: 'folder',
                                action: 'add',
                                editingPath: currentOpenedDirectoryPath,
                            },
                        }).onClose
                ),
                catchError((error) => {
                    console.error(error);

                    return EMPTY;
                }),
                untilDestroyed(this)
            )
            .subscribe();
    }

    rename(data: FileNode | DirectoryNode) {
        this.editorFacadeService.currentOpenedDirectoryPath$
            .pipe(
                take(1),
                mergeMap(
                    (currentOpenedDirectoryPath) =>
                        this.dialogService.open(AddFileFolderComponent, {
                            context: {
                                type: 'file',
                                action: 'rename',
                                editingPath: currentOpenedDirectoryPath,
                                editingName: data.name,
                            },
                        }).onClose
                ),
                catchError((error) => {
                    console.error(error);

                    return EMPTY;
                }),
                untilDestroyed(this)
            )
            .subscribe();
    }

    delete(data: FileNode | DirectoryNode) {
        this.dialogService
            .open(DeleteFileFolderComponent, {
                context: {
                    filePath: data.path,
                },
            })
            .onClose.pipe(untilDestroyed(this))
            .subscribe();
    }
}
