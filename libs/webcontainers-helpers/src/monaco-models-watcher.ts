import * as path from 'path';
import * as fs from 'fs/promises';
import { TypingsPathsType } from '@online-editor/types';

async function getTypingsPaths(
    importingFilePath: string,
    packageNames: Array<string>
): Promise<string> {
    const result: TypingsPathsType = [];

    for (const packageName of packageNames) {
        let currentDir = path.dirname(importingFilePath);

        while (currentDir !== path.dirname(currentDir)) {
            const nodeModulePath = path.join(
                currentDir,
                'node_modules',
                packageName
            );

            try {
                await fs.access(nodeModulePath);

                const packageJsonPath = path.join(
                    nodeModulePath,
                    'package.json'
                );

                let typingsPath;

                try {
                    const packageJsonContent = await fs.readFile(
                        packageJsonPath,
                        'utf8'
                    );

                    const packageJson = JSON.parse(packageJsonContent);
                    const typingsField =
                        packageJson.typings || packageJson.types;

                    typingsPath = typingsField
                        ? path.join(nodeModulePath, typingsField)
                        : path.join(nodeModulePath, 'index.d.ts');

                    await fs.access(typingsPath);
                } catch (error) {
                    // if package.json doesn't exist or no typings field, fallback to index.d.ts
                    typingsPath = path.join(nodeModulePath, 'index.d.ts');

                    try {
                        await fs.access(typingsPath);
                    } catch (error) {
                        // if index.d.ts also doesn't exist
                        typingsPath = null;
                    }
                }

                result.push({
                    packageName,
                    packagePath: typingsPath,
                });

                break; // when typingsPath found, break the loop
            } catch (error) {
                // no such package in the current node_modules directory
                currentDir = path.dirname(currentDir);
                continue;
            }
        }

        if (!result.find((item) => item.packageName === packageName)) {
            result.push({
                packageName,
                packagePath: null,
            });
        }
    }

    return JSON.stringify(result);
}

getTypingsPaths(process.argv[2], process.argv[3].split(','))
    .then((typingsPaths) => console.log(typingsPaths ?? 'Error'))
    .catch(() => console.log('Error'));
