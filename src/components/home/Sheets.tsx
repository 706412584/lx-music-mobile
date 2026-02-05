import { memo, useState, useCallback } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import SheetTabs, { type TabType } from './SheetTabs'
import SheetList from './SheetList'
import { useMyList } from '@/store/list/hook'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'

/**
 * 歌单列表容器组件
 * 包含标签页切换和歌单列表展示
 */
const Sheets = memo(() => {
  const [activeTab, setActiveTab] = useState<TabType>('my')
  const [isManageMode, setIsManageMode] = useState(false)
  const myLists = useMyList()
  const theme = useTheme()

  // 过滤掉默认列表和收藏列表，只显示用户创建的歌单
  const userCreatedLists = myLists.filter(
    list => list.id !== 'default' && list.id !== 'love',
  )

  // 收藏歌单功能暂未实现
  const favoriteLists: any[] = []

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
    setIsManageMode(false) // 切换标签时退出管理模式
  }, [])

  const toggleManageMode = useCallback(() => {
    setIsManageMode(prev => !prev)
  }, [])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SheetTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          myCount={userCreatedLists.length}
          favoriteCount={favoriteLists.length}
        />
        {/* 管理按钮 */}
        <TouchableOpacity
          style={styles.manageButton}
          onPress={toggleManageMode}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon
            name={isManageMode ? 'close' : 'dots-vertical'}
            size={20}
            color={theme['c-font']}
          />
        </TouchableOpacity>
      </View>
      {activeTab === 'my' ? (
        <SheetList
          lists={userCreatedLists}
          emptyText="暂无自建歌单"
          isManageMode={isManageMode}
          onExitManageMode={() => setIsManageMode(false)}
        />
      ) : (
        <SheetList
          lists={favoriteLists}
          emptyText="暂无收藏歌单"
          isManageMode={isManageMode}
          onExitManageMode={() => setIsManageMode(false)}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: scaleSizeH(8),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manageButton: {
    padding: scaleSizeW(12),
    marginRight: scaleSizeW(8),
  },
})

export default Sheets
