import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadProjectFilesDialogComponent } from './download-project-files-dialog.component';

describe('DownloadProjectFilesDialogComponent', () => {
    let component: DownloadProjectFilesDialogComponent;
    let fixture: ComponentFixture<DownloadProjectFilesDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DownloadProjectFilesDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(DownloadProjectFilesDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
