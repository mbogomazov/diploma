import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { SearchResult, SearchResultsByFile } from '@online-editor/types';

async function searchReplace(
    searchText: string,
    replaceText: string | null,
    context = 15
): Promise<SearchResultsByFile> {
    const files = glob.sync('**', { nodir: true });
    const searchResults: SearchResultsByFile = {};

    for (const file of files) {
        const content = await fs.promises.readFile(file, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const regex = new RegExp(`(${searchText})`, 'g');
            let match;
            while ((match = regex.exec(lines[i])) !== null) {
                if (match[1]) {
                    const beforeContextStart = Math.max(
                        regex.lastIndex - context - match[1].length,
                        0
                    );

                    const beforeContext = lines[i].substring(
                        beforeContextStart,
                        regex.lastIndex - match[1].length
                    );

                    const afterContext = lines[i].substring(
                        regex.lastIndex,
                        regex.lastIndex + context
                    );

                    const centralTerm = replaceText || match[1];

                    const splitContent = [
                        beforeContext,
                        centralTerm,
                        afterContext,
                    ] as const;

                    const searchResult: SearchResult = {
                        content: splitContent,
                        line: i + 1,
                    };

                    const filename = path.relative(process.cwd(), file);

                    if (searchResults[filename]) {
                        searchResults[filename].push(searchResult);
                    } else {
                        searchResults[filename] = [searchResult];
                    }
                }
            }
        }
    }

    return searchResults;
}

const search = process.argv[2];

let replace = null;

if (process.argv.length === 4) {
    replace = process.argv[3];
}

searchReplace(search, replace).then((results) => {
    console.log(JSON.stringify(results));
});
