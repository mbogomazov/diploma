import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, debounceTime, filter, mergeMap, tap } from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { WebcontainersService } from '../../../services/webcontainers/webcontainers.service';
import { SearchResultsByFile } from '@online-editor/types';

@UntilDestroy()
@Component({
    selector: 'online-editor-search-panel',
    templateUrl: './search-panel.component.html',
    styleUrls: ['./search-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPanelComponent implements OnInit {
    readonly results = new BehaviorSubject<string | null>(null);
    readonly loading = new BehaviorSubject<boolean>(false);

    constructor(private readonly webcontainersService: WebcontainersService) {}

    form = new FormGroup({
        search: new FormControl(),
        replace: new FormControl(),
    });

    ngOnInit() {
        this.form.controls.search.valueChanges
            .pipe(
                filter((value): value is string => !!value),
                debounceTime(500),
                tap(() => this.loading.next(true)),
                mergeMap((value) =>
                    this.webcontainersService.searchFileContent(value)
                ),
                untilDestroyed(this)
            )
            .subscribe();

        this.webcontainersService.searchFileContentResult$
            .pipe(
                filter(
                    (result): result is Array<SearchResultsByFile> => !!result
                ),
                untilDestroyed(this)
            )
            .subscribe((value) => {
                this.loading.next(false);
                console.log(value);
            });
    }
}
