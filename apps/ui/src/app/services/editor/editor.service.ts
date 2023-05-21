import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { editorsOptions } from '../../components/editor/editor.model';

@Injectable({
    providedIn: 'root',
})
export class EditorService {
    private readonly fileData = new BehaviorSubject<string | null>(null);
    readonly fileData$ = this.fileData.asObservable();

    private readonly parentEditorOptions = {
        automaticLayout: true,
        theme: 'vs-dark',
        minimap: {
            enabled: false,
        },
    };

    private readonly options = new BehaviorSubject<{ [key: string]: any }>({
        ...this.parentEditorOptions,
    });

    readonly options$ = this.options.asObservable();

    setFileData(name: string, data: string, currentOpenedFilePath: string) {
        this.fileData.next(data);

        this.setEditorOptions(name, currentOpenedFilePath);
    }

    setEditorOptions(name: string, currentOpenedFilePath: string) {
        const extension = name.split('.').slice(-1).pop();

        if (!extension) {
            this.options.next({ ...this.options, language: 'text' });

            return;
        }

        if (['ts', 'tsx'].includes(extension)) {
            this.findNearestTsconfig(currentOpenedFilePath);
        }

        const languageOptions = editorsOptions[extension];

        this.options.next({
            ...this.options.value,
            ...languageOptions,
            useEmmet: languageOptions.useEmmet ?? false,
        });
    }

    private findNearestTsconfig(openedFilePath: string): string | null {
        const currentPath = openedFilePath.split('/');

        currentPath.pop();

        // while (currentPath.length > 0) {
        //     const potentialTsconfigPath = [
        //         ...currentPath,
        //         'tsconfig.json',
        //     ].join('/');

        //     const tsConfigNode = fileSystemStructure.find(
        //         (node: FileNode | DirectoryNode) =>
        //             node.path === potentialTsconfigPath
        //     );

        //     if (tsConfigNode) {
        //         return tsConfigNode.path;
        //     }

        //     currentPath.pop();
        // }

        return null;
    }
}
