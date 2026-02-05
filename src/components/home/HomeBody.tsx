import { memo, useState, useEffect } from 'react'
import { View, StyleSheet, BackHandler } from 'react-native'
import { SearchBar, Operations, Sheets } from '@/components/home'
import { scaleSizeH } from '@/utils/pixelRatio'
import { useHorizontalMode } from '@/utils/hooks'
import PlayHistory from '@/screens/Home/Views/PlayHistory'
import LocalMusic from '@/screens/Home/Views/LocalMusic'
import MusicList from '@/screens/Home/Views/Mylist/MusicList'
import listState from '@/store/list/state'

type PageType = 'home' | 'play_history' | 'local_music' | 'music_list'

/**
 * 主页主体内容组件
 * 整合搜索栏、快捷入口和歌单列表
 * 参考 MusicFree 的设计
 * 支持横竖屏自适应布局
 * 
 * 页面切换逻辑：
 * - home: 显示歌单列表（Sheets）
 * - play_history: 显示播放历史
 * - local_music: 显示本地音乐
 * - music_list: 显示当前激活歌单的歌曲列表
 */
const HomeBody = memo(() => {
  const isHorizontal = useHorizontalMode()
  const [currentPage, setCurrentPage] = useState<PageType>('home')

  // 监听歌单切换事件
  useEffect(() => {
    const handleListToggled = (activeListId: string) => {
      // 当切换到某个歌单时，显示歌曲列表
      if (activeListId && activeListId !== 'temp') {
        setCurrentPage('music_list')
      }
    }

    // 监听抽屉打开事件，用于从歌曲列表返回到歌单列表
    const handleDrawerOpen = (visible: boolean) => {
      if (visible && currentPage === 'music_list') {
        setCurrentPage('home')
      }
    }

    global.state_event.on('mylistToggled', handleListToggled)
    global.app_event.on('changeLoveListVisible', handleDrawerOpen)

    return () => {
      global.state_event.off('mylistToggled', handleListToggled)
      global.app_event.off('changeLoveListVisible', handleDrawerOpen)
    }
  }, [currentPage])

  // 处理返回键
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentPage === 'music_list' || currentPage === 'play_history' || currentPage === 'local_music') {
        setCurrentPage('home')
        // 清空 activeListId，以便下次可以重新进入同一个歌单
        const { setActiveList } = require('@/core/list')
        const listState = require('@/store/list/state').default
        if (listState.activeListId) {
          listState.activeListId = ''
        }
        return true // 阻止默认返回行为
      }
      return false // 允许默认返回行为
    })

    return () => backHandler.remove()
  }, [currentPage])

  // 如果显示其他页面，直接返回对应页面
  if (currentPage === 'play_history') {
    return <PlayHistory onBack={() => setCurrentPage('home')} />
  }
  if (currentPage === 'local_music') {
    return <LocalMusic onBack={() => setCurrentPage('home')} />
  }
  if (currentPage === 'music_list') {
    return <MusicList />
  }

  return (
    <View style={styles.container}>
      {/* 搜索栏 */}
      <View style={styles.searchBarContainer}>
        <SearchBar />
      </View>

      {/* 横屏模式：左右布局；竖屏模式：上下布局 */}
      <View style={[styles.contentContainer, isHorizontal && styles.horizontalLayout]}>
        {/* 快捷入口 */}
        <Operations 
          isHorizontal={isHorizontal}
          onNavigate={(page) => setCurrentPage(page as PageType)}
        />

        {/* 歌单列表（包含标签页） */}
        <View style={styles.sheetsContainer}>
          <Sheets />
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarContainer: {
    paddingTop: scaleSizeH(12),
    paddingBottom: scaleSizeH(8),
  },
  contentContainer: {
    flex: 1,
  },
  horizontalLayout: {
    flexDirection: 'row',
  },
  sheetsContainer: {
    flex: 1,
  },
})

export default HomeBody
