import { Component, Input } from '@angular/core';

@Component({
    selector: 'online-editor-error-dialog',
    templateUrl: './error-dialog.component.html',
    styleUrls: ['./error-dialog.component.scss'],
})
export class ErrorDialogComponent {
    @Input() errorMsg = '';
}
