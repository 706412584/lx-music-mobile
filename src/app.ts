import '@/utils/errorHandle'
import { init as initLog } from '@/utils/log'
import { bootLog, getBootLog } from '@/utils/bootLog'
import '@/config/globalData'
import { getFontSize } from '@/utils/data'
import { exitApp } from './utils/nativeModules/utils'
import { windowSizeTools } from './utils/windowSizeTools'
import { listenLaunchEvent } from './navigation/regLaunchedEvent'
import { tipDialog } from './utils/tools'
import { Platform } from 'react-native'

console.log('starting app...')
listenLaunchEvent()

void Promise.all([getFontSize(), windowSizeTools.init()]).then(async([fontSize]) => {
  global.lx.fontSize = fontSize
  bootLog('Font size setting loaded.')
  if (Platform.OS === 'ios') console.log('✓ Font size setting loaded')

  let isInited = false
  let handlePushedHomeScreen: () => void | Promise<void>

  const tryGetBootLog = () => {
    try {
      return getBootLog()
    } catch (err) {
      return 'Get boot log failed.'
    }
  }

  const handleInit = async() => {
    if (isInited) return
    void initLog()
    if (Platform.OS === 'ios') console.log('✓ Log initialized')
    
    const { default: init } = await import('@/core/init')
    if (Platform.OS === 'ios') console.log('✓ Init module loaded')
    
    try {
      handlePushedHomeScreen = await init()
      if (Platform.OS === 'ios') console.log('✓ Init completed successfully')
    } catch (err: any) {
      if (Platform.OS === 'ios') {
        console.error('❌ Init failed:', err)
        console.error('Boot Log:', tryGetBootLog())
      }
      void tipDialog({
        title: '初始化失败 (Init Failed)',
        message: `Boot Log:\n${tryGetBootLog()}\n\n${(err.stack ?? err.message) as string}`,
        btnText: 'Exit',
        bgClose: false,
      }).then(() => {
        exitApp()
      })
      return
    }
    isInited ||= true
  }
  const { init: initNavigation, navigations } = await import('@/navigation')
  if (Platform.OS === 'ios') console.log('✓ Navigation module loaded')

  initNavigation(async() => {
    if (Platform.OS === 'ios') console.log('→ Starting navigation initialization...')
    
    await handleInit()
    if (!isInited) {
      if (Platform.OS === 'ios') console.error('❌ Init not completed')
      return
    }
    if (Platform.OS === 'ios') console.log('✓ Init completed, pushing home screen...')
    
    // import('@/utils/nativeModules/cryptoTest')

    await navigations.pushHomeScreen().then(() => {
      if (Platform.OS === 'ios') console.log('✓ Home screen pushed successfully')
      void handlePushedHomeScreen()
    }).catch((err: any) => {
      if (Platform.OS === 'ios') {
        console.error('❌ Failed to push home screen:', err)
      }
      void tipDialog({
        title: 'Error',
        message: err.message,
        btnText: 'Exit',
        bgClose: false,
      }).then(() => {
        exitApp()
      })
    })
  })
}).catch((err) => {
  if (Platform.OS === 'ios') {
    console.error('❌ App initialization failed:', err)
  }
  void tipDialog({
    title: '初始化失败 (Init Failed)',
    message: `Boot Log:\n\n${(err.stack ?? err.message) as string}`,
    btnText: 'Exit',
    bgClose: false,
  }).then(() => {
    exitApp()
  })
})
