import { NativeModules, NativeEventEmitter, Platform } from 'react-native'

const LyricModule = Platform.OS === 'android' ? NativeModules.LyricModule : null

// export const themes = [
//   { id: 'green', value: '#07c556' },
//   { id: 'yellow', value: '#fffa12' },
//   { id: 'blue', value: '#19b5fe' },
//   { id: 'red', value: '#ff1222' },
//   { id: 'pink', value: '#f1828d' },
//   { id: 'purple', value: '#c851d4' },
//   { id: 'orange', value: '#ffad12' },
//   { id: 'grey', value: '#bdc3c7' },
//   { id: 'black', value: '#333333' },
//   { id: 'white', value: '#ffffff' },
// ]

// export const textPositionX = [
//   { id: 'left', value: 'LEFT' },
//   { id: 'center', value: 'CENTER' },
//   { id: 'right', value: 'RIGHT' },
// ]
// export const textPositionY = [
//   { id: 'top', value: 'TOP' },
//   { id: 'center', value: 'CENTER' },
//   { id: 'bottom', value: 'BOTTOM' },
// ]

// const getThemeColor = themeId => (themes.find(t => t.id == themeId) || themes[0]).value
// const getTextPositionX = x => (textPositionX.find(t => t.id == x) || textPositionX[0]).value
// const getTextPositionY = y => (textPositionY.find(t => t.id == y) || textPositionY[0]).value
const getAlpha = (num: number) => num / 100
const getTextSize = (num: number) => num / 10

/**
 * 发送歌词事件
 * @param isShow
 * @returns
 */
export const setSendLyricTextEvent = Platform.OS === 'android'
  ? async(isSend: boolean) => {
      return LyricModule.setSendLyricTextEvent(isSend)
    }
  : async() => {}

/**
 * show lyric
 */
export const showDesktopLyricView = Platform.OS === 'android'
  ? async({
      isShowToggleAnima,
      isSingleLine,
      width,
      maxLineNum,
      isLock,
      unplayColor,
      playedColor,
      shadowColor,
      opacity,
      textSize,
      positionX,
      positionY,
      textPositionX,
      textPositionY,
    }: {
      isShowToggleAnima: boolean
      isSingleLine: boolean
      width: number
      maxLineNum: number
      isLock: boolean
      unplayColor: string
      playedColor: string
      shadowColor: string
      opacity: number
      textSize: number
      positionX: number
      positionY: number
      textPositionX: LX.AppSetting['desktopLyric.textPosition.x']
      textPositionY: LX.AppSetting['desktopLyric.textPosition.y']
    }): Promise<void> => {
      return LyricModule.showDesktopLyric({
        isSingleLine,
        isShowToggleAnima,
        isLock,
        unplayColor,
        playedColor,
        shadowColor,
        alpha: getAlpha(opacity),
        textSize: getTextSize(textSize),
        lyricViewX: positionX,
        lyricViewY: positionY,
        textX: textPositionX.toUpperCase(),
        textY: textPositionY.toUpperCase(),
        width,
        maxLineNum,
      })
    }
  : async() => {}

/**
 * hide lyric
 */
export const hideDesktopLyricView = Platform.OS === 'android'
  ? async(): Promise<void> => {
      return LyricModule.hideDesktopLyric()
    }
  : async() => {}


/**
 * play lyric
 * @param {Number} time play time
 * @returns {Promise} Promise
 */
export const play = Platform.OS === 'android'
  ? async(time: number): Promise<void> => {
      return LyricModule.play(time)
    }
  : async() => {}

/**
 * pause lyric
 */
export const pause = Platform.OS === 'android'
  ? async(): Promise<void> => {
      return LyricModule.pause()
    }
  : async() => {}

/**
 * set lyric
 * @param lyric lyric str
 * @param translation lyric translation
 * @param romalrc lyric translation
 */
export const setLyric = Platform.OS === 'android'
  ? async(lyric: string, translation: string, romalrc: string): Promise<void> => {
      return LyricModule.setLyric(lyric, translation || '', romalrc || '')
    }
  : async() => {}

export const setPlaybackRate = Platform.OS === 'android'
  ? async(rate: number): Promise<void> => {
      return LyricModule.setPlaybackRate(rate)
    }
  : async() => {}

