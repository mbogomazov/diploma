export type FileAction = 'created' | 'updated' | 'deleted';

export type FileModelUpdate = {
    readonly action: FileAction;
    readonly path: string;
    readonly content?: string;
    readonly npmPackageFile?: boolean;
};
