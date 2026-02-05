import { memo, useCallback } from 'react'
import { View, TouchableWithoutFeedback, StyleSheet } from 'react-native'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'

export type TabType = 'my' | 'favorite'

interface SheetTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  myCount: number
  favoriteCount: number
}

/**
 * 歌单标签页组件
 * 参考 MusicFree 的设计，提供"我的歌单"和"收藏歌单"的切换功能
 *
 * @example
 * ```tsx
 * import { SheetTabs } from '@/components/home'
 *
 * function MyComponent() {
 *   const [activeTab, setActiveTab] = useState<TabType>('my')
 *
 *   return (
 *     <SheetTabs
 *       activeTab={activeTab}
 *       onTabChange={setActiveTab}
 *       myCount={10}
 *       favoriteCount={5}
 *     />
 *   )
 * }
 * ```
 *
 * @param activeTab - 当前激活的标签页 ('my' | 'favorite')
 * @param onTabChange - 标签页切换回调函数
 * @param myCount - 我的歌单数量
 * @param favoriteCount - 收藏歌单数量
 */
const SheetTabs = memo<SheetTabsProps>(({ activeTab, onTabChange, myCount, favoriteCount }) => {
  const theme = useTheme()
  const t = useI18n()

  const handleMyPress = useCallback(() => {
    onTabChange('my')
  }, [onTabChange])

  const handleFavoritePress = useCallback(() => {
    onTabChange('favorite')
  }, [onTabChange])

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        <TouchableWithoutFeedback onPress={handleMyPress}>
          <View style={styles.tabItem}>
            <Text
              size={16}
              weight={activeTab === 'my' ? 'bold' : 'normal'}
              color={activeTab === 'my' ? theme['c-primary-font'] : theme['c-font']}
              style={[
                styles.tabText,
                activeTab === 'my' && {
                  borderBottomColor: theme['c-primary'],
                  borderBottomWidth: scaleSizeH(3),
                },
              ]}
            >
              {t('my_list')}
            </Text>
            <Text
              size={12}
              color={theme['c-font-label']}
              style={styles.countText}
            >
              {' '}({myCount})
            </Text>
          </View>
        </TouchableWithoutFeedback>

        <TouchableWithoutFeedback onPress={handleFavoritePress}>
          <View style={styles.tabItem}>
            <Text
              size={16}
              weight={activeTab === 'favorite' ? 'bold' : 'normal'}
              color={activeTab === 'favorite' ? theme['c-primary-font'] : theme['c-font']}
              style={[
                styles.tabText,
                activeTab === 'favorite' && {
                  borderBottomColor: theme['c-primary'],
                  borderBottomWidth: scaleSizeH(3),
                },
              ]}
            >
              {t('favorite_list')}
            </Text>
            <Text
              size={12}
              color={theme['c-font-label']}
              style={styles.countText}
            >
              {' '}({favoriteCount})
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: scaleSizeW(12),
    marginTop: scaleSizeH(16),
    marginBottom: scaleSizeH(12),
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scaleSizeW(24),
  },
  tabText: {
    lineHeight: scaleSizeH(32),
    paddingBottom: scaleSizeH(4),
  },
  countText: {
    lineHeight: scaleSizeH(32),
  },
})

export default SheetTabs
