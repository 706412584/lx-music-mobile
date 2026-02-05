import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { useDownloadList, downloadAction } from '@/store/download'
import { scaleSizeW, scaleSizeH } from '@/utils/pixelRatio'

// Test music data
const testMusicList: LX.Music.MusicInfoOnline[] = [
  {
    id: 'test_001',
    name: '测试歌曲1',
    singer: '测试歌手1',
    source: 'kw',
    interval: '03:45',
    albumName: '测试专辑',
    img: '',
    lrc: null,
    otherSource: null,
    typeUrl: {},
  },
  {
    id: 'test_002',
    name: '测试歌曲2',
    singer: '测试歌手2',
    source: 'kg',
    interval: '04:20',
    albumName: '测试专辑2',
    img: '',
    lrc: null,
    otherSource: null,
    typeUrl: {},
  },
]

const DownloadTest = () => {
  const theme = useTheme()
  const downloadList = useDownloadList()
  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${result}`])
  }

  // Test 1: Add a download task
  const testAddDownload = async() => {
    try {
      addTestResult('测试1: 添加下载任务...')
      const music = testMusicList[0]
      await downloadAction.addDownload(music, '128k')
      addTestResult('✓ 成功添加下载任务')
    } catch (error: any) {
      addTestResult(`✗ 添加下载任务失败: ${error.message}`)
    }
  }

  // Test 2: Add multiple downloads
  const testAddMultipleDownloads = async() => {
    try {
      addTestResult('测试2: 添加多个下载任务...')
      for (const music of testMusicList) {
        await downloadAction.addDownload(music, '128k')
      }
      addTestResult(`✓ 成功添加 ${testMusicList.length} 个下载任务`)
    } catch (error: any) {
      addTestResult(`✗ 添加多个下载任务失败: ${error.message}`)
    }
  }

  // Test 3: Pause download
  const testPauseDownload = async() => {
    try {
      if (downloadList.length === 0) {
        addTestResult('✗ 没有可暂停的下载任务')
        return
      }
      addTestResult('测试3: 暂停下载任务...')
      const runningTask = downloadList.find(item => item.status === 'run')
      if (runningTask) {
        await downloadAction.pauseDownload(runningTask.id)
        addTestResult(`✓ 成功暂停任务: ${runningTask.metadata.musicInfo.name}`)
      } else {
        addTestResult('✗ 没有正在运行的下载任务')
      }
    } catch (error: any) {
      addTestResult(`✗ 暂停下载失败: ${error.message}`)
    }
  }

  // Test 4: Resume download
  const testResumeDownload = async() => {
    try {
      if (downloadList.length === 0) {
        addTestResult('✗ 没有可恢复的下载任务')
        return
      }
      addTestResult('测试4: 恢复下载任务...')
      const pausedTask = downloadList.find(item => item.status === 'pause')
      if (pausedTask) {
        await downloadAction.resumeDownload(pausedTask.id)
        addTestResult(`✓ 成功恢复任务: ${pausedTask.metadata.musicInfo.name}`)
      } else {
        addTestResult('✗ 没有已暂停的下载任务')
      }
    } catch (error: any) {
      addTestResult(`✗ 恢复下载失败: ${error.message}`)
    }
  }

  // Test 5: Remove download
  const testRemoveDownload = async() => {
    try {
      if (downloadList.length === 0) {
        addTestResult('✗ 没有可删除的下载任务')
        return
      }
      addTestResult('测试5: 删除下载任务...')
      const task = downloadList[0]
      await downloadAction.removeDownload(task.id)
      addTestResult(`✓ 成功删除任务: ${task.metadata.musicInfo.name}`)
    } catch (error: any) {
      addTestResult(`✗ 删除下载失败: ${error.message}`)
    }
  }

  // Test 6: Clear completed
  const testClearCompleted = () => {
    try {
      addTestResult('测试6: 清除已完成任务...')
      const completedCount = downloadList.filter(item => item.isComplate).length
      downloadAction.clearCompleted()
      addTestResult(`✓ 成功清除 ${completedCount} 个已完成任务`)
    } catch (error: any) {
      addTestResult(`✗ 清除已完成任务失败: ${error.message}`)
    }
  }

  // Test 7: Clear all
  const testClearAll = () => {
    Alert.alert(
      '确认',
      '确定要清空所有下载任务吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            try {
              addTestResult('测试7: 清空所有任务...')
              const count = downloadList.length
              downloadAction.clearAll()
              addTestResult(`✓ 成功清空 ${count} 个任务`)
            } catch (error: any) {
              addTestResult(`✗ 清空所有任务失败: ${error.message}`)
            }
          },
        },
      ],
    )
  }

  const clearTestResults = () => {
    setTestResults([])
  }

  return (
    <View style={[styles.container, { backgroundColor: theme['c-primary-background'] }]}>
      <View style={[styles.header, { backgroundColor: theme['c-content-background'] }]}>
        <Text style={[styles.headerTitle, { color: theme['c-font'] }]}>
          下载功能测试
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme['c-font-label'] }]}>
          当前任务数: {downloadList.length}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
            基础功能测试
          </Text>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme['c-primary'] }]}
            onPress={testAddDownload}
          >
            <Text style={styles.testButtonText}>测试1: 添加单个下载</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme['c-primary'] }]}
            onPress={testAddMultipleDownloads}
          >
            <Text style={styles.testButtonText}>测试2: 添加多个下载</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme['c-primary'] }]}
            onPress={testPauseDownload}
          >
            <Text style={styles.testButtonText}>测试3: 暂停下载</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme['c-primary'] }]}
            onPress={testResumeDownload}
          >
            <Text style={styles.testButtonText}>测试4: 恢复下载</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme['c-primary'] }]}
            onPress={testRemoveDownload}
          >
            <Text style={styles.testButtonText}>测试5: 删除任务</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme['c-primary'] }]}
            onPress={testClearCompleted}
          >
            <Text style={styles.testButtonText}>测试6: 清除已完成</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: theme['c-error'] }]}
            onPress={testClearAll}
          >
            <Text style={styles.testButtonText}>测试7: 清空所有</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.resultHeader}>
            <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
              测试结果
            </Text>
            <TouchableOpacity onPress={clearTestResults}>
              <Text style={[styles.clearButton, { color: theme['c-primary'] }]}>
                清空
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.resultBox, { backgroundColor: theme['c-content-background'] }]}>
            {testResults.length === 0 ? (
              <Text style={[styles.resultText, { color: theme['c-font-label'] }]}>
                暂无测试结果
              </Text>
            ) : (
              testResults.map((result, index) => (
                <Text
                  key={index}
                  style={[
                    styles.resultText,
                    {
                      color: result.includes('✓')
                        ? theme['c-primary']
                        : result.includes('✗')
                          ? theme['c-error']
                          : theme['c-font'],
                    },
                  ]}
                >
                  {result}
                </Text>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
            当前下载列表
          </Text>
          {downloadList.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme['c-font-label'] }]}>
              暂无下载任务
            </Text>
          ) : (
            downloadList.map((item) => (
              <View
                key={item.id}
                style={[styles.listItem, { backgroundColor: theme['c-content-background'] }]}
              >
                <Text style={[styles.listItemName, { color: theme['c-font'] }]}>
                  {item.metadata.musicInfo.name}
                </Text>
                <Text style={[styles.listItemInfo, { color: theme['c-font-label'] }]}>
                  状态: {item.statusText} | 进度: {item.progress.toFixed(1)}%
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: scaleSizeW(15),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: scaleSizeW(18),
    fontWeight: 'bold',
    marginBottom: scaleSizeH(5),
  },
  headerSubtitle: {
    fontSize: scaleSizeW(14),
  },
  content: {
    flex: 1,
  },
  section: {
    padding: scaleSizeW(15),
  },
  sectionTitle: {
    fontSize: scaleSizeW(16),
    fontWeight: 'bold',
    marginBottom: scaleSizeH(10),
  },
  testButton: {
    padding: scaleSizeW(12),
    borderRadius: scaleSizeW(8),
    marginBottom: scaleSizeH(10),
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: scaleSizeW(14),
    fontWeight: '500',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: scaleSizeH(10),
  },
  clearButton: {
    fontSize: scaleSizeW(14),
  },
  resultBox: {
    padding: scaleSizeW(12),
    borderRadius: scaleSizeW(8),
    minHeight: scaleSizeH(100),
  },
  resultText: {
    fontSize: scaleSizeW(12),
    marginBottom: scaleSizeH(5),
    fontFamily: 'monospace',
  },
  emptyText: {
    fontSize: scaleSizeW(14),
    textAlign: 'center',
    marginTop: scaleSizeH(20),
  },
  listItem: {
    padding: scaleSizeW(12),
    borderRadius: scaleSizeW(8),
    marginBottom: scaleSizeH(8),
  },
  listItemName: {
    fontSize: scaleSizeW(14),
    fontWeight: '500',
    marginBottom: scaleSizeH(4),
  },
  listItemInfo: {
    fontSize: scaleSizeW(12),
  },
})

export default DownloadTest
