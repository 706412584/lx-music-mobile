import { memo, useCallback } from 'react'
import { View, StyleSheet, FlatList } from 'react-native'
import SheetListItem from './SheetListItem'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'
import { setActiveList, removeList } from '@/core/list'
import { showConfirmAlert } from '@/components/common/ConfirmAlert'

interface SheetListProps {
  lists: LX.List.MyListInfo[]
  emptyText?: string
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
const SheetList = memo(({ lists, emptyText }: SheetListProps) => {
  const theme = useTheme()

  const handlePress = useCallback((item: LX.List.MyListInfo) => {
    // 关闭侧边栏
    global.app_event.changeLoveListVisible(false)
    // 设置活动列表
    requestAnimationFrame(() => {
      setActiveList(item.id)
    })
  }, [])

  const handleDelete = useCallback((item: LX.List.MyListInfo) => {
    showConfirmAlert({
      message: global.i18n.t('list_remove_tip', { name: item.name }),
      onConfirm: async() => {
        try {
          await removeList(item.id)
          // 删除成功提示
          global.app_event.toast(global.i18n.t('list_edit_action_tip_remove_success'))
        } catch (error) {
          global.app_event.toast(global.i18n.t('list_edit_action_tip_add_failed'))
        }
      },
    })
  }, [])

  const renderItem = useCallback(({ item }: { item: LX.List.MyListInfo }) => {
    // 默认列表和收藏列表不显示删除按钮
    const showDeleteButton = item.id !== 'default' && item.id !== 'love'

    return (
      <SheetListItem
        item={item}
        onPress={handlePress}
        onDelete={handleDelete}
        showDeleteButton={showDeleteButton}
      />
    )
  }, [handlePress, handleDelete])

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
  )
})

const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: scaleSizeH(8),
  },
  emptyContainer: {
    paddingVertical: scaleSizeH(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default SheetList
