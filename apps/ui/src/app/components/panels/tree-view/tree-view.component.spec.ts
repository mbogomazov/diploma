import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileTreeViewComponent } from './tree-view.component';

describe('FileTreeViewComponent', () => {
    let component: FileTreeViewComponent;
    let fixture: ComponentFixture<FileTreeViewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FileTreeViewComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(FileTreeViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
