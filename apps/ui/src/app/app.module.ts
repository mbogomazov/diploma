import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { TreeModule } from '@circlon/angular-tree-component';
import { NgTerminalModule } from 'ng-terminal';
import { AngularSplitModule } from 'angular-split';
import { MonacoEditorModule } from 'ngx-monaco-editor-emmet';

import { AppComponent } from './app.component';
import { appRoutes } from './app.routes';
import { SafePipe } from './safe.pipe';
import { PreviewComponent } from './components/preview/preview.component';
import { EditorComponent } from './components/editor/editor.component';
import { TerminalComponent } from './components/terminal/terminal.component';
import { TreeViewComponent } from './components/tree-view/tree-view.component';
import {
    NbButtonModule,
    NbCardModule,
    NbIconModule,
    NbLayoutModule,
    NbSpinnerModule,
    NbThemeModule,
} from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { HeaderComponent } from './components/header/header.component';

@NgModule({
    declarations: [
        AppComponent,
        SafePipe,
        PreviewComponent,
        EditorComponent,
        TerminalComponent,
        TreeViewComponent,
        HeaderComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule.forRoot(appRoutes, {
            initialNavigation: 'enabledBlocking',
        }),
        HttpClientModule,

        MonacoEditorModule.forRoot(),
        NgTerminalModule,
        TreeModule,
        AngularSplitModule,

        NbThemeModule.forRoot({ name: 'default' }),
        NbLayoutModule,
        NbCardModule,
        NbEvaIconsModule,
        NbIconModule,
        NbButtonModule,
        NbSpinnerModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
