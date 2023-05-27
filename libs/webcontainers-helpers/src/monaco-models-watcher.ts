import * as path from 'path';
import * as fs from 'fs';

async function getTypingsPath(
    importingFilePath: string,
    packageName: string
): Promise<string | null> {
    let currentDir = path.dirname(importingFilePath);

    while (currentDir !== path.dirname(currentDir)) {
        // until we reach the root directory
        const nodeModulePath = path.join(
            currentDir,
            'node_modules',
            packageName
        );

        if (fs.existsSync(nodeModulePath)) {
            // Look for the package.json file
            const packageJsonPath = path.join(nodeModulePath, 'package.json');

            if (!fs.existsSync(packageJsonPath)) {
                // If package.json does not exist, fallback to index.d.ts
                const fallbackTypingsPath = path.join(
                    nodeModulePath,
                    'index.d.ts'
                );
                return fs.existsSync(fallbackTypingsPath)
                    ? fallbackTypingsPath
                    : null;
            }

            // Read package.json and get typings field
            const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
            const packageJson = JSON.parse(packageJsonContent);
            const typingsField = packageJson.typings || packageJson.types;

            if (!typingsField) {
                // If no typings field, fallback to index.d.ts
                const fallbackTypingsPath = path.join(
                    nodeModulePath,
                    'index.d.ts'
                );
                return fs.existsSync(fallbackTypingsPath)
                    ? fallbackTypingsPath
                    : null;
            }

            const typingsPath = path.join(nodeModulePath, typingsField);

            return fs.existsSync(typingsPath) ? typingsPath : null;
        }

        currentDir = path.dirname(currentDir);
    }

    return null;
}

getTypingsPath(process.argv[2], process.argv[3])
    .then((typingsPath) => console.log(typingsPath ?? 'Error'))
    .catch((error) => console.log('Error'));
