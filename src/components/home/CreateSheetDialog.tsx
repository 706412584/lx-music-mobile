import { memo, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { View, StyleSheet } from 'react-native'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Input from '@/components/common/Input'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'

export interface CreateSheetDialogType {
  show: () => void
}

interface CreateSheetDialogProps {
  onConfirm: (name: string) => void
}

const CreateSheetDialog = forwardRef<CreateSheetDialogType, CreateSheetDialogProps>(({ onConfirm }, ref) => {
  const theme = useTheme()
  const alertRef = useRef<ConfirmAlertType>(null)
  const [name, setName] = useState('')

  useImperativeHandle(ref, () => ({
    show: () => {
      setName('')
      alertRef.current?.setVisible(true)
    },
  }))

  const handleConfirm = () => {
    if (name.trim()) {
      onConfirm(name.trim())
      alertRef.current?.setVisible(false)
    }
  }

  const handleCancel = () => {
    setName('')
    alertRef.current?.setVisible(false)
  }

  return (
    <ConfirmAlert
      ref={alertRef}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmText="创建"
      cancelText="取消"
    >
      <View style={styles.container}>
        <Text size={16} color={theme['c-font']} style={styles.title}>
          创建歌单
        </Text>
        <Input
          placeholder="请输入歌单名称"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
      </View>
    </ConfirmAlert>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingVertical: scaleSizeH(12),
  },
  title: {
    marginBottom: scaleSizeH(16),
    fontWeight: '500',
  },
  input: {
    marginTop: scaleSizeH(8),
  },
})

export default memo(CreateSheetDialog)
