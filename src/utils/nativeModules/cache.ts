import { NativeModules, Platform } from 'react-native'

const { CacheModule } = NativeModules

export const getAppCacheSize = Platform.OS === 'android'
  ? async(): Promise<number> => CacheModule.getAppCacheSize().then((size: number) => Math.trunc(size))
  : async() => 0

export const clearAppCache = Platform.OS === 'android'
  ? CacheModule.clearAppCache as () => Promise<void>
  : async() => {}
