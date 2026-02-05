import { useEffect } from 'react'
import { BackHandler, Platform } from 'react-native'

export function useBackHandler(handler: () => boolean) {
  useEffect(() => {
    if (Platform.OS !== 'android') return // iOS没有硬件返回键
    
    BackHandler.addEventListener('hardwareBackPress', handler)

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handler)
    }
  }, [handler])
}
