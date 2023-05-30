import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

type PanelsUnion = 'files' | 'search-replace' | 'settings';

@Component({
    selector: 'online-editor-left-menu',
    templateUrl: './left-menu.component.html',
    styleUrls: ['./left-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeftMenuComponent {
    readonly currentPanel = new BehaviorSubject<PanelsUnion>('files');

    readonly items: Array<{
        panel: PanelsUnion;
        icon: string;
        selected: boolean;
    }> = [
        {
            panel: 'files',
            icon: 'file-text-outline',
            selected: true,
        },
        {
            panel: 'search-replace',
            icon: 'search-outline',
            selected: false,
        },
    ];

    selectPanel(panel: PanelsUnion) {
        this.currentPanel.next(panel);
    }
}
