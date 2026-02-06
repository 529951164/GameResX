import { readFile, writeFile, access } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'

const GITIGNORE_RULES = [
  '',
  '# GameResX - 图片备份文件和配置',
  '*.back',
  '.gameresx/'
]

/**
 * 向上查找 .gitignore 文件
 * @param startPath 起始路径
 * @param maxDepth 最大向上查找层数（1-5）
 * @returns .gitignore 文件的完整路径，如果未找到则返回 null
 */
export async function findGitignore(startPath: string, maxDepth: number = 5): Promise<string | null> {
  let currentPath = startPath
  let depth = 0

  // 限制向上查找的层数
  const limitedDepth = Math.min(Math.max(maxDepth, 1), 5)

  while (depth < limitedDepth) {
    const gitignorePath = join(currentPath, '.gitignore')

    try {
      await access(gitignorePath)
      console.log(`[GitIgnore] Found .gitignore at: ${gitignorePath}`)
      return gitignorePath
    } catch {
      // 文件不存在，继续向上查找
    }

    // 检查是否到达根目录
    const parentPath = dirname(currentPath)
    if (parentPath === currentPath) {
      break // 已到达根目录
    }

    currentPath = parentPath
    depth++
  }

  console.log(`[GitIgnore] No .gitignore found within ${limitedDepth} levels`)
  return null
}

/**
 * 检查 .gitignore 是否已包含 GameResX 的规则
 */
export async function checkGitignoreRules(gitignorePath: string): Promise<boolean> {
  try {
    const content = await readFile(gitignorePath, 'utf-8')

    // 检查是否包含 *.back 规则
    const hasBackRule = content.includes('*.back')
    const hasConfigRule = content.includes('.gameresx/')

    return hasBackRule && hasConfigRule
  } catch (error) {
    console.error(`[GitIgnore] Error reading .gitignore: ${error}`)
    return false
  }
}

/**
 * 将 GameResX 规则添加到 .gitignore
 */
export async function addGitignoreRules(gitignorePath: string): Promise<void> {
  try {
    let content = ''

    // 如果文件存在，先读取内容
    if (existsSync(gitignorePath)) {
      content = await readFile(gitignorePath, 'utf-8')

      // 确保文件末尾有换行符
      if (content.length > 0 && !content.endsWith('\n')) {
        content += '\n'
      }
    }

    // 添加 GameResX 规则
    content += GITIGNORE_RULES.join('\n') + '\n'

    await writeFile(gitignorePath, content, 'utf-8')
    console.log(`[GitIgnore] Added GameResX rules to: ${gitignorePath}`)
  } catch (error) {
    console.error(`[GitIgnore] Error writing .gitignore: ${error}`)
    throw error
  }
}

/**
 * 检查项目是否需要配置 .gitignore
 * @returns { needsConfig: boolean, gitignorePath: string | null }
 */
export async function checkProjectGitignore(
  projectPath: string
): Promise<{ needsConfig: boolean; gitignorePath: string | null }> {
  // 向上查找 .gitignore 文件（最多5层）
  const gitignorePath = await findGitignore(projectPath, 5)

  if (!gitignorePath) {
    // 没有找到 .gitignore，不需要配置
    return { needsConfig: false, gitignorePath: null }
  }

  // 检查是否已包含 GameResX 规则
  const hasRules = await checkGitignoreRules(gitignorePath)

  return {
    needsConfig: !hasRules,
    gitignorePath
  }
}
