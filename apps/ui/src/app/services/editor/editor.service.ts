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

    setFileData(name: string, data: string) {
        this.fileData.next(data);

        this.setEmmetEditorOptions(name);
    }

    setEmmetEditorOptions(name: string) {
        const extension = name.split('.').slice(-1).pop();

        if (!extension) {
            return;
        }

        const languageOptions = editorsOptions[extension];

        this.options.next({
            ...this.options.value,
            useEmmet: languageOptions?.useEmmet ?? false,
        });
    }
}
