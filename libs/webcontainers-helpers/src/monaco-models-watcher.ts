import * as path from 'path';
import * as fs from 'fs';
import { TypingsPathsType } from '@online-editor/types';

async function getTypingsPaths(
    importingFilePath: string,
    packageNames: Array<string>
): Promise<string> {
    const result: TypingsPathsType = [];

    for (const packageName of packageNames) {
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
                const packageJsonPath = path.join(
                    nodeModulePath,
                    'package.json'
                );

                if (!fs.existsSync(packageJsonPath)) {
                    // If package.json does not exist, fallback to index.d.ts
                    const fallbackTypingsPath = path.join(
                        nodeModulePath,
                        'index.d.ts'
                    );

                    result.push({
                        packageName,
                        packagePath: fs.existsSync(fallbackTypingsPath)
                            ? fallbackTypingsPath
                            : null,
                    });

                    continue;
                }

                // Read package.json and get typings field
                const packageJsonContent = fs.readFileSync(
                    packageJsonPath,
                    'utf8'
                );
                const packageJson = JSON.parse(packageJsonContent);
                const typingsField = packageJson.typings || packageJson.types;

                if (!typingsField) {
                    // If no typings field, fallback to index.d.ts
                    const fallbackTypingsPath = path.join(
                        nodeModulePath,
                        'index.d.ts'
                    );

                    result.push({
                        packageName,
                        packagePath: fs.existsSync(fallbackTypingsPath)
                            ? fallbackTypingsPath
                            : null,
                    });

                    continue;
                }

                const typingsPath = path.join(nodeModulePath, typingsField);

                result.push({
                    packageName,
                    packagePath: fs.existsSync(typingsPath)
                        ? typingsPath
                        : null,
                });

                continue;
            }

            currentDir = path.dirname(currentDir);
        }

        result.push({
            packageName,
            packagePath: null,
        });
    }

    return JSON.stringify(result);
}

getTypingsPaths(process.argv[2], process.argv[3].split(','))
    .then((typingsPaths) => console.log(typingsPaths ?? 'Error'))
    .catch(() => console.log('Error'));
