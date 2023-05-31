import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
    }
}
