import { createList, setTempList } from '@/core/list'
import { playList } from '@/core/player/player'
import { getListDetail, getListDetailAll } from '@/core/songlist'
import { LIST_IDS } from '@/config/constant'
import listState from '@/store/list/state'
import syncSourceList from '@/core/syncSourceList'
import { confirmDialog, toMD5, toast } from '@/utils/tools'
import { type Source } from '@/store/songlist/state'

const getListId = (id: string, source: LX.OnlineSource) => `${source}__${id}`

export const handlePlay = async(
  id: string, 
  source: Source, 
  list?: LX.Music.MusicInfoOnline[], 
  index = 0,
  mode: 'order' | 'random' = 'order'
) => {
  const listId = getListId(id, source)
  let isPlayingList = false
  
  if (!list?.length) list = (await getListDetail(id, source, 1)).list
  if (list?.length) {
    let playList = [...list]
    
    // 如果是随机播放，打乱列表顺序
    if (mode === 'random') {
      playList = playList.sort(() => Math.random() - 0.5)
      index = 0 // 随机播放从第一首开始
    }
    
    await setTempList(listId, playList)
    void playList(LIST_IDS.TEMP, index)
    isPlayingList = true
  }
  
  const fullList = await getListDetailAll(source, id)
  if (!fullList.length) return
  
  if (isPlayingList) {
    if (listState.tempListMeta.id == listId) {
      let playList = [...fullList]
      
      // 如果是随机播放，打乱列表顺序
      if (mode === 'random') {
        playList = playList.sort(() => Math.random() - 0.5)
      }
      
      await setTempList(listId, playList)
    }
  } else {
    let playList = [...fullList]
    
    // 如果是随机播放，打乱列表顺序
    if (mode === 'random') {
      playList = playList.sort(() => Math.random() - 0.5)
      index = 0
    }
    
    await setTempList(listId, playList)
    void playList(LIST_IDS.TEMP, index)
  }
}

export const handleCollect = async(id: string, source: Source, name: string, img?: string) => {
  const listId = getListId(id, source)

  const targetList = listState.userList.find(l => l.sourceListId == listId)
  if (targetList) {
    const confirm = await confirmDialog({
      message: global.i18n.t('duplicate_list_tip', { name: targetList.name }),
      cancelButtonText: global.i18n.t('list_import_part_button_cancel'),
      confirmButtonText: global.i18n.t('confirm_button_text'),
    })
    if (!confirm) return
    void syncSourceList(targetList)
    return
  }

  // 弹出选择对话框
  const choice = await confirmDialog({
    message: '选择收藏方式',
    cancelButtonText: '收藏到我的歌单',
    confirmButtonText: '收藏歌单',
  })

  const list = await getListDetailAll(source, id)
  
  if (choice) {
    // 收藏歌单：保留来源信息
    const newListId = `${source}_${toMD5(listId)}`
    await createList({
      name,
      id: newListId,
      list,
      source,
      sourceListId: id,
      img,
    })
    toast('已收藏到收藏歌单')
  } else {
    // 收藏到我的歌单：不保留来源信息
    await createList({
      name,
      list,
      img,
    })
    toast('已收藏到我的歌单')
  }
}
