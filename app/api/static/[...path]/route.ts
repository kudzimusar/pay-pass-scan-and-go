import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const pathArray = path || []
    const filePath = join(process.cwd(), 'dist', 'public', ...pathArray)
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(join(process.cwd(), 'dist', 'public'))) {
      return new NextResponse('Forbidden', { status: 403 })
    }
    
    if (!existsSync(filePath)) {
      // Try index.html for SPA routing
      const indexPath = join(process.cwd(), 'dist', 'public', 'index.html')
      if (existsSync(indexPath)) {
        const content = await readFile(indexPath, 'utf-8')
        return new NextResponse(content, {
          headers: { 'Content-Type': 'text/html' },
        })
      }
      return new NextResponse('Not Found', { status: 404 })
    }
    
    const content = await readFile(filePath)
    const ext = filePath.split('.').pop()?.toLowerCase()
    
    const contentType = {
      'html': 'text/html',
      'js': 'application/javascript',
      'css': 'text/css',
      'json': 'application/json',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'ico': 'image/x-icon',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      'ttf': 'font/ttf',
      'eot': 'application/vnd.ms-fontobject',
    }[ext || ''] || 'application/octet-stream'
    
    // Handle text vs binary files
    const isTextFile = ['html', 'js', 'css', 'json', 'svg'].includes(ext || '')
    
    if (isTextFile) {
      return new NextResponse(content.toString('utf-8'), {
        headers: { 'Content-Type': contentType },
      })
    } else {
      return new NextResponse(new Uint8Array(content), {
        headers: { 'Content-Type': contentType },
      })
    }
  } catch (error) {
    console.error('Static file error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}