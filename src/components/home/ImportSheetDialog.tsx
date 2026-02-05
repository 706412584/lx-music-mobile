import { memo, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { View, StyleSheet } from 'react-native'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Input from '@/components/common/Input'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { scaleSizeH } from '@/utils/pixelRatio'

export interface ImportSheetDialogType {
  show: () => void
}

interface ImportSheetDialogProps {
  onConfirm: (url: string) => void
}

const ImportSheetDialog = forwardRef<ImportSheetDialogType, ImportSheetDialogProps>(({ onConfirm }, ref) => {
  const theme = useTheme()
  const alertRef = useRef<ConfirmAlertType>(null)
  const [url, setUrl] = useState('')

  useImperativeHandle(ref, () => ({
    show: () => {
      setUrl('')
      alertRef.current?.setVisible(true)
    },
  }))

  const handleConfirm = () => {
    if (url.trim()) {
      onConfirm(url.trim())
      alertRef.current?.setVisible(false)
    }
  }

  const handleCancel = () => {
    setUrl('')
    alertRef.current?.setVisible(false)
  }

  return (
    <ConfirmAlert
      ref={alertRef}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmText="导入"
      cancelText="取消"
    >
      <View style={styles.container}>
        <Text size={16} color={theme['c-font']} style={styles.title}>
          导入歌单
        </Text>
        <Text size={13} color={theme['c-font-label']} style={styles.tip}>
          支持导入网易云、QQ音乐、酷狗音乐等平台的歌单链接或ID
        </Text>
        <Input
          placeholder="请输入歌单链接或ID"
          value={url}
          onChangeText={setUrl}
          style={styles.input}
          multiline
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
    marginBottom: scaleSizeH(8),
    fontWeight: '500',
  },
  tip: {
    marginBottom: scaleSizeH(16),
    lineHeight: 18,
  },
  input: {
    marginTop: scaleSizeH(8),
  },
})

export default memo(ImportSheetDialog)
