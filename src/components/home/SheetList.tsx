import { memo, useCallback, useState } from 'react'
import { View, StyleSheet, FlatList } from 'react-native'
import SheetListItem from './SheetListItem'
import Text from '@/components/common/Text'
import Button from '@/components/common/Button'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH, scaleSizeW } from '@/utils/pixelRatio'
import { removeUserList } from '@/core/list'
import { confirmDialog, toast } from '@/utils/tools'

interface SheetListProps {
  lists: LX.List.MyListInfo[]
  emptyText?: string
  isManageMode?: boolean
  onExitManageMode?: () => void
}

/**
 * 歌单列表组件
 * 使用 FlatList 展示歌单列表
 *
 * 性能优化：
 * - 使用 getItemLayout 提供固定高度，提升滚动性能
 * - 优化 FlatList 配置参数
 * - 使用 memo 避免不必要的重渲染
 */
const SheetList = memo(({ lists, emptyText, isManageMode = false, onExitManageMode }: SheetListProps) => {
  const theme = useTheme()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handlePress = useCallback((item: LX.List.MyListInfo) => {
    if (isManageMode) {
      // 管理模式下切换选中状态
      setSelectedIds(prev => {
        const newSet = new Set(prev)
        if (newSet.has(item.id)) {
          newSet.delete(item.id)
        } else {
          newSet.add(item.id)
        }
        return newSet
      })
    } else {
      // 正常模式下设置活动列表
      const { setActiveList } = require('@/core/list')
      setActiveList(item.id)
    }
  }, [isManageMode])

  const handleBatchDelete = useCallback(async() => {
    if (selectedIds.size === 0) {
      toast('请选择要删除的歌单')
      return
    }

    const confirmed = await confirmDialog({
      message: `确定要删除选中的 ${selectedIds.size} 个歌单吗？`,
    })

    if (!confirmed) return

    try {
      await removeUserList(Array.from(selectedIds))
      toast('删除成功')
      setSelectedIds(new Set())
      onExitManageMode?.()
    } catch (error) {
      console.log('批量删除失败:', error)
      toast('删除失败')
    }
  }, [selectedIds, onExitManageMode])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === lists.length) {
      // 全部已选中，则取消全选
      setSelectedIds(new Set())
    } else {
      // 全选
      setSelectedIds(new Set(lists.map(item => item.id)))
    }
  }, [lists, selectedIds.size])

  const renderItem = useCallback(({ item }: { item: LX.List.MyListInfo }) => {
    return (
      <SheetListItem
        item={item}
        onPress={handlePress}
        isManageMode={isManageMode}
        isSelected={selectedIds.has(item.id)}
      />
    )
  }, [handlePress, isManageMode, selectedIds])

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text size={14} color={theme['c-font-label']}>
        {emptyText ?? '暂无歌单'}
      </Text>
    </View>
  ), [emptyText, theme])

  const keyExtractor = useCallback((item: LX.List.MyListInfo) => item.id, [])

  // 固定项目高度，提升滚动性能
  const ITEM_HEIGHT = scaleSizeH(80) + scaleSizeH(12) // item height + margin
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), [])

  return (
    <View style={styles.container}>
      <FlatList
        data={lists}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={8}
        updateCellsBatchingPeriod={50}
        getItemLayout={getItemLayout}
      />
      
      {/* 管理模式底部操作栏 */}
      {isManageMode && lists.length > 0 && (
        <View style={[styles.bottomBar, { backgroundColor: theme['c-content-background'] }]}>
          <Button onPress={handleSelectAll} style={styles.bottomButton}>
            <Text style={{ color: theme['c-button-font'] }}>
              {selectedIds.size === lists.length ? '取消全选' : '全选'}
            </Text>
          </Button>
          <Button onPress={handleBatchDelete} style={styles.bottomButton}>
            <Text style={{ color: theme['c-button-font'] }}>
              删除 {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
            </Text>
          </Button>
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: scaleSizeH(8),
  },
  emptyContainer: {
    paddingVertical: scaleSizeH(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    paddingVertical: scaleSizeH(12),
    paddingHorizontal: scaleSizeW(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  bottomButton: {
    flex: 1,
    marginHorizontal: scaleSizeW(6),
    paddingVertical: scaleSizeH(10),
  },
})

export default SheetList
