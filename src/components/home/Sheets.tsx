import { memo, useState, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import SheetTabs, { type TabType } from './SheetTabs'
import SheetList from './SheetList'
import { useMyList } from '@/store/list/hook'
import { scaleSizeH } from '@/utils/pixelRatio'

/**
 * 歌单列表容器组件
 * 包含标签页切换和歌单列表展示
 */
const Sheets = memo(() => {
  const [activeTab, setActiveTab] = useState<TabType>('my')
  const myLists = useMyList()

  // 过滤掉默认列表和收藏列表，只显示用户创建的歌单
  const userCreatedLists = myLists.filter(
    list => list.id !== 'default' && list.id !== 'love',
  )

  // 收藏歌单功能暂未实现
  const favoriteLists: any[] = []

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
  }, [])

  return (
    <View style={styles.container}>
      <SheetTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        myCount={userCreatedLists.length}
        favoriteCount={favoriteLists.length}
      />
      {activeTab === 'my' ? (
        <SheetList
          lists={userCreatedLists}
          emptyText="暂无自建歌单"
        />
      ) : (
        <SheetList
          lists={favoriteLists}
          emptyText="暂无收藏歌单"
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
})

export default Sheets
