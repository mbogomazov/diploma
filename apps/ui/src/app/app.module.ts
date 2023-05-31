import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TreeModule } from '@circlon/angular-tree-component';
import { NgTerminalModule } from 'ng-terminal';
import { AngularSplitModule } from 'angular-split';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';

import { AppComponent } from './components/app/app.component';
import { appRoutes } from './routing/app.routes';
import { PreviewComponent } from './components/preview/preview.component';
import { EditorComponent } from './components/editor/editor.component';
import { TerminalComponent } from './components/terminal/terminal.component';
import { FileTreeViewComponent } from './components/panels/tree-view/tree-view.component';
import {
    NbAccordionModule,
    NbAlertModule,
    NbButtonModule,
    NbCardModule,
    NbDialogModule,
    NbIconModule,
    NbInputModule,
    NbLayoutModule,
    NbListModule,
    NbMenuModule,
    NbSpinnerModule,
    NbThemeModule,
    NbToastrModule,
} from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { HeaderComponent } from './components/header/header.component';
import { SearchPanelComponent } from './components/panels/search/search-panel.component';
import { ErrorDialogComponent } from './components/dialogs/error/error-dialog.component';
import { NgxIndexedDBModule } from 'ngx-indexed-db';
import { fileDbConfig } from './services/files-storage/files-storage.service';
import { RestoreProjectDialogComponent } from './components/dialogs/restore-project-dialog/restore-project-dialog.component';
import { AddFileFolderComponent } from './components/dialogs/add-file-folder/add-file-folder.component';
import { LeftMenuComponent } from './components/left-menu/left-menu.component';
import { MainComponent } from './components/main/main.component';
import { LoadingPopupDialogComponent } from './components/dialogs/download-project-files/loading-popup-dialog.component';
import { DeleteFileFolderComponent } from './components/dialogs/delete-file/delete-file-folder.component';

@NgModule({
    declarations: [
        AppComponent,
        PreviewComponent,
        EditorComponent,
        TerminalComponent,
        FileTreeViewComponent,
        HeaderComponent,
        SearchPanelComponent,
        ErrorDialogComponent,
        RestoreProjectDialogComponent,
        AddFileFolderComponent,
        LeftMenuComponent,
        MainComponent,
        LoadingPopupDialogComponent,
        DeleteFileFolderComponent,
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

        NbThemeModule.forRoot({ name: 'dark' }),
        NbMenuModule.forRoot(),
        NbDialogModule.forRoot(),
        NbToastrModule.forRoot(),
        NgxIndexedDBModule.forRoot(fileDbConfig),
        NbLayoutModule,
        NbListModule,
        NbCardModule,
        NbInputModule,
        NbAccordionModule,
        NbAlertModule,
        NbEvaIconsModule,
        NbIconModule,
        NbButtonModule,
        NbSpinnerModule,
    ],
    bootstrap: [AppComponent],
})
export class AppModule {}
