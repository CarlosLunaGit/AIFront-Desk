import { setupWorker } from 'msw/browser';
import type { SetupWorker } from 'msw/browser';
import { handlers } from './handlers/index';
 
export const worker: SetupWorker = setupWorker(...handlers); 