import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { filter, switchMap, take, timer } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class TaskService {
    constructor(private readonly http: HttpClient) { }

    createTaskForCodeAutocompletion(codepiece: string) {
        return this.http.post<{ id: string }>('/api/task/add', {
            prompt: codepiece
        });
    }

    getTaskStatus(id: string) {
        return timer(0, 2000).pipe(
            switchMap(() => this.http.get<{ status: 'pending' | 'complete', result?: string }>(`/api/task/get-status?id=${id}`)),
            filter((response: { status: 'pending' | 'complete', result?: string }): response is { status: 'complete', result: string } => response.status === 'complete'),
            take(1)
        );
    }
}
