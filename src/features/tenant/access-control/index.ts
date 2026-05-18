/**
 * src/features/access-control/index.ts
 *
 * Giữ lại: permissions.ts, policies.ts, useCan hook, Can component — vì đây là domain logic thực sự
 */
export * from './permissions';
export * from './policies';
export * from './hooks/use-can';
export { Can } from './components/can';
export * from './query/use-access-control';
