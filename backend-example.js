/**
 * 后端示例代码 (Node.js + Express)
 * 这是一个完整的文件分片上传后端实现示例
 *
 * 安装依赖:
 * npm install express multer fs-extra cors
 */

const express = require('express')
const multer = require('multer')
const fs = require('fs-extra')
const path = require('path')
const cors = require('cors')

const app = express()
const PORT = 3000

// 配置
const UPLOAD_DIR = path.join(__dirname, 'uploads') // 上传目录
const TEMP_DIR = path.join(__dirname, 'temp') // 临时目录（存储分片）

// 确保目录存在
fs.ensureDirSync(UPLOAD_DIR)
fs.ensureDirSync(TEMP_DIR)

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 配置 multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { hash } = req.body
    const chunkDir = path.join(TEMP_DIR, hash)
    fs.ensureDirSync(chunkDir)
    cb(null, chunkDir)
  },
  filename: (req, file, cb) => {
    const { index } = req.body
    cb(null, `chunk-${index}`)
  }
})

const upload = multer({ storage })

/**
 * 1. 上传分片
 * POST /api/upload/chunk
 */
app.post('/api/upload/chunk', upload.single('chunk'), async (req, res) => {
  try {
    const { index, total, hash, fileName, fileSize } = req.body

    console.log(`接收分片: ${fileName} - ${index}/${total}`)

    res.json({
      success: true,
      message: 'Chunk uploaded successfully',
      data: {
        index: parseInt(index),
        total: parseInt(total)
      }
    })
  } catch (error) {
    console.error('上传分片失败:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * 2. 合并分片
 * POST /api/upload/merge
 */
app.post('/api/upload/merge', async (req, res) => {
  try {
    const { fileName, hash, total, metadata } = req.body

    console.log(`开始合并文件: ${fileName}`)

    const chunkDir = path.join(TEMP_DIR, hash)
    const chunks = []

    // 检查所有分片是否都存在
    for (let i = 0; i < total; i++) {
      const chunkPath = path.join(chunkDir, `chunk-${i}`)
      if (!fs.existsSync(chunkPath)) {
        throw new Error(`分片 ${i} 不存在`)
      }
      chunks.push(chunkPath)
    }

    // 创建目标文件路径（保持文件夹结构）
    let targetPath = path.join(UPLOAD_DIR, fileName)

    // 如果有相对路径信息，保持文件夹结构
    if (metadata?.relativePath) {
      targetPath = path.join(UPLOAD_DIR, metadata.relativePath)
    }

    // 确保目标目录存在
    fs.ensureDirSync(path.dirname(targetPath))

    // 合并分片
    const writeStream = fs.createWriteStream(targetPath)

    for (const chunkPath of chunks) {
      const chunkBuffer = await fs.readFile(chunkPath)
      writeStream.write(chunkBuffer)
    }

    writeStream.end()

    // 等待写入完成
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })

    // 删除临时分片
    await fs.remove(chunkDir)

    console.log(`文件合并完成: ${fileName}`)

    res.json({
      success: true,
      message: 'File merged successfully',
      data: {
        fileUrl: `/uploads/${metadata?.relativePath || fileName}`,
        fileName,
        size: (await fs.stat(targetPath)).size
      }
    })
  } catch (error) {
    console.error('合并分片失败:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * 3. 检查文件是否已上传
 * GET /api/upload/check
 */
app.get('/api/upload/check', async (req, res) => {
  try {
    const { hash, fileName } = req.query

    // 检查文件是否已经完全上传
    const filePath = path.join(UPLOAD_DIR, fileName)
    if (fs.existsSync(filePath)) {
      return res.json({
        exists: true,
        uploadedChunks: []
      })
    }

    // 检查已上传的分片
    const chunkDir = path.join(TEMP_DIR, hash)
    let uploadedChunks = []

    if (fs.existsSync(chunkDir)) {
      const files = await fs.readdir(chunkDir)
      uploadedChunks = files
        .filter(file => file.startsWith('chunk-'))
        .map(file => parseInt(file.replace('chunk-', '')))
        .sort((a, b) => a - b)
    }

    res.json({
      exists: false,
      uploadedChunks
    })
  } catch (error) {
    console.error('检查文件失败:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * 4. 单文件上传（不分片）
 * POST /api/upload/single
 */
app.post('/api/upload/single', upload.single('file'), async (req, res) => {
  try {
    const file = req.file

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const targetPath = path.join(UPLOAD_DIR, file.originalname)
    await fs.move(file.path, targetPath, { overwrite: true })

    console.log(`单文件上传完成: ${file.originalname}`)

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileUrl: `/uploads/${file.originalname}`,
        fileName: file.originalname,
        size: file.size
      }
    })
  } catch (error) {
    console.error('单文件上传失败:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * 5. 静态文件服务
 */
app.use('/uploads', express.static(UPLOAD_DIR))

/**
 * 6. 清理临时文件（可选）
 * DELETE /api/upload/cleanup
 */
app.delete('/api/upload/cleanup', async (req, res) => {
  try {
    const { hash } = req.body

    if (hash) {
      // 清理指定的临时文件
      const chunkDir = path.join(TEMP_DIR, hash)
      if (fs.existsSync(chunkDir)) {
        await fs.remove(chunkDir)
      }
    } else {
      // 清理所有临时文件
      await fs.emptyDir(TEMP_DIR)
    }

    res.json({
      success: true,
      message: 'Cleanup completed'
    })
  } catch (error) {
    console.error('清理失败:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

/**
 * 7. 获取上传统计
 * GET /api/upload/stats
 */
app.get('/api/upload/stats', async (req, res) => {
  try {
    const uploadedFiles = await fs.readdir(UPLOAD_DIR)
    const tempDirs = await fs.readdir(TEMP_DIR)

    const stats = {
      uploadedFiles: uploadedFiles.length,
      pendingUploads: tempDirs.length,
      uploadDir: UPLOAD_DIR,
      tempDir: TEMP_DIR
    }

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('获取统计失败:', error)
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  文件上传服务器已启动                                    ║
║  端口: ${PORT}                                          ║
║  上传目录: ${UPLOAD_DIR}                                ║
║  临时目录: ${TEMP_DIR}                                  ║
╚════════════════════════════════════════════════════════╝

API 端点:
  POST   /api/upload/chunk      - 上传分片
  POST   /api/upload/merge      - 合并分片
  GET    /api/upload/check      - 检查文件状态
  POST   /api/upload/single     - 单文件上传
  DELETE /api/upload/cleanup    - 清理临时文件
  GET    /api/upload/stats      - 获取统计信息
  GET    /uploads/*             - 访问上传的文件
  `)
})

// 定期清理超过24小时的临时文件
setInterval(
  async () => {
    try {
      const dirs = await fs.readdir(TEMP_DIR)
      const now = Date.now()
      const maxAge = 24 * 60 * 60 * 1000 // 24小时

      for (const dir of dirs) {
        const dirPath = path.join(TEMP_DIR, dir)
        const stat = await fs.stat(dirPath)

        if (now - stat.mtimeMs > maxAge) {
          await fs.remove(dirPath)
          console.log(`清理过期临时文件: ${dir}`)
        }
      }
    } catch (error) {
      console.error('清理临时文件失败:', error)
    }
  },
  60 * 60 * 1000
) // 每小时执行一次

module.exports = app
