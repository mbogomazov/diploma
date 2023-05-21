import { AfterContentInit, AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ITreeNode } from '@circlon/angular-tree-component/lib/defs/api';

import { WebcontainersService } from '../../../services/webcontainers/webcontainers.service';
import { BehaviorSubject, filter, tap } from 'rxjs';
import { TreeComponent } from '@circlon/angular-tree-component';
import { DirectoryNode, EditorFacadeService } from '../../../facades/editor/editor-facade.service';

@Component({
    selector: 'online-editor-tree-view',
    templateUrl: './tree-view.component.html',
    styleUrls: ['./tree-view.component.scss'],
})
export class TreeViewComponent implements OnInit, AfterContentInit {
    @ViewChild(TreeComponent)
    private tree?: TreeComponent;

    @ViewChild('parentElem', { read: ElementRef })
    private parentTreeElem?: ElementRef;

    readonly options = {
        useVirtualScroll: true,
        nodeHeight: 20,
        idField: 'path',
    }

    readonly parentElemHeight = new BehaviorSubject<number | null>(null);

    readonly nodes$ = this.editorFacadeService.nodes$.pipe(
        tap(() => {
            if (!this.tree) {
                return;
            }
            this.tree.treeModel.update();
        })
    );

    editingNode!: ITreeNode;

    constructor(
        private readonly editorFacadeService: EditorFacadeService,
        private readonly webcontainersService: WebcontainersService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.webcontainersService.fileSystemChanges$
            .pipe(filter((data): data is DirectoryNode => !!data))
            .subscribe((data) => {
                this.editorFacadeService.updateFileSystemStructure(data);
            });
    }

    ngAfterContentInit() {
        if (!this.parentTreeElem) {
            return;
        }

        console.log(this.parentTreeElem);

        this.parentElemHeight.next(this.parentTreeElem.nativeElement.clientHeight);

        this.changeDetectorRef.markForCheck();
    }

    onActivate({ node }: { eventName: 'activate'; node: ITreeNode }) {
        if (node.data.children) {
            return;
        }

        this.editingNode = node;

        this.editorFacadeService.onFileActivated(node);
    }

}
