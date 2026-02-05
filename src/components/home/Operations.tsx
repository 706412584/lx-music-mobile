import { memo } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { ActionButton } from '@/components/home'
import { useI18n } from '@/lang'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import { setNavActiveId } from '@/core/common'

interface OperationsProps {
  isHorizontal?: boolean
  onNavigate?: (page: string) => void
}

/**
 * 快捷入口组件
 * 参考 MusicFree 的设计，提供四个快捷操作按钮
 * 支持横竖屏自适应布局
 */
const Operations = memo(({ isHorizontal = false, onNavigate }: OperationsProps) => {
  const t = useI18n()

  const actionButtons = [
    {
      iconName: 'album',
      title: t('nav_songlist'),
      action: () => {
        setNavActiveId('nav_songlist')
      },
    },
    {
      iconName: 'leaderboard',
      title: t('nav_top'),
      action: () => {
        setNavActiveId('nav_top')
      },
    },
    {
      iconName: 'music_time',
      title: t('play_history'),
      action: () => {
        onNavigate?.('play_history')
      },
    },
    {
      iconName: 'add_folder',
      title: t('local_music'),
      action: () => {
        onNavigate?.('local_music')
      },
    },
  ] as const

  if (isHorizontal) {
    // 横屏模式：垂直排列
    return (
      <ScrollView style={styles.horizontalContainer}>
        {actionButtons.map((action, index) => (
          <ActionButton
            key={action.title}
            style={[
              styles.horizontalActionButton,
              index > 0 && styles.horizontalActionMarginTop,
            ]}
            iconName={action.iconName}
            title={action.title}
            action={action.action}
          />
        ))}
      </ScrollView>
    )
  }

  // 竖屏模式：水平排列
  return (
    <View style={styles.container}>
      {actionButtons.map((action, index) => (
        <ActionButton
          key={action.title}
          style={[
            styles.actionButton,
            index % 4 !== 0 ? styles.actionMarginLeft : null,
          ]}
          iconName={action.iconName}
          title={action.title}
          action={action.action}
        />
      ))}
    </View>
  )
})

const styles = StyleSheet.create({
  // 竖屏模式样式
  container: {
    width: '100%',
    paddingHorizontal: scaleSizeW(12),
    marginVertical: scaleSizeH(16),
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
  },
  actionMarginLeft: {
    marginLeft: scaleSizeW(8),
  },
  // 横屏模式样式
  horizontalContainer: {
    width: scaleSizeW(200),
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: scaleSizeW(24),
    marginVertical: scaleSizeH(32),
  },
  horizontalActionButton: {
    width: scaleSizeW(157.5),
    height: scaleSizeH(160),
  },
  horizontalActionMarginTop: {
    marginTop: scaleSizeH(24),
  },
})

export default Operations
