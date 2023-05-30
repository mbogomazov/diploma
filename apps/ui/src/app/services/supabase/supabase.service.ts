import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { defer, map } from 'rxjs';
import { environment } from './supabase.config';

@Injectable({
    providedIn: 'root',
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(
            environment.supabaseUrl,
            environment.supabaseKey
        );
    }

    uploadFile(blob: Blob, filename: string) {
        return defer(() =>
            this.supabase.storage.from('projects').upload(filename, blob)
        ).pipe(
            map(({ data, error }) => {
                if (error) {
                    throw new Error(error.message);
                }

                return data.path;
            })
        );
    }

    downloadFile(filename: string) {
        return defer(() =>
            this.supabase.storage.from('projects').download(`${filename}.zip`)
        ).pipe(
            map(({ data, error }) => {
                if (error) {
                    throw new Error(error.message);
                }

                return data;
            })
        );
    }
}
