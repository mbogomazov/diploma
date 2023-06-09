import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnInit,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
    BehaviorSubject,
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    mergeMap,
    take,
    tap,
} from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { editor } from 'monaco-editor';

import { EditorFacadeService } from '../../facades/editor/editor-facade.service';
import { MonacoHelperService } from '../../services/monaco-helper/monaco-helper.service';
import { MonacoAutocompleteCodeAction } from '../../services/monaco-helper/monaco-helper.consts';

@UntilDestroy()
@Component({
    selector: 'online-editor-editor',
    templateUrl: './editor.component.html',
    styleUrls: ['./editor.component.scss'],
    providers: [{ provide: Window, useValue: window }],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements OnInit {
    @Input() showEditorHider = false;

    readonly loading = new BehaviorSubject<boolean>(true);

    readonly form = new FormGroup({
        editor: new FormControl(),
    });

    readonly options$ = this.editorFacade.options$;

    readonly openedFileName = this.editorFacade.currentOpenedFilePath$.pipe(
        map((filepath) => (filepath ? filepath.split('/').slice(-1) : ' '))
    );

    get editorControl() {
        return this.form.controls.editor;
    }

    constructor(
        private readonly editorFacade: EditorFacadeService,
        private readonly monacoHelperService: MonacoHelperService,
        private readonly window: Window
    ) {}

    ngOnInit() {
        this.editorControl.valueChanges
            .pipe(
                filter((value): value is string => !!value),
                distinctUntilChanged(),
                debounceTime(500),
                tap(() => this.editorFacade.updateFileState()),
                mergeMap((value) => this.editorFacade.writeEditingFile(value)),
                untilDestroyed(this)
            )
            .subscribe();

        this.editorFacade.fileData$
            .pipe(untilDestroyed(this))
            .subscribe((fileData) => this.editorControl.patchValue(fileData));

        this.window.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();

                this.editorFacade
                    .writeEditingFile(this.editorControl.value)
                    .pipe(take(1), untilDestroyed(this))
                    .subscribe();
            }
        });
    }

    onEditorInit(editorInstance: editor.IStandaloneCodeEditor) {
        this.loading.next(false);

        this.editorFacade.monacoEditorInstance.next(editorInstance);

        if (!this.editorFacade.monacoEditorInstance.value) {
            return;
        }

        this.monacoHelperService.setupMonacoHelpers(
            this.editorFacade.monacoEditorInstance.value
        );

        this.monacoHelperService.autocompleteAction$
            .pipe(
                filter(
                    (action): action is MonacoAutocompleteCodeAction => !!action
                ),
                mergeMap((action) =>
                    this.editorFacade.getCodeAutocompletion(action)
                ),
                untilDestroyed(this)
            )
            .subscribe();
    }

    formatDocument() {
        this.editorFacade.formatDocument();
    }
}
