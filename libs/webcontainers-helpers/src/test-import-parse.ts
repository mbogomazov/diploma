import * as ts from 'typescript';

function getImports(sourceFile: ts.SourceFile) {
    const imports: string[] = [];

    function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node)) {
            imports.push((node.moduleSpecifier as ts.StringLiteral).text);
        }
        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return imports;
}

// usage
const sourceCode = `
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { TestComponent } from './test.component';

@NgModule({
  declarations: [
    AppComponent,
    TestComponent
  ],
  imports: [
    BrowserModule,
    RouterModule.forRoot([
      { path: 'app', component: AppComponent},
      { path: 'test', component: TestComponent},
      { path: '**', redirectTo: 'app' }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent, TestComponent]
})
export class AppModule { }

`;

const sourceFile = ts.createSourceFile(
    'temp.ts',
    sourceCode,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
);
console.log(getImports(sourceFile)); // output: [ 'fs', 'path' ]
