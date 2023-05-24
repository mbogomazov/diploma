import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFileFolderComponent } from './add-file-folder.component';

describe('AddFileFolderComponent', () => {
    let component: AddFileFolderComponent;
    let fixture: ComponentFixture<AddFileFolderComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddFileFolderComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(AddFileFolderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
