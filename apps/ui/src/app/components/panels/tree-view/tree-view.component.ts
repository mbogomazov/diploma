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

import { WebcontainersService } from '../../../services/webcontainers/webcontainers.service';
import {
    BehaviorSubject,
    EMPTY,
    catchError,
    filter,
    map,
    mergeMap,
    take,
    tap,
} from 'rxjs';
import { TreeComponent } from '@circlon/angular-tree-component';
import { EditorFacadeService } from '../../../facades/editor/editor-facade.service';
import { NbDialogService } from '@nebular/theme';
import { AddFileFolderComponent } from '../../dialogs/add-file-folder/add-file-folder.component';
import { DirectoryNode, FileNode } from '@online-editor/types';

@UntilDestroy()
@Component({
    selector: 'online-editor-tree-view',
    templateUrl: './tree-view.component.html',
    styleUrls: ['./tree-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TreeViewComponent implements OnInit, AfterViewInit {
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
        private readonly webcontainersService: WebcontainersService,
        private readonly dialogService: NbDialogService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.webcontainersService.fileSystemChanges$
            .pipe(
                filter((data): data is DirectoryNode => !!data),
                untilDestroyed(this)
            )
            .subscribe((data) => {
                this.editorFacadeService.updateFileSystemStructure(data);
            });
    }

    ngAfterViewInit() {
        if (!this.parentTreeElem) {
            return;
        }

        this.bodyContainerHeight.next(
            // parent container - header height
            this.parentTreeElem.nativeElement.clientHeight - 57
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

        this.editorFacadeService.currentOpenedDirectoryPath.next(
            node.data.path.split('/').slice(0, -1).join('/')
        );

        this.editingNode = node;

        this.editorFacadeService.onFileActivated(node);
    }

    addFile() {
        this.dialogService
            .open(AddFileFolderComponent, {
                context: {
                    type: 'file',
                },
            })
            .onClose.pipe(
                filter((fileName): fileName is string => !!fileName),
                mergeMap((fileName) =>
                    this.editorFacadeService.currentOpenedDirectoryPath$.pipe(
                        take(1),
                        map(
                            (currentOpenedDirectoryPath) =>
                                [fileName, currentOpenedDirectoryPath] as const
                        )
                    )
                ),
                mergeMap(([fileName, currentOpenedDirectoryPath]) =>
                    this.webcontainersService.writeFile(
                        `${currentOpenedDirectoryPath}/${fileName}`,
                        ''
                    )
                ),
                catchError((error) => {
                    console.log(error);

                    return EMPTY;
                }),
                untilDestroyed(this)
            )
            .subscribe();
    }

    addFolder() {
        this.dialogService
            .open(AddFileFolderComponent, {
                context: {
                    type: 'folder',
                },
            })
            .onClose.pipe(
                filter((folderName): folderName is string => !!folderName),
                mergeMap((fileName) =>
                    this.editorFacadeService.currentOpenedDirectoryPath$.pipe(
                        take(1),
                        map(
                            (currentOpenedDirectoryPath) =>
                                [fileName, currentOpenedDirectoryPath] as const
                        )
                    )
                ),
                mergeMap(([fileName, currentOpenedDirectoryPath]) =>
                    this.webcontainersService.mkDir(
                        `${currentOpenedDirectoryPath}/${fileName}`
                    )
                ),
                catchError((error) => {
                    console.log(error);

                    return EMPTY;
                }),
                untilDestroyed(this)
            )
            .subscribe();
    }
}
