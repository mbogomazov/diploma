/// <reference lib="webworker" />

import { DirectoryNode } from '@online-editor/types';

addEventListener('message', ({ data }) => {
    const { directories, curDirectory } = data;

    dfs(directories, curDirectory);

    postMessage(directories);
});

const dfs = (
    directories: Array<DirectoryNode>,
    curDirectory: DirectoryNode
) => {
    if (!('children' in curDirectory)) {
        return;
    }

    directories.push(curDirectory);

    for (const child of curDirectory.children) {
        dfs(directories, child as DirectoryNode);
    }
};
