import * as chokidar from 'chokidar';

const watcher = chokidar.watch('**/*', {
    persistent: true,
    interval: 100,
    ignored: /(^|[\/\\])node_modules[\/\\].*/,
});

watcher.on('all', (event, path) => {
    console.log(event, path);
});
