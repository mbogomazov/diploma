import { DirectoryNode, FileNode } from '@online-editor/types';
import * as chokidar from 'chokidar';
// nx thinks it's relative import by no reason
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import * as dirTree from 'directory-tree';

let timeoutId: NodeJS.Timeout | null = null;

export const debounce = (func: () => void, delay = 1000) => {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
        func();
        timeoutId = null;
    }, delay);
};

const watcher = chokidar.watch('**/*', {
    persistent: true,
    interval: 1000,
});

watcher.on('all', () => {
    debounce(() => {
        const rootDirNode = dirTree('.') as DirectoryNode;

        console.log(JSON.stringify(sortNodes([rootDirNode])[0]));
    }, 1000);
});

const sortNodes = (
    rootNode: Array<FileNode | DirectoryNode>
): Array<FileNode | DirectoryNode> => {
    rootNode.sort((a, b) => {
        if (isDirectory(a) && isDirectory(b)) {
            return a.name.localeCompare(b.name);
        }

        if (isDirectory(a)) {
            return -1;
        }

        if (isDirectory(b)) {
            return 1;
        }

        if (a.name.length !== b.name.length) {
            return a.name.length - b.name.length;
        }

        return a.name.localeCompare(b.name);
    });

    for (const node of rootNode) {
        if (isDirectory(node)) {
            node.children = sortNodes(node.children);
        }
    }

    return rootNode;
};

export const isDirectory = (
    node: FileNode | DirectoryNode
): node is DirectoryNode => {
    return 'children' in node;
};
