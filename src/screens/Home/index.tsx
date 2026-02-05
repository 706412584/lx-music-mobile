import { useEffect, useState } from 'react'
import { useHorizontalMode } from '@/utils/hooks'
import PageContent from '@/components/PageContent'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import Vertical from './Vertical'
import Horizontal from './Horizontal'
import { navigations } from '@/navigation'
import settingState from '@/store/setting/state'
import { Platform, View, Text, ScrollView, TouchableOpacity } from 'react-native'


interface Props {
  componentId: string
}


export default ({ componentId }: Props) => {
  const isHorizontalMode = useHorizontalMode()
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [showDebug, setShowDebug] = useState(Platform.OS === 'ios')
  
  const addDebugInfo = (info: string) => {
    if (Platform.OS === 'ios') {
      console.log(`[Home Debug] ${info}`)
      setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`])
    }
  }
  
  useEffect(() => {
    addDebugInfo('✓ Home component mounted')
    addDebugInfo(`ComponentId: ${componentId}`)
    addDebugInfo(`Mode: ${isHorizontalMode ? 'Horizontal' : 'Vertical'}`)
    
    setComponentId(COMPONENT_IDS.home, componentId)
    addDebugInfo('✓ ComponentId set')

    if (settingState.setting['player.startupPushPlayDetailScreen']) {
      addDebugInfo('→ Pushing PlayDetail screen')
      navigations.pushPlayDetailScreen(componentId, true)
    } else {
      addDebugInfo('⊘ Skip pushing PlayDetail screen')
    }
    
    addDebugInfo('✓ Home useEffect completed')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (Platform.OS === 'ios') {
    addDebugInfo('→ Rendering Home component')
  }

  // iOS调试：全屏调试视图
  if (Platform.OS === 'ios' && showDebug) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {/* 标题栏 */}
        <View style={{ padding: 20, backgroundColor: '#FF0000' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' }}>
            🔍 iOS 调试模式
          </Text>
        </View>
        
        {/* 调试信息 */}
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <View style={{ backgroundColor: '#1a1a1a', padding: 15, borderRadius: 10, marginBottom: 20 }}>
            <Text style={{ color: '#00FF00', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
              ✓ Home 组件已渲染
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14 }}>
              ComponentId: {componentId}
            </Text>
            <Text style={{ color: '#FFFFFF', fontSize: 14 }}>
              模式: {isHorizontalMode ? '横屏' : '竖屏'}
            </Text>
          </View>
          
          <View style={{ backgroundColor: '#1a1a1a', padding: 15, borderRadius: 10, marginBottom: 20 }}>
            <Text style={{ color: '#FFD700', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
              📋 调试日志:
            </Text>
            {debugInfo.map((info, index) => (
              <Text key={index} style={{ color: '#CCCCCC', fontSize: 12, marginBottom: 5 }}>
                {info}
              </Text>
            ))}
          </View>
          
          <View style={{ backgroundColor: '#1a1a1a', padding: 15, borderRadius: 10, marginBottom: 20 }}>
            <Text style={{ color: '#00BFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
              🧪 测试区域:
            </Text>
            <View style={{ backgroundColor: '#FF0000', padding: 20, marginBottom: 10 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, textAlign: 'center' }}>
                红色测试块 - 如果看到说明渲染正常
              </Text>
            </View>
            <View style={{ backgroundColor: '#00FF00', padding: 20, marginBottom: 10 }}>
              <Text style={{ color: '#000000', fontSize: 16, textAlign: 'center' }}>
                绿色测试块 - 颜色显示正常
              </Text>
            </View>
            <View style={{ backgroundColor: '#0000FF', padding: 20 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 16, textAlign: 'center' }}>
                蓝色测试块 - 布局正常
              </Text>
            </View>
          </View>
        </ScrollView>
        
        {/* 底部按钮 */}
        <View style={{ padding: 20, backgroundColor: '#1a1a1a' }}>
          <TouchableOpacity
            style={{ backgroundColor: '#00FF00', padding: 15, borderRadius: 10, marginBottom: 10 }}
            onPress={() => {
              addDebugInfo('→ 尝试加载正常界面')
              setShowDebug(false)
            }}
          >
            <Text style={{ color: '#000000', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
              ✓ 调试成功 - 加载正常界面
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{ backgroundColor: '#FF6600', padding: 15, borderRadius: 10 }}
            onPress={() => {
              addDebugInfo('🔄 刷新调试信息')
              setDebugInfo([...debugInfo, '--- 手动刷新 ---'])
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>
              🔄 刷新调试信息
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // 正常渲染
  if (Platform.OS === 'ios') {
    addDebugInfo('→ Rendering normal UI')
  }

  return (
    <PageContent>
      {
        isHorizontalMode
          ? <Horizontal />
          : <Vertical />
      }
    </PageContent>
  )
}
