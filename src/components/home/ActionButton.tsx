import { memo } from 'react'
import { TouchableOpacity, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { Icon } from '@/components/common/Icon'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'

interface ActionButtonProps {
  /**
   * 图标名称
   */
  iconName: string
  /**
   * 图标颜色（可选）
   */
  iconColor?: string
  /**
   * 按钮标题
   */
  title: string
  /**
   * 点击事件处理函数
   */
  action?: () => void
  /**
   * 自定义样式
   */
  style?: StyleProp<ViewStyle>
}

/**
 * 快捷操作按钮组件
 * 参考 MusicFree 的设计，用于主页快捷入口
 */
const ActionButton = memo(({
  iconName,
  iconColor,
  title,
  action,
  style,
}: ActionButtonProps) => {
  const theme = useTheme()

  return (
    <TouchableOpacity
      onPress={action}
      activeOpacity={0.7}
      style={[
        styles.wrapper,
        {
          backgroundColor: theme['c-primary-alpha-100'],
        },
        style,
      ]}
    >
      <Icon
        name={iconName}
        size={40}
        color={iconColor ?? theme['c-font']}
      />
      <Text
        size={13}
        style={styles.text}
      >
        {title}
      </Text>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  wrapper: {
    width: scaleSizeW(140),
    height: scaleSizeH(110),
    borderRadius: scaleSizeH(12),
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: scaleSizeH(8),
    fontWeight: '600',
  },
})

export default ActionButton
