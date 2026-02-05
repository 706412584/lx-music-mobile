import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import type { InitState as SearchState } from '@/store/search/state'
import type { Source as MusicSource } from '@/store/search/music/state'
import type { Source as SongListSource } from '@/store/search/songlist/state'
import MusicList, { type MusicListType } from './MusicList'
import BlankView, { type BlankViewType } from './BlankView'
import SonglistList from './SonglistList'
import PlayHistory from '../PlayHistory'
import LocalMusic from '../LocalMusic'

interface ListProps {
  onSearch: (keyword: string) => void
}
export interface ListType {
  loadList: (text: string, source: MusicSource | SongListSource, type: SearchState['searchType']) => void
}

export default forwardRef<ListType, ListProps>(({ onSearch }, ref) => {
  const [listType, setListType] = useState<SearchState['searchType']>('music')
  const [showBlankView, setShowListView] = useState(true)
  const [subPage, setSubPage] = useState<'play_history' | 'local_music' | null>(null)
  const listRef = useRef<MusicListType>(null)
  const blankViewRef = useRef<BlankViewType>(null)
  const currentSourceRef = useRef<MusicSource | SongListSource>('kw')

  useImperativeHandle(ref, () => ({
    loadList(text, source, type) {
      currentSourceRef.current = source
      if (text) {
        setShowListView(false)
        setSubPage(null)
        setListType(type)
        // const listDetailInfo = searchMusicState.listDetailInfo
        requestAnimationFrame(() => {
          listRef.current?.loadList(text, source)
        })
      } else {
        setShowListView(true)
        setSubPage(null)
        requestAnimationFrame(() => {
          blankViewRef.current?.show(source)
        })
      }
    },
  }), [])

  const handleNavigate = (page: string) => {
    if (page === 'play_history' || page === 'local_music') {
      setSubPage(page)
      setShowListView(false)
    }
  }

  const handleBack = () => {
    setSubPage(null)
    setShowListView(true)
    // 返回时重新显示 BlankView
    requestAnimationFrame(() => {
      blankViewRef.current?.show(currentSourceRef.current)
    })
  }

  // 显示子页面
  if (subPage === 'play_history') {
    return <PlayHistory onBack={handleBack} />
  }
  if (subPage === 'local_music') {
    return <LocalMusic onBack={handleBack} />
  }

  // 显示搜索结果或空白页
  if (showBlankView) {
    return <BlankView ref={blankViewRef} onSearch={onSearch} onNavigate={handleNavigate} />
  }
  
  return listType == 'songlist'
    ? <SonglistList ref={listRef} />
    : <MusicList ref={listRef} />
})
