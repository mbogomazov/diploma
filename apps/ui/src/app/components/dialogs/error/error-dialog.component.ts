import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
    selector: 'online-editor-error-dialog',
    templateUrl: './error-dialog.component.html',
    styleUrls: ['./error-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorDialogComponent {
    @Input() errorMsg = '';
}
