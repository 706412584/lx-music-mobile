import '@/utils/errorHandle'
import { init as initLog } from '@/utils/log'
import { bootLog, getBootLog } from '@/utils/bootLog'
import '@/config/globalData'
import { getFontSize } from '@/utils/data'
import { exitApp } from './utils/nativeModules/utils'
import { windowSizeTools } from './utils/windowSizeTools'
import { listenLaunchEvent } from './navigation/regLaunchedEvent'
import { tipDialog } from './utils/tools'
import { Platform, Alert } from 'react-native'

console.log('starting app...')
listenLaunchEvent()

// iOS 应用启动步骤追踪
let iosAppSteps: string[] = []
const trackIOSStep = (step: string) => {
  if (Platform.OS !== 'ios') return
  iosAppSteps.push(step)
  console.log(`iOS App: ${step}`)
}

void Promise.all([getFontSize(), windowSizeTools.init()]).then(async([fontSize]) => {
  trackIOSStep('✓ 加载字体大小设置')
  global.lx.fontSize = fontSize
  bootLog('Font size setting loaded.')

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
    trackIOSStep('→ 开始初始化日志系统')
    void initLog()
    
    trackIOSStep('→ 加载初始化模块')
    const { default: init } = await import('@/core/init')
    trackIOSStep('✓ 初始化模块加载完成')
    
    try {
      trackIOSStep('→ 执行核心初始化')
      handlePushedHomeScreen = await init()
      trackIOSStep('✓ 核心初始化完成')
    } catch (err: any) {
      trackIOSStep(`❌ 初始化失败: ${err.message}`)
      
      if (Platform.OS === 'ios') {
        Alert.alert(
          '应用初始化失败',
          `启动步骤:\n${iosAppSteps.join('\n')}\n\nBoot Log:\n${tryGetBootLog()}\n\n错误:\n${err.message}`,
          [
            {
              text: '查看详细错误',
              onPress: () => {
                Alert.alert('详细错误信息', err.stack || err.message, [{ text: '确定' }])
              }
            },
            { text: '退出', onPress: () => exitApp() }
          ]
        )
      } else {
        void tipDialog({
          title: '初始化失败 (Init Failed)',
          message: `Boot Log:\n${tryGetBootLog()}\n\n${(err.stack ?? err.message) as string}`,
          btnText: 'Exit',
          bgClose: false,
        }).then(() => {
          exitApp()
        })
      }
      return
    }
    isInited ||= true
  }
  
  trackIOSStep('→ 加载导航模块')
  const { init: initNavigation, navigations } = await import('@/navigation')
  trackIOSStep('✓ 导航模块加载完成')

  initNavigation(async() => {
    trackIOSStep('→ 开始导航初始化')
    
    await handleInit()
    if (!isInited) {
      trackIOSStep('❌ 初始化未完成')
      if (Platform.OS === 'ios') {
        Alert.alert(
          '初始化未完成',
          `启动步骤:\n${iosAppSteps.join('\n')}`,
          [{ text: '确定' }]
        )
      }
      return
    }
    
    trackIOSStep('→ 推送主屏幕')
    // import('@/utils/nativeModules/cryptoTest')

    await navigations.pushHomeScreen().then(() => {
      trackIOSStep('✓ 主屏幕推送成功')
      trackIOSStep('✓ 应用启动完成！')
      
      if (Platform.OS === 'ios') {
        // 启动成功后显示完整步骤（可选）
        setTimeout(() => {
          Alert.alert(
            '应用启动成功',
            `启动步骤:\n${iosAppSteps.join('\n')}`,
            [{ text: '确定' }]
          )
        }, 1000)
      }
      
      void handlePushedHomeScreen()
    }).catch((err: any) => {
      trackIOSStep(`❌ 推送主屏幕失败: ${err.message}`)
      
      if (Platform.OS === 'ios') {
        Alert.alert(
          '推送主屏幕失败',
          `启动步骤:\n${iosAppSteps.join('\n')}\n\n错误:\n${err.message}\n\n堆栈:\n${err.stack}`,
          [{ text: '退出', onPress: () => exitApp() }]
        )
      } else {
        void tipDialog({
          title: 'Error',
          message: err.message,
          btnText: 'Exit',
          bgClose: false,
        }).then(() => {
          exitApp()
        })
      }
    })
  })
}).catch((err) => {
  trackIOSStep(`❌ 应用启动失败: ${err.message}`)
  
  if (Platform.OS === 'ios') {
    Alert.alert(
      '应用启动失败',
      `启动步骤:\n${iosAppSteps.join('\n')}\n\n错误:\n${err.message}\n\n堆栈:\n${err.stack}`,
      [{ text: '退出', onPress: () => exitApp() }]
    )
  } else {
    void tipDialog({
      title: '初始化失败 (Init Failed)',
      message: `Boot Log:\n\n${(err.stack ?? err.message) as string}`,
      btnText: 'Exit',
      bgClose: false,
    }).then(() => {
      exitApp()
    })
  }
})