/**
 * toggle show translation
 * @param isShowTranslation is show translation
 */
export const toggleTranslation = Platform.OS === 'android'
  ? async(isShowTranslation: boolean): Promise<void> => {
      return LyricModule.toggleTranslation(isShowTranslation)
    }
  : async() => {}

/**
 * toggle show roma lyric
 * @param isShowRoma is show roma lyric
 */
export const toggleRoma = Platform.OS === 'android'
  ? async(isShowRoma: boolean): Promise<void> => {
      return LyricModule.toggleRoma(isShowRoma)
    }
  : async() => {}

/**
 * toggle is lock lyric window
 * @param isLock is lock lyric window
 */
export const toggleLock = Platform.OS === 'android'
  ? async(isLock: boolean): Promise<void> => {
      return LyricModule.toggleLock(isLock)
    }
  : async() => {}

/**
 * set color
 * @param unplayColor
 * @param playedColor
 * @param shadowColor
 */
export const setColor = Platform.OS === 'android'
  ? async(unplayColor: string, playedColor: string, shadowColor: string): Promise<void> => {
      return LyricModule.setColor(unplayColor, playedColor, shadowColor)
    }
  : async() => {}

/**
 * set text alpha
 * @param alpha text alpha
 */
export const setAlpha = Platform.OS === 'android'
  ? async(alpha: number): Promise<void> => {
      return LyricModule.setAlpha(getAlpha(alpha))
    }
  : async() => {}

/**
 * set text size
 * @param size text size
 */
export const setTextSize = Platform.OS === 'android'
  ? async(size: number): Promise<void> => {
      return LyricModule.setTextSize(getTextSize(size))
    }
  : async() => {}

export const setShowToggleAnima = Platform.OS === 'android'
  ? async(isShowToggleAnima: boolean): Promise<void> => {
      return LyricModule.setShowToggleAnima(isShowToggleAnima)
    }
  : async() => {}

export const setSingleLine = Platform.OS === 'android'
  ? async(isSingleLine: boolean): Promise<void> => {
      return LyricModule.setSingleLine(isSingleLine)
    }
  : async() => {}

export const setPosition = Platform.OS === 'android'
  ? async(x: number, y: number): Promise<void> => {
      return LyricModule.setPosition(x, y)
    }
  : async() => {}

export const setMaxLineNum = Platform.OS === 'android'
  ? async(maxLineNum: number): Promise<void> => {
      return LyricModule.setMaxLineNum(maxLineNum)
    }
  : async() => {}

export const setWidth = Platform.OS === 'android'
  ? async(width: number): Promise<void> => {
      return LyricModule.setWidth(width)
    }
  : async() => {}

// export const fixViewPosition = async(): Promise<void> => {
//   return LyricModule.fixViewPosition()
// }

export const setLyricTextPosition = Platform.OS === 'android'
  ? async(textX: LX.AppSetting['desktopLyric.textPosition.x'], textY: LX.AppSetting['desktopLyric.textPosition.y']): Promise<void> => {
      return LyricModule.setLyricTextPosition(textX.toUpperCase(), textY.toUpperCase())
    }
  : async() => {}

export const checkOverlayPermission = Platform.OS === 'android'
  ? async(): Promise<void> => {
      return LyricModule.checkOverlayPermission()
    }
  : async() => {}

export const openOverlayPermissionActivity = Platform.OS === 'android'
  ? async(): Promise<void> => {
      return LyricModule.openOverlayPermissionActivity()
    }
  : async() => {}

export const onPositionChange = Platform.OS === 'android'
  ? (handler: (position: { x: number, y: number }) => void): () => void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const eventEmitter = new NativeEventEmitter(LyricModule)
      const eventListener = eventEmitter.addListener('set-position', event => {
        handler(event as { x: number, y: number })
      })

      return () => {
        eventListener.remove()
      }
    }
  : () => () => {}

export const onLyricLinePlay = Platform.OS === 'android'
  ? (handler: (lineInfo: { text: string, extendedLyrics: string[] }) => void): () => void => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const eventEmitter = new NativeEventEmitter(LyricModule)
      const eventListener = eventEmitter.addListener('lyric-line-play', event => {
        handler(event as { text: string, extendedLyrics: string[] })
      })

      return () => {
        eventListener.remove()
      }
    }
  : () => () => {}

