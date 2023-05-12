import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, filter } from 'rxjs';
import { FilesService } from '../../services/files/files.service';
import { EditorService } from '../../services/editor/editor.service';

@Component({
    selector: 'online-editor-editor',
    templateUrl: './editor.component.html',
    styleUrls: ['./editor.component.scss'],
    providers: [{ provide: Window, useValue: window }],
})
export class EditorComponent implements OnInit {
    readonly form = new FormGroup({
        editor: new FormControl(),
    });

    readonly options$ = this.editorService.options$;

    get editorControl() {
        return this.form.controls.editor;
    }

    constructor(
        private readonly filesService: FilesService,
        private readonly editorService: EditorService,
        private readonly window: Window
    ) {}

    ngOnInit() {
        this.editorControl.valueChanges
            .pipe(
                filter((value): value is string => !!value),
                debounceTime(500)
            )
            .subscribe((value) => {
                this.filesService.writeEditingFile(value);
            });

        this.editorService.fileData$.subscribe((fileData) =>
            this.editorControl.patchValue(fileData)
        );

        this.window.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();

                this.filesService.writeEditingFile(this.editorControl.value);
            }
        });
    }

    onEditorInit(editorInstance: any) {
        console.log(editorInstance.getAction);

        // editorInstance.getAction('editor.action.formatDocument').run()
    }
}
