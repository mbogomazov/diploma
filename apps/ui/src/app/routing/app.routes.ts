import { Route } from '@angular/router';
import { MainComponent } from '../components/main/main.component';

export const appRoutes: Route[] = [
    {
        path: '',
        component: MainComponent,
        children: [
            {
                path: 'p/:filename',
                component: MainComponent,
            },
        ],
    },
];
