import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, filter, map } from 'rxjs';
import { EditorFacadeService } from '../../facades/editor/editor-facade.service';

@Component({
    selector: 'online-editor-editor',
    templateUrl: './editor.component.html',
    styleUrls: ['./editor.component.scss'],
    providers: [{ provide: Window, useValue: window }],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorComponent implements OnInit {
    @Input() showEditorHider = false;

    readonly form = new FormGroup({
        editor: new FormControl(),
    });

    readonly options$ = this.editorFacade.options$;

    readonly openedFileName = this.editorFacade.currentOpenedFilePath.pipe(map(filepath => filepath ? filepath.split('/').slice(-1) : '...'));

    get editorControl() {
        return this.form.controls.editor;
    }

    constructor(
        private readonly editorFacade: EditorFacadeService,
        private readonly window: Window
    ) { }

    ngOnInit() {
        this.editorControl.valueChanges
            .pipe(
                filter((value): value is string => !!value),
                debounceTime(500)
            )
            .subscribe((value) => {
                this.editorFacade.writeEditingFile(value);
            });

        this.editorFacade.fileData$.subscribe((fileData) =>
            this.editorControl.patchValue(fileData)
        );

        this.window.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();

                this.editorFacade.writeEditingFile(this.editorControl.value);

                // Save project to indexDB
            }
        });
    }

    formatDocument() {
        this.editorFacade.formatDocument();

        this.editorFacade.writeEditingFile(this.editorControl.value);
    }

    onEditorInit(editorInstance: any) {
        this.editorFacade.monacoEditorInstance.next(editorInstance);
    }
}
