import {
    ChangeDetectionStrategy,
    Component,
    HostListener,
} from '@angular/core';
import { NbIconLibraries } from '@nebular/theme';
import { EditorFacadeService } from '../../facades/editor/editor-facade.service';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ActivatedRoute } from '@angular/router';

@UntilDestroy()
@Component({
    selector: 'online-editor-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
    constructor(private readonly iconLibraries: NbIconLibraries) {
        this.iconLibraries.registerSvgPack('custom', {
            prettier: '<img src="assets/prettier.svg" width="20px">',
        });
    }

    @HostListener('window:beforeunload', ['$event'])
    leaveSiteConfirm($event: any) {
        $event.preventDefault();
        $event.returnValue = true;
    }
}
