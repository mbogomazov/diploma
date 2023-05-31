const path = require('path');

module.exports = [{
    entry: './src/chokidar.ts',
    target: 'node',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'chokidar.js',
        path: path.resolve(__dirname, 'dist'),
    },
    externals: {
        fsevents: "require('fsevents')",
    },
}, {
    entry: './src/search-file-content.ts',
    target: 'node',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'search-file-content.js',
        path: path.resolve(__dirname, 'dist'),
    },
    externals: {
        fsevents: "require('fsevents')",
    },
},
{
    entry: './src/monaco-models-watcher.ts',
    target: 'node',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'monaco-models-watcher.js',
        path: path.resolve(__dirname, 'dist'),
    },
    externals: {
        fsevents: "require('fsevents')",
    },
}
]
