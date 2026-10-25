/** Stub for `@/lib/storage/server`. Throws if called — see firebase-admin.mjs. */
export const deleteObject = () => {
  throw new Error('A unit test called deleteObject(). These tests must not touch Storage.');
};
export const STORAGE_PATHS = {};
export const storageBucketName = () => 'test-bucket';
