import {
    AfterContentInit,
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
    BehaviorSubject,
    debounceTime,
    filter,
    map,
    mergeMap,
    tap,
} from 'rxjs';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SearchResult, SearchResultsByFile } from '@online-editor/types';

import { EditorFacadeService } from '../../../facades/editor/editor-facade.service';

@UntilDestroy()
@Component({
    selector: 'online-editor-search-panel',
    templateUrl: './search-panel.component.html',
    styleUrls: ['./search-panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPanelComponent implements OnInit, AfterContentInit {
    @ViewChild('parentElem', { read: ElementRef })
    private parentTreeElem?: ElementRef;

    readonly results = new BehaviorSubject<Array<
        [string, Array<SearchResult>]
    > | null>(null);

    readonly loading = new BehaviorSubject<boolean>(false);

    readonly resultsLength$ = this.results.pipe(
        map((value) => (value ? Object.keys(value).length : 0))
    );

    readonly bodyContainerHeight = new BehaviorSubject<number | null>(null);

    constructor(
        private readonly editorFacade: EditorFacadeService,
        private readonly changeDetectorRef: ChangeDetectorRef
    ) {}

    form = new FormGroup({
        search: new FormControl(),
        replace: new FormControl(),
    });

    ngOnInit() {
        this.form.controls.search.valueChanges
            .pipe(
                filter((value): value is string => !!value),
                debounceTime(1000),
                tap(() => this.loading.next(true)),
                mergeMap((searchingFileContent) =>
                    this.editorFacade.searchFileContent(searchingFileContent)
                ),
                untilDestroyed(this)
            )
            .subscribe();

        this.editorFacade.searchFileContentResult$
            .pipe(
                filter((result): result is SearchResultsByFile => !!result),
                untilDestroyed(this)
            )
            .subscribe((value) => {
                this.loading.next(false);

                this.results.next(Object.entries(value));
            });
    }

    ngAfterContentInit() {
        if (!this.parentTreeElem) {
            return;
        }

        this.bodyContainerHeight.next(
            // parent container - header height + padding
            this.parentTreeElem.nativeElement.clientHeight - 57 + 5
        );

        this.changeDetectorRef.detectChanges();
    }

    openSearchResult(filePath: string, selectedSearchResult: SearchResult) {
        this.editorFacade.openFile(filePath, selectedSearchResult.line);
    }
}
