import 'firebase/auth';
// Firebase 13's public declarations omit this documented RN-only export.
// Metro resolves @firebase/auth's react-native condition to dist/rn/index.js.
declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: typeof import('@react-native-async-storage/async-storage').default): import('firebase/auth').Persistence;
}
