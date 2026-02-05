import { initSetting, showPactModal } from '@/core/common'
import registerPlaybackService from '@/plugins/player/service'
import initTheme from './theme'
import initI18n from './i18n'
import initUserApi from './userApi'
import initPlayer from './player'
import dataInit from './dataInit'
import initSync from './sync'
import initCommonState from './common'
import { initDeeplink } from './deeplink'
import { setApiSource } from '@/core/apiSource'
import commonActions from '@/store/common/action'
import settingState from '@/store/setting/state'
import { checkUpdate } from '@/core/version'
import { bootLog } from '@/utils/bootLog'
import { cheatTip, tipDialog } from '@/utils/tools'
import { Platform, Alert } from 'react-native'

// iOS 初始化进度提示
let iosInitSteps: string[] = []
const showIOSInitProgress = (step: string) => {
  if (Platform.OS !== 'ios') return
  iosInitSteps.push(step)
  console.log(`iOS Init: ${step}`)
}

let isFirstPush = true
const handlePushedHomeScreen = async() => {
  await cheatTip()
  if (settingState.setting['common.isAgreePact']) {
    if (isFirstPush) {
      isFirstPush = false
      void checkUpdate()
      void initDeeplink()
    }
  } else {
    if (isFirstPush) isFirstPush = false
    showPactModal()
  }
}

let isInited = false
export default async() => {
  if (isInited) return handlePushedHomeScreen
  bootLog('Initing...')
  
  // iOS调试：显示初始化进度
  if (Platform.OS === 'ios') {
    iosInitSteps = []
    showIOSInitProgress('开始初始化...')
  }
  
  try {
    showIOSInitProgress('1/10 设置字体大小')
    commonActions.setFontSize(global.lx.fontSize)
    bootLog('Font size changed.')
    
    showIOSInitProgress('2/10 加载设置')
    const setting = await initSetting()
    bootLog('Setting inited.')

    showIOSInitProgress('3/10 初始化主题')
    await initTheme(setting)
    bootLog('Theme inited.')
    
    showIOSInitProgress('4/10 初始化语言')
    await initI18n(setting)
    bootLog('I18n inited.')

    // iOS跳过UserApi初始化（需要Android原生模块）
    if (Platform.OS === 'android') {
      await initUserApi(setting)
      bootLog('User Api inited.')
    } else {
      showIOSInitProgress('5/10 跳过自定义API (iOS不支持)')
      bootLog('User Api skipped on iOS.')
    }

    showIOSInitProgress('6/10 设置音乐源')
    setApiSource(setting['common.apiSource'])
    bootLog('Api inited.')

    showIOSInitProgress('7/10 注册播放服务')
    registerPlaybackService()
    bootLog('Playback Service Registered.')
    
    showIOSInitProgress('8/10 初始化播放器')
    await initPlayer(setting)
    bootLog('Player inited.')
    
    showIOSInitProgress('9/10 初始化数据')
    await dataInit(setting)
    bootLog('Data inited.')
    
    showIOSInitProgress('10/10 初始化通用状态')
    await initCommonState(setting)
    bootLog('Common State inited.')

    void initSync(setting)
    bootLog('Sync inited.')

    isInited ||= true
    
    if (Platform.OS === 'ios') {
      showIOSInitProgress('✓ 初始化完成！')
      // 显示完整的初始化步骤
      setTimeout(() => {
        Alert.alert(
          'iOS 初始化完成',
          iosInitSteps.join('\n'),
          [{ text: '确定' }]
        )
      }, 500)
    }

    return handlePushedHomeScreen
  } catch (error: any) {
    if (Platform.OS === 'ios') {
      showIOSInitProgress(`❌ 初始化失败: ${error.message}`)
      // 显示失败信息
      Alert.alert(
        'iOS 初始化失败',
        `已完成步骤:\n${iosInitSteps.join('\n')}\n\n错误信息:\n${error.message}\n\n堆栈:\n${error.stack}`,
        [{ text: '确定' }]
      )
    }
    throw error
  }
}
