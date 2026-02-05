import { useEffect } from 'react'
import { useHorizontalMode } from '@/utils/hooks'
import PageContent from '@/components/PageContent'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import Vertical from './Vertical'
import Horizontal from './Horizontal'
import { navigations } from '@/navigation'
import settingState from '@/store/setting/state'
import { Platform, View, Text } from 'react-native'


interface Props {
  componentId: string
}


export default ({ componentId }: Props) => {
  const isHorizontalMode = useHorizontalMode()
  
  if (Platform.OS === 'ios') {
    console.log('Home component rendering...', { componentId, isHorizontalMode })
  }
  
  useEffect(() => {
    if (Platform.OS === 'ios') {
      console.log('Home component mounted')
    }
    
    setComponentId(COMPONENT_IDS.home, componentId)
    // eslint-disable-next-line react-hooks/exhaustive-deps

    if (settingState.setting['player.startupPushPlayDetailScreen']) {
      navigations.pushPlayDetailScreen(componentId, true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // iOS调试：添加一个简单的测试视图
  if (Platform.OS === 'ios') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <View style={{ padding: 20, backgroundColor: '#FF0000' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 20 }}>iOS Home Screen Test</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>ComponentId: {componentId}</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Mode: {isHorizontalMode ? 'Horizontal' : 'Vertical'}</Text>
        </View>
        <PageContent>
          {
            isHorizontalMode
              ? <Horizontal />
              : <Vertical />
          }
        </PageContent>
      </View>
    )
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
