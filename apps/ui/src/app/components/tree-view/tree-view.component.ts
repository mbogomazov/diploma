import { Component, OnInit, ViewChild } from '@angular/core';
import { ITreeNode } from '@circlon/angular-tree-component/lib/defs/api';

import {
    FileChangeEvent,
    WebcontainersService,
} from '../../services/webcontainers/webcontainers.service';
import { FilesService } from '../../services/files/files.service';
import { filter, tap } from 'rxjs';
import { TreeComponent } from '@circlon/angular-tree-component';

@Component({
    selector: 'online-editor-tree-view',
    templateUrl: './tree-view.component.html',
    styleUrls: ['./tree-view.component.scss'],
})
export class TreeViewComponent implements OnInit {
    @ViewChild(TreeComponent)
    private tree?: TreeComponent;

    readonly nodes$ = this.filesService.nodes$.pipe(
        tap(() => {
            if (!this.tree) {
                return;
            }
            this.tree.treeModel.update();
        })
    );

    editingNode!: ITreeNode;

    constructor(
        private readonly filesService: FilesService,
        private readonly webcontainersService: WebcontainersService
    ) {}

    ngOnInit() {
        this.webcontainersService.fileSystemChanges$
            .pipe(
                filter(
                    (data): data is { event: FileChangeEvent; path: string } =>
                        !!data
                )
            )
            .subscribe(({ event, path }) => {
                this.filesService.processFileEvent(event, path);
            });
    }

    onActivate({ node }: { eventName: 'activate'; node: ITreeNode }) {
        if (node.data.children) {
            return;
        }

        this.editingNode = node;

        this.filesService.onFileActivated(node);
    }
}
