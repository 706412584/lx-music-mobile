import { useEffect, useRef, useState } from 'react'

import MusicList, { type MusicListType } from './MusicList'
import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import { type ListInfoItem } from '@/store/songlist/state'
import PlayerBar from '@/components/player/PlayerBar'
import { ListInfoContext } from './state'


export default ({ componentId, info }: { componentId: string, info: ListInfoItem }) => {
  const musicListRef = useRef<MusicListType>(null)
  const isUnmountedRef = useRef(false)
  const [isManageMode, setIsManageMode] = useState(false)

  useEffect(() => {
    setComponentId(COMPONENT_IDS.songlistDetail, componentId)

    isUnmountedRef.current = false

    musicListRef.current?.loadList(info.source, info.id)

    // 监听批量下载模式事件
    const handleEnterManageMode = () => {
      setIsManageMode(true)
    }

    const handleExitManageMode = () => {
      setIsManageMode(false)
    }

    global.app_event.on('enterSonglistManageMode', handleEnterManageMode)
    global.app_event.on('exitSonglistManageMode', handleExitManageMode)

    return () => {
      isUnmountedRef.current = true
      global.app_event.off('enterSonglistManageMode', handleEnterManageMode)
      global.app_event.off('exitSonglistManageMode', handleExitManageMode)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  return (
    <PageContent>
      <StatusBar />
      <ListInfoContext.Provider value={info}>
        <MusicList 
          ref={musicListRef} 
          componentId={componentId}
          isManageMode={isManageMode}
          onExitManageMode={() => setIsManageMode(false)}
        />
      </ListInfoContext.Provider>
      <PlayerBar />
    </PageContent>
  )
}

// const styles = createStyle({
//   container: {
//     width: '100%',
//     flex: 1,
//     flexDirection: 'row',
//     borderTopWidth: BorderWidths.normal,
//   },
//   content: {
//     flex: 1,
//   },
// })
