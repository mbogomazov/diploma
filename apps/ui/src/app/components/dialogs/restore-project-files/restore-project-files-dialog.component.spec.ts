import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestoreProjectFilesDialogComponent } from './restore-project-files-dialog.component';

describe('RestoreProjectFilesDialogComponent', () => {
    let component: RestoreProjectFilesDialogComponent;
    let fixture: ComponentFixture<RestoreProjectFilesDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RestoreProjectFilesDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(RestoreProjectFilesDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
