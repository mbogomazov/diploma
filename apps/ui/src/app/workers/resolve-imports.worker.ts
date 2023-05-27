/// <reference lib="webworker" />
import * as ts from 'typescript';

addEventListener('message', ({ data }) => {
    const { fileName, fileData } = data;

    const scriptKind = fileName.endsWith('.ts')
        ? ts.ScriptKind.TS
        : ts.ScriptKind.JS;

    const sourceFile = ts.createSourceFile(
        fileName,
        fileData,
        ts.ScriptTarget.Latest,
        true,
        scriptKind
    );

    const npmImports: string[] = [];
    const localImports: string[] = [];

    const visit = (node: ts.Node) => {
        if (
            ts.isImportDeclaration(node) ||
            (ts.isCallExpression(node) &&
                node.expression.getText(sourceFile) === 'require')
        ) {
            const moduleSpecifier =
                'moduleSpecifier' in node
                    ? (node.moduleSpecifier as ts.StringLiteral).text
                    : (node.arguments[0] as ts.StringLiteral).text;

            if (
                moduleSpecifier.startsWith('./') ||
                moduleSpecifier.startsWith('../')
            ) {
                localImports.push(moduleSpecifier);
            } else {
                npmImports.push(moduleSpecifier);
            }
        }

        ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    postMessage({ npmImports, localImports });
});
