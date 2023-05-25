import { Injectable } from '@angular/core';
import { FileModelUpdate } from '@online-editor/types';

declare const monaco: any;

@Injectable({
    providedIn: 'root',
})
export class MonacoHelperService {
    extraLibs: Record<string, { content?: string; disposable: any }> = {};

    processModelsUpdate(updates: Array<FileModelUpdate>) {
        for (const update of updates) {
            const filePath = update.path;

            if (update.action === 'created') {
                if (update.npmPackageFile) {
                    const content = update.content;

                    const disposable =
                        monaco.languages.typescript.javascriptDefaults.addExtraLib(
                            content,
                            filePath
                        );

                    monaco.languages.typescript.typescriptDefaults.addExtraLib(
                        content,
                        filePath
                    );

                    this.extraLibs[filePath] = { content, disposable };
                }

                const existingModel = monaco.editor.getModel(
                    monaco.Uri.file(filePath)
                );

                if (existingModel) {
                    existingModel.setValue(update.content);

                    continue;
                }

                monaco.editor.createModel(
                    update.content,
                    update.language,
                    monaco.Uri.file(filePath)
                );
            }

            if (update.action === 'updated') {
                const model = monaco.editor.getModel(monaco.Uri.file(filePath));

                if (!model) {
                    continue;
                }

                model.setValue(update.content);
            }

            if (update.action === 'deleted') {
                if (update.npmPackageFile) {
                    const uri = update.path;

                    this.extraLibs[uri].disposable.dispose();

                    continue;
                }

                const model = monaco.editor.getModel(monaco.Uri.file(filePath));

                if (!model) {
                    continue;
                }

                model.dispose();
            }
        }
    }
}
