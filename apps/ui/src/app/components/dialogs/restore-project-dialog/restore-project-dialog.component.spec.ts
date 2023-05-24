import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestoreProjectDialogComponent } from './restore-project-dialog.component';

describe('RestoreProjectDialogComponent', () => {
    let component: RestoreProjectDialogComponent;
    let fixture: ComponentFixture<RestoreProjectDialogComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [RestoreProjectDialogComponent],
        }).compileComponents();

        fixture = TestBed.createComponent(RestoreProjectDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
