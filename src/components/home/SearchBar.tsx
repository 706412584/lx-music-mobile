import { memo } from 'react'
import { TouchableOpacity, StyleSheet } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'
import { setNavActiveId } from '@/core/common'

/**
 * 搜索栏组件
 * 参考 MusicFree 的设计，提供点击进入搜索页面的功能
 */
const SearchBar = memo(() => {
  const theme = useTheme()
  const t = useI18n()

  const handlePress = () => {
    // 切换到搜索页面
    setNavActiveId('nav_search')
  }

  return (
    <TouchableOpacity
      style={[
        styles.searchBar,
        {
          backgroundColor: theme['c-primary-alpha-100'],
        },
      ]}
      activeOpacity={0.7}
      onPress={handlePress}
    >
      <Icon
        name="search-2"
        size={16}
        color={theme['c-font-label']}
      />
      <Text
        style={styles.text}
        size={14}
        color={theme['c-font-label']}
      >
        {t('search__welcome')}
      </Text>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  searchBar: {
    marginHorizontal: scaleSizeW(12),
    flexDirection: 'row',
    alignItems: 'center',
    height: scaleSizeH(36),
    borderRadius: scaleSizeH(18),
    paddingHorizontal: scaleSizeW(12),
  },
  text: {
    marginLeft: scaleSizeW(8),
    opacity: 0.6,
  },
})

export default SearchBar
