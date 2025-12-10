/**
 * Mock Upload Server
 * 用于模拟文件上传的后端API
 * 在实际项目中，应该替换为真实的后端接口
 */

import axios from 'axios'

// 模拟存储上传的分片
const chunkStorage = new Map<string, Map<number, Blob>>()
const uploadedFiles = new Set<string>()

/**
 * 设置 Mock 拦截器
 */
export const setupMockUploadServer = () => {
  // 拦截分片上传请求
  axios.interceptors.request.use(config => {
    if (config.url === '/api/upload/chunk' && config.method === 'post') {
      return new Promise(resolve => {
        setTimeout(
          () => {
            const formData = config.data as FormData
            const hash = formData.get('hash') as string
            const index = parseInt(formData.get('index') as string)
            const chunk = formData.get('chunk') as Blob

            if (!chunkStorage.has(hash)) {
              chunkStorage.set(hash, new Map())
            }

            chunkStorage.get(hash)!.set(index, chunk)

            console.log(`[Mock Server] Chunk uploaded: ${hash} - ${index}`)

            resolve({
              ...config,
              adapter: () =>
                Promise.resolve({
                  data: { success: true, message: 'Chunk uploaded' },
                  status: 200,
                  statusText: 'OK',
                  headers: {},
                  config
                })
            })
          },
          100 + Math.random() * 200
        ) // 模拟网络延迟 100-300ms
      })
    }

    // 拦截合并分片请求
    if (config.url === '/api/upload/merge' && config.method === 'post') {
      return new Promise(resolve => {
        setTimeout(
          () => {
            const { hash, fileName, total } = config.data

            const chunks = chunkStorage.get(hash)
            if (chunks && chunks.size === total) {
              uploadedFiles.add(hash)
              chunkStorage.delete(hash)
              console.log(`[Mock Server] File merged: ${fileName}`)
            }

            resolve({
              ...config,
              adapter: () =>
                Promise.resolve({
                  data: {
                    success: true,
                    message: 'File merged successfully',
                    fileUrl: `/uploads/${fileName}`
                  },
                  status: 200,
                  statusText: 'OK',
                  headers: {},
                  config
                })
            })
          },
          200 + Math.random() * 300
        ) // 模拟合并延迟 200-500ms
      })
    }

    // 拦截检查文件是否存在的请求
    if (config.url === '/api/upload/check' && config.method === 'get') {
      return new Promise(resolve => {
        setTimeout(() => {
          const hash = config.params?.hash
          const exists = uploadedFiles.has(hash)

          let uploadedChunks: number[] = []
          if (!exists && chunkStorage.has(hash)) {
            uploadedChunks = Array.from(chunkStorage.get(hash)!.keys())
          }

          resolve({
            ...config,
            adapter: () =>
              Promise.resolve({
                data: {
                  exists,
                  uploadedChunks
                },
                status: 200,
                statusText: 'OK',
                headers: {},
                config
              })
          })
        }, 50)
      })
    }

    // 拦截单文件上传请求
    if (config.url === '/api/upload/single' && config.method === 'post') {
      return new Promise(resolve => {
        setTimeout(
          () => {
            const formData = config.data as FormData
            const file = formData.get('file') as File

            console.log(`[Mock Server] Single file uploaded: ${file?.name}`)

            resolve({
              ...config,
              adapter: () =>
                Promise.resolve({
                  data: {
                    success: true,
                    message: 'File uploaded successfully',
                    fileUrl: `/uploads/${file?.name}`
                  },
                  status: 200,
                  statusText: 'OK',
                  headers: {},
                  config
                })
            })
          },
          500 + Math.random() * 1000
        ) // 模拟上传延迟 500-1500ms
      })
    }

    return config
  })

  console.log('[Mock Server] Upload server initialized')
}

/**
 * 清除所有上传数据
 */
export const clearMockUploadData = () => {
  chunkStorage.clear()
  uploadedFiles.clear()
  console.log('[Mock Server] All upload data cleared')
}

/**
 * 获取上传统计信息
 */
export const getMockUploadStats = () => {
  return {
    totalFiles: uploadedFiles.size,
    pendingChunks: Array.from(chunkStorage.entries()).map(([hash, chunks]) => ({
      hash,
      chunksCount: chunks.size
    }))
  }
}
