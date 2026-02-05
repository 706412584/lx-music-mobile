import { AppState, NativeEventEmitter, NativeModules, Platform } from 'react-native'

const UtilsModule = Platform.OS === 'android' ? NativeModules.UtilsModule : null

export const exitApp = Platform.OS === 'android' ? UtilsModule.exitApp : () => {}

export const getSupportedAbis = Platform.OS === 'android' ? UtilsModule.getSupportedAbis : () => []

export const installApk = Platform.OS === 'android' 
  ? (filePath: string, fileProviderAuthority: string) => UtilsModule.installApk(filePath, fileProviderAuthority)
  : () => Promise.resolve()


export const screenkeepAwake = () => {
  if (Platform.OS !== 'android') return
  if (global.lx.isScreenKeepAwake) return
  global.lx.isScreenKeepAwake = true
  UtilsModule.screenkeepAwake()
}
export const screenUnkeepAwake = () => {
  if (Platform.OS !== 'android') return
  // console.log('screenUnkeepAwake')
  if (!global.lx.isScreenKeepAwake) return
  global.lx.isScreenKeepAwake = false
  UtilsModule.screenUnkeepAwake()
}

export const getWIFIIPV4Address = Platform.OS === 'android' 
  ? UtilsModule.getWIFIIPV4Address as () => Promise<string>
  : () => Promise.resolve('127.0.0.1')

export const getDeviceName = async(): Promise<string> => {
  if (Platform.OS !== 'android') return 'iOS Device'
  return UtilsModule.getDeviceName().then((deviceName: string) => deviceName || 'Unknown')
}

export const isNotificationsEnabled = Platform.OS === 'android'
  ? UtilsModule.isNotificationsEnabled as () => Promise<boolean>
  : () => Promise.resolve(true)

export const requestNotificationPermission = Platform.OS === 'android' 
  ? async() => new Promise<boolean>((resolve) => {
      let subscription = AppState.addEventListener('change', (state) => {
        if (state != 'active') return
        subscription.remove()
        setTimeout(() => {
          void isNotificationsEnabled().then(resolve)
        }, 1000)
      })
      UtilsModule.openNotificationPermissionActivity().then((result: boolean) => {
        if (result) return
        subscription.remove()
        resolve(false)
      })
    })
  : () => Promise.resolve(true)

export const shareText = Platform.OS === 'android'
  ? async(shareTitle: string, title: string, text: string): Promise<void> => {
      UtilsModule.shareText(shareTitle, title, text)
    }
  : async() => {}

export const getSystemLocales = Platform.OS === 'android'
  ? async(): Promise<string> => {
      return UtilsModule.getSystemLocales()
    }
  : async() => {
      // iOS: 返回默认语言，格式为 en_us
      // 可以根据系统语言返回对应的语言代码
      return 'zh_cn' // 默认中文
    }

export const onScreenStateChange = Platform.OS === 'android'
  ? (handler: (state: 'ON' | 'OFF') => void): () => void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const eventEmitter = new NativeEventEmitter(UtilsModule)
      const eventListener = eventEmitter.addListener('screen-state', event => {
        handler(event.state as 'ON' | 'OFF')
      })

      return () => {
        eventListener.remove()
      }
    }
  : () => () => {}

export const getWindowSize = Platform.OS === 'android'
  ? async(): Promise<{ width: number, height: number }> => {
      return UtilsModule.getWindowSize()
    }
  : async() => ({ width: 375, height: 667 })

export const onWindowSizeChange = Platform.OS === 'android'
  ? (handler: (size: { width: number, height: number }) => void): () => void => {
      UtilsModule.listenWindowSizeChanged()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const eventEmitter = new NativeEventEmitter(UtilsModule)
      const eventListener = eventEmitter.addListener('screen-size-changed', event => {
        handler(event as { width: number, height: number })
      })

      return () => {
        eventListener.remove()
      }
    }
  : () => () => {}

export const isIgnoringBatteryOptimization = Platform.OS === 'android'
  ? async(): Promise<boolean> => {
      return UtilsModule.isIgnoringBatteryOptimization()
    }
  : () => Promise.resolve(true)

export const requestIgnoreBatteryOptimization = Platform.OS === 'android'
  ? async() => new Promise<boolean>((resolve) => {
      let subscription = AppState.addEventListener('change', (state) => {
        if (state != 'active') return
        subscription.remove()
        setTimeout(() => {
          void isIgnoringBatteryOptimization().then(resolve)
        }, 1000)
      })
      UtilsModule.requestIgnoreBatteryOptimization().then((result: boolean) => {
        if (result) return
        subscription.remove()
        resolve(false)
      })
    })
  : () => Promise.resolve(true)
