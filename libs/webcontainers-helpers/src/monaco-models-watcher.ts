import { FileLanguage, FileModelUpdate } from '@online-editor/types';
import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';

const FileModelUpdates: Array<FileModelUpdate> = [];
let timerId: NodeJS.Timeout | null = null;

const watcher = chokidar.watch(
    ['**/*.ts', '**/*.js', '**/*.json', '**/node_modules/**/index.d.ts'],
    {
        ignored: /(^|[/\\])\../,
        persistent: true,
    }
);

const fileUpdates: Array<FileModelUpdate> = [];

watcher
    .on('add', (filePath: string) => {
        const language = getFileLanguage(filePath);

        fileUpdates.push({
            action: 'created',
            path: filePath,
            language: language,
            content: fs.readFileSync(filePath, 'utf-8'),
            npmPackageFile: filePath.includes('node_modules'),
        });
        sendUpdatesIfNecessary();
    })
    .on('change', (filePath: string) => {
        const language = getFileLanguage(filePath);

        fileUpdates.push({
            action: 'updated',
            path: filePath,
            language: language,
            content: fs.readFileSync(filePath, 'utf-8'),
            npmPackageFile: filePath.includes('node_modules'),
        });
        sendUpdatesIfNecessary();
    })
    .on('unlink', (filePath: string) => {
        const language = getFileLanguage(filePath);

        fileUpdates.push({
            action: 'deleted',
            path: filePath,
            language: language,
            npmPackageFile: filePath.includes('node_modules'),
        });
        sendUpdatesIfNecessary();
    });

const sendUpdatesIfNecessary = () => {
    if (!timerId && FileModelUpdates.length > 0) {
        timerId = setInterval(() => {
            const updatesToSend = FileModelUpdates.splice(0, 10);

            sendUpdates(updatesToSend);

            if (FileModelUpdates.length === 0 && timerId) {
                clearInterval(timerId);

                timerId = null;
            }
        }, 100);
    }
};

const sendUpdates = (updates: Array<FileModelUpdate>) => {
    console.log(JSON.stringify(updates));
};

const getFileLanguage = (filePath: string): FileLanguage => {
    const ext = path.extname(filePath);
    switch (ext) {
        case '.ts':
            return 'typescript';
        case '.js':
            return 'javascript';
        case '.json':
            return 'json';
        default:
            throw new Error('Unsupported file extension: ' + ext);
    }
};
