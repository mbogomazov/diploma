export type FileAction = 'created' | 'updated' | 'deleted';
export type FileLanguage = 'typescript' | 'javascript' | 'json';

export type FileModelUpdate = {
    readonly action: FileAction;
    readonly path: string;
    readonly language: FileLanguage;
    readonly content?: string;
    readonly npmPackageFile?: boolean;
};
