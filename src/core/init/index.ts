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
import { Platform } from 'react-native'

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
    console.log('iOS初始化开始...')
  }
  
  try {
    commonActions.setFontSize(global.lx.fontSize)
    bootLog('Font size changed.')
    if (Platform.OS === 'ios') console.log('✓ Font size changed')
    
    const setting = await initSetting()
    bootLog('Setting inited.')
    if (Platform.OS === 'ios') console.log('✓ Setting inited')

    await initTheme(setting)
    bootLog('Theme inited.')
    if (Platform.OS === 'ios') console.log('✓ Theme inited')
    
    await initI18n(setting)
    bootLog('I18n inited.')
    if (Platform.OS === 'ios') console.log('✓ I18n inited')

    // iOS跳过UserApi初始化（需要Android原生模块）
    if (Platform.OS === 'android') {
      await initUserApi(setting)
      bootLog('User Api inited.')
    } else {
      bootLog('User Api skipped on iOS.')
      console.log('⊘ User Api skipped (iOS)')
    }

    setApiSource(setting['common.apiSource'])
    bootLog('Api inited.')
    if (Platform.OS === 'ios') console.log('✓ Api source set')

    registerPlaybackService()
    bootLog('Playback Service Registered.')
    if (Platform.OS === 'ios') console.log('✓ Playback Service Registered')
    
    await initPlayer(setting)
    bootLog('Player inited.')
    if (Platform.OS === 'ios') console.log('✓ Player inited')
    
    await dataInit(setting)
    bootLog('Data inited.')
    if (Platform.OS === 'ios') console.log('✓ Data inited')
    
    await initCommonState(setting)
    bootLog('Common State inited.')
    if (Platform.OS === 'ios') console.log('✓ Common State inited')

    void initSync(setting)
    bootLog('Sync inited.')
    if (Platform.OS === 'ios') console.log('✓ Sync inited')

    isInited ||= true
    
    if (Platform.OS === 'ios') {
      console.log('✓ iOS初始化完成！')
    }

    return handlePushedHomeScreen
  } catch (error: any) {
    if (Platform.OS === 'ios') {
      console.error('iOS初始化失败:', error)
    }
    throw error
  }
}
