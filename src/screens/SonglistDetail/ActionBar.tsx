import { memo, useState, useRef } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import Button from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import Menu, { type MenuType } from '@/components/common/Menu'

import { createStyle } from '@/utils/tools'
import { pop } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import commonState from '@/store/common/state'
import Text from '@/components/common/Text'
import { handleCollect, handlePlay } from './listAction'
import songlistState from '@/store/songlist/state'
import { useI18n } from '@/lang'
import { useListInfo } from './state'
import { scaleSizeW } from '@/utils/pixelRatio'

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const info = useListInfo()
  const menuRef = useRef<MenuType>(null)
  const menuButtonRef = useRef<View>(null)
  const [isManageMode, setIsManageMode] = useState(false)

  const back = () => {
    void pop(commonState.componentIds.songlistDetail!)
  }

  const handlePlayOrder = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handlePlay(info.id, info.source, songlistState.listDetailInfo.list, 0, 'order')
  }

  const handlePlayRandom = () => {
    if (!songlistState.listDetailInfo.info.name) return
    void handlePlay(info.id, info.source, songlistState.listDetailInfo.list, 0, 'random')
  }

  const handleCollection = () => {
    if (!songlistState.listDetailInfo.info.name) return
    const imgUrl = songlistState.listDetailInfo.info.img || info.img
    void handleCollect(
      info.id, 
      info.source, 
      songlistState.listDetailInfo.info.name || info.name,
      imgUrl
    )
  }

  const handleBatchDownload = () => {
    setIsManageMode(true)
  }

  const handleMenuPress = () => {
    menuButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
      menuRef.current?.show({
        x: pageX,
        y: pageY,
        w: width,
        h: height,
      })
    })
  }

  const menuOptions = [
    {
      action: 'collect',
      label: t('collect_songlist'),
    },
    {
      action: 'download',
      label: '批量下载',
    },
  ] as const

  const handleMenuSelect = (menu: typeof menuOptions[number]) => {
    switch (menu.action) {
      case 'collect':
        handleCollection()
        break
      case 'download':
        handleBatchDownload()
        break
    }
  }

  return (
    <View style={styles.container}>
      <Button onPress={handlePlayOrder} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>顺序播放</Text>
      </Button>
      <Button onPress={handlePlayRandom} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>随机播放</Text>
      </Button>
      <View style={styles.moreButtonContainer}>
        <View ref={menuButtonRef} collapsable={false}>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={handleMenuPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name="dots-vertical"
              size={20}
              color={theme['c-button-font']}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Button onPress={back} style={styles.controlBtn}>
        <Text style={{ ...styles.controlBtnText, color: theme['c-button-font'] }}>{t('back')}</Text>
      </Button>

      {/* 菜单 */}
      <Menu
        ref={menuRef}
        menus={menuOptions}
        onPress={handleMenuSelect}
      />
    </View>
  )
})

const styles = createStyle({
  container: {
    flexDirection: 'row',
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
  },
  controlBtn: {
    flexGrow: 1,
    flexShrink: 1,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 10,
    paddingRight: 10,
  },
  controlBtnText: {
    fontSize: 13,
    textAlign: 'center',
  },
  moreButtonContainer: {
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: scaleSizeW(8),
  },
  moreButton: {
    padding: scaleSizeW(8),
  },
})

