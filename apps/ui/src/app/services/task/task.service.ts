import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    GetResultCompoleteDto,
    GetResultDto,
    GetTaskIdDto,
} from '@online-editor/types';
import { filter, switchMap, take, timer } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class TaskService {
    constructor(private readonly http: HttpClient) {}

    createTaskForCodeAutocompletion(codepiece: string) {
        return this.http.post<GetTaskIdDto>('/api/add-task', {
            prompt: codepiece,
        });
    }

    getTaskStatus(id: string) {
        return timer(0, 2000).pipe(
            switchMap(() =>
                this.http.get<GetResultDto>(`/api/get-status?id=${id}`)
            ),
            filter(
                (response: GetResultDto): response is GetResultCompoleteDto =>
                    response.status === 'complete'
            ),
            take(1)
        );
    }
}
