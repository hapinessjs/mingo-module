import { InjectionToken } from '@hapiness/core';

export const MINGO_MODULE_CONFIG = new InjectionToken('mingo_module_config');

export interface MingoConfig {
    db?: {
        connectionName: string;
        maxRetryAttempts?: number;
        maxRetryAttemptsNotAuthError?: number;
    }
}
