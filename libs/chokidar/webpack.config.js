const path = require('path');

module.exports = {
    entry: './src/index.ts',
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
};
