import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnInit,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { debounceTime, filter, map, tap } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { EditorFacadeService } from '../../facades/editor/editor-facade.service';
import { WebcontainersService } from '../../services/webcontainers/webcontainers.service';
import { MonacoHelperService } from '../../services/monaco-helper/monaco-helper.service';
import { FileModelUpdate } from '@online-editor/types';

declare const monaco: any;

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

    readonly form = new FormGroup({
        editor: new FormControl(),
    });

    readonly options$ = this.editorFacade.options$;

    readonly openedFileName = this.editorFacade.currentOpenedFilePath$.pipe(
        map((filepath) => (filepath ? filepath.split('/').slice(-1) : '...'))
    );

    readonly currentModel$ = this.editorFacade.currentModel$;

    get editorControl() {
        return this.form.controls.editor;
    }

    constructor(
        private readonly editorFacade: EditorFacadeService,
        private readonly webcontainersService: WebcontainersService,
        private readonly monacoHelperService: MonacoHelperService,
        private readonly window: Window
    ) {}

    ngOnInit() {
        this.editorControl.valueChanges
            .pipe(
                filter((value): value is string => !!value),
                debounceTime(500),
                untilDestroyed(this)
            )
            .subscribe((value) => {
                this.editorFacade.writeEditingFile(value);
            });

        this.editorFacade.fileData$
            .pipe(untilDestroyed(this))
            .subscribe((fileData) => this.editorControl.patchValue(fileData));

        this.window.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();

                this.editorFacade.writeEditingFile(this.editorControl.value);
            }
        });
    }

    onEditorInit(editorInstance: any) {
        this.editorFacade.monacoEditorInstance.next(editorInstance);

        this.addCodeAutocompleteAction();

        this.webcontainersService.monacoModelsChanges$
            .pipe(
                filter(
                    (updates): updates is Array<FileModelUpdate> => !!updates
                ),
                tap((updates) =>
                    this.monacoHelperService.processModelsUpdate(updates)
                ),
                untilDestroyed(this)
            )
            .subscribe();

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2016,
            allowNonTsExtensions: true,
            moduleResolution:
                monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            typeRoots: ['node_modules/@types'],
            baseUrl: './',
        });

        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);

        monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
    }

    private addCodeAutocompleteAction() {
        const KeyCode = monaco.KeyCode;

        monaco.editor.addEditorAction({
            id: 'autocomplete-code',
            label: 'Autocomplete code',
            keybindings: [monaco.KeyMod.CtrlCmd | KeyCode.Enter],
            precondition: null,
            keybindingContext: null,
            contextMenuOrder: 2,
            contextMenuGroupId: '1_modification',

            run: (ed: any) => {
                const selection = ed.getSelection();
                const model = ed.getModel();

                const lineNumber = selection.startLineNumber;

                if (selection && model.getValueInRange(selection)) {
                    this.editorFacade.getCodeAutocompletion(
                        model.getValueInRange(selection),
                        lineNumber + 1
                    );

                    return null;
                }

                this.editorFacade.getCodeAutocompletion(
                    model.getLineContent(lineNumber),
                    lineNumber + 1
                );

                return null;
            },
        });
    }
}
