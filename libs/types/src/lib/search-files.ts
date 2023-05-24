export type SearchResult = {
    readonly content: readonly [string, string, string];
    readonly line: number;
};

export type SearchResultsByFile = {
    [filename: string]: Array<SearchResult>;
};
