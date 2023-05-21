import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

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
import { TreeViewComponent } from './components/panels/tree-view/tree-view.component';
import {
    NbAlertModule,
    NbButtonModule,
    NbCardModule,
    NbDialogModule,
    NbIconModule,
    NbLayoutModule,
    NbMenuModule,
    NbSpinnerModule,
    NbThemeModule,
    NbToastrModule,
} from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { HeaderComponent } from './components/header/header.component';
import { SearchPanelComponent } from './components/panels/search/search-panel.component';
import { ErrorDialogComponent } from './components/error-dialog/error-dialog.component';
import { NgxIndexedDBModule } from 'ngx-indexed-db';
import { fileDbConfig } from './services/files-storage/files-storage.service';

@NgModule({
    declarations: [
        AppComponent,
        SafePipe,
        PreviewComponent,
        EditorComponent,
        TerminalComponent,
        TreeViewComponent,
        HeaderComponent,
        SearchPanelComponent,
        ErrorDialogComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
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
        NbMenuModule.forRoot(),
        NbDialogModule.forRoot(),
        NbToastrModule.forRoot(),
        NgxIndexedDBModule.forRoot(fileDbConfig),
        NbLayoutModule,
        NbCardModule,
        NbAlertModule,
        NbEvaIconsModule,
        NbIconModule,
        NbButtonModule,
        NbSpinnerModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule { }
