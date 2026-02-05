import { memo, useState, useCallback, useRef } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import SheetTabs, { type TabType } from './SheetTabs'
import SheetList from './SheetList'
import CreateSheetDialog, { type CreateSheetDialogType } from './CreateSheetDialog'
import ImportSheetDialog, { type ImportSheetDialogType } from './ImportSheetDialog'
import Menu, { type MenuType } from '@/components/common/Menu'
import { useMyList } from '@/store/list/hook'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { createList } from '@/core/list'
import { getListDetailAll } from '@/core/songlist'
import { toast } from '@/utils/tools'

/**
 * 歌单列表容器组件
 * 包含标签页切换和歌单列表展示
 */
const Sheets = memo(() => {
  const [activeTab, setActiveTab] = useState<TabType>('my')
  const [isManageMode, setIsManageMode] = useState(false)
  const myLists = useMyList()
  const theme = useTheme()
  const createSheetDialogRef = useRef<CreateSheetDialogType>(null)
  const importSheetDialogRef = useRef<ImportSheetDialogType>(null)
  const menuRef = useRef<MenuType>(null)
  const menuButtonRef = useRef<View>(null)

  // 过滤掉默认列表和收藏列表
  // 用户创建的歌单：没有 source 字段
  const userCreatedLists = myLists.filter(
    list => list.id !== 'default' && list.id !== 'love' && !list.source,
  )

  // 收藏的歌单：有 source 和 sourceListId 字段
  const favoriteLists = myLists.filter(
    list => list.id !== 'default' && list.id !== 'love' && list.source && list.sourceListId,
  )

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
    setIsManageMode(false) // 切换标签时退出管理模式
  }, [])

  const toggleManageMode = useCallback(() => {
    setIsManageMode(prev => !prev)
  }, [])

  const handleMenuPress = useCallback(() => {
    if (isManageMode) {
      // 如果在管理模式，直接退出
      setIsManageMode(false)
    } else {
      // 否则显示菜单
      menuButtonRef.current?.measure((x, y, width, height, pageX, pageY) => {
        menuRef.current?.show({
          x: pageX,
          y: pageY,
          w: width,
          h: height,
        })
      })
    }
  }, [isManageMode])

  // 创建新歌单
  const handleCreateSheet = useCallback(() => {
    createSheetDialogRef.current?.show()
  }, [])

  // 确认创建歌单
  const handleConfirmCreate = useCallback(async (name: string) => {
    try {
      await createList({
        name,
      })
      toast('创建成功')
    } catch (error) {
      console.log('创建歌单失败:', error)
      toast('创建失败')
    }
  }, [])

  // 导入第三方歌单
  const handleImportSheet = useCallback(() => {
    importSheetDialogRef.current?.show()
  }, [])

  // 确认导入歌单
  const handleConfirmImport = useCallback(async (urlOrId: string) => {
    try {
      // 解析歌单链接或ID
      // 支持格式：
      // 1. 完整链接：https://music.163.com/#/playlist?id=123456
      // 2. 分享链接：https://y.music.163.com/m/playlist?id=123456
      // 3. 直接ID：kw_123456 或 123456
      
      let source: LX.OnlineSource | null = null
      let listId: string | null = null

      // 尝试从链接中提取
      if (urlOrId.includes('music.163.com') || urlOrId.includes('y.music.163.com')) {
        source = 'wy'
        const match = urlOrId.match(/[?&]id=(\d+)/)
        if (match) listId = match[1]
      } else if (urlOrId.includes('y.qq.com') || urlOrId.includes('c.y.qq.com')) {
        source = 'tx'
        const match = urlOrId.match(/[?&]id=(\d+)/)
        if (match) listId = match[1]
      } else if (urlOrId.includes('kugou.com')) {
        source = 'kg'
        const match = urlOrId.match(/[?&]id=(\d+)/)
        if (match) listId = match[1]
      } else if (urlOrId.includes('kuwo.cn')) {
        source = 'kw'
        const match = urlOrId.match(/pid[=/](\d+)/)
        if (match) listId = match[1]
      } else {
        // 尝试解析带前缀的ID格式：kw_123456
        const prefixMatch = urlOrId.match(/^(wy|tx|kg|kw|mg)_(.+)$/)
        if (prefixMatch) {
          source = prefixMatch[1] as LX.OnlineSource
          listId = prefixMatch[2]
        } else {
          // 纯数字ID，默认使用酷我
          if (/^\d+$/.test(urlOrId.trim())) {
            source = 'kw'
            listId = urlOrId.trim()
          }
        }
      }

      if (!source || !listId) {
        toast('无法识别的歌单链接或ID')
        return
      }

      toast('正在导入歌单...')

      // 先获取第一页以获取歌单信息
      const { getListDetail } = await import('@/core/songlist')
      const firstPage = await getListDetail(listId, source, 1)
      
      // 获取完整歌单
      const musicList = await getListDetailAll(source, listId)
      
      if (!musicList || musicList.length === 0) {
        toast('歌单为空或获取失败')
        return
      }

      // 使用真实的歌单名称，如果没有则使用默认名称
      const sheetName = firstPage.info?.name || `导入的歌单 ${listId}`
      
      // 获取封面图片：优先使用歌单封面，如果没有则使用第一首歌的封面
      let coverImg = firstPage.info?.img
      if (!coverImg && musicList.length > 0) {
        // 使用第一首歌的封面
        coverImg = musicList[0].img
      }

      // 创建歌单（不带 source 字段，归类到我的歌单）
      await createList({
        name: sheetName,
        list: musicList,
        img: coverImg,
      })

      toast(`成功导入《${sheetName}》，共 ${musicList.length} 首歌曲`)
    } catch (error) {
      console.log('导入歌单失败:', error)
      toast('导入失败，请检查链接或ID是否正确')
    }
  }, [])

  // 菜单选项
  const menuOptions = [
    ...(activeTab === 'my' ? [
      {
        action: 'create',
        label: '创建歌单',
      },
      {
        action: 'import',
        label: '导入歌单',
      },
    ] : []),
    {
      action: 'manage',
      label: isManageMode ? '完成' : '管理歌单',
    },
  ] as const

  const handleMenuSelect = useCallback((menu: typeof menuOptions[number]) => {
    switch (menu.action) {
      case 'create':
        handleCreateSheet()
        break
      case 'import':
        handleImportSheet()
        break
      case 'manage':
        toggleManageMode()
        break
    }
  }, [handleCreateSheet, handleImportSheet, toggleManageMode])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SheetTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          myCount={userCreatedLists.length}
          favoriteCount={favoriteLists.length}
        />
        {/* 更多按钮 */}
        <View ref={menuButtonRef} collapsable={false}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleMenuPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name={isManageMode ? 'close' : 'dots-vertical'}
              size={isManageMode ? 18 : 20}
              color={theme['c-font']}
            />
          </TouchableOpacity>
        </View>
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
      
      {/* 菜单 */}
      <Menu
        ref={menuRef}
        menus={menuOptions}
        onPress={handleMenuSelect}
      />
      
      {/* 创建歌单对话框 */}
      <CreateSheetDialog
        ref={createSheetDialogRef}
        onConfirm={handleConfirmCreate}
      />
      
      {/* 导入歌单对话框 */}
      <ImportSheetDialog
        ref={importSheetDialogRef}
        onConfirm={handleConfirmImport}
      />
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
  actionButton: {
    padding: scaleSizeW(12),
    marginRight: scaleSizeW(8),
  },
})

export default Sheets
