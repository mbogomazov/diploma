import { Injectable } from '@angular/core';
import { defer } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class JsonParseService {
    private worker!: Worker;

    constructor() {
        if (typeof Worker !== 'undefined') {
            this.worker = new Worker(
                new URL('../../workers/json-parse.worker.ts', import.meta.url)
            );
        } else {
            console.warn('Web Workers are not supported in this environment.');
        }
    }

    parseJson(jsonString: string) {
        return defer(
            () =>
                new Promise((resolve, reject) => {
                    this.worker.onmessage = ({ data }) => {
                        resolve(data);
                    };

                    this.worker.onerror = (error) => {
                        reject(error);
                    };

                    this.worker.postMessage(jsonString);
                })
        );
    }
}
