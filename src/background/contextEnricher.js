import { getFileContent } from './github.js'

const FUNC_PATTERNS = [
  /^\+\s*(export\s+)?(async\s+)?function\s+\w+/,
  /^\+\s*(export\s+)?(async\s+)?def\s+\w+/,
  /^\+\s*(export\s+)?(async\s+)?fun\s+\w+/,
  /^\+\s*(export\s+)?(public|private|protected)?\s*(async\s+)?\w+\s*\(/,
  /^\+\s*const\s+\w+\s*=\s*(async\s+)?\(/,
  /^\+\s*const\s+\w+\s*=\s*(async\s+)?function/,
]

function isCoreFile(filename) {
  if (/\.(test|spec)\.|__tests__|\/tests?\//i.test(filename)) return false
  if (/\.(yml|yaml|json|toml|xml|md)$/i.test(filename)) return false
  return true
}

function hasFuncSignatureChange(patch) {
  if (!patch) return false
  const lines = patch.split('\n')
  return lines.some(line => FUNC_PATTERNS.some(p => p.test(line)))
}

function isHighRisk(file) {
  if (!isCoreFile(file.filename)) return false
  const totalChanges = (file.additions || 0) + (file.deletions || 0)
  return hasFuncSignatureChange(file.patch) || totalChanges > 50
}

function extractFunctionBodies(content, maxContext = 20) {
  const funcRegex = /(export\s+)?(async\s+)?(function|def|fun)\s+\w+\s*\(/g
  const lines = content.split('\n')
  const matches = []
  let match

  while ((match = funcRegex.exec(content)) !== null) {
    const lineIndex = content.slice(0, match.index).split('\n').length - 1
    const start = Math.max(0, lineIndex - maxContext)
    const end = Math.min(lines.length, lineIndex + maxContext + 1)
    matches.push({
      funcName: match[0],
      startLine: lineIndex + 1,
      snippet: lines.slice(start, end).join('\n'),
    })
  }

  return matches
}

export async function enrichContext(files, owner, repo, head) {
  const candidates = files.filter(isHighRisk).slice(0, 3)
  if (candidates.length === 0) return ''

  const enrichments = await Promise.all(candidates.map(async (file) => {
    try {
      const content = await getFileContent(owner, repo, file.filename, head)
      const funcs = extractFunctionBodies(content)

      let section = `## 上下文增强 — ${file.filename}\n`
      if (funcs.length > 0) {
        section += funcs.map(f =>
          `\`\`\`\n// 函数: ${f.funcName} (行 ${f.startLine} 附近)\n${f.snippet}\n\`\`\``
        ).join('\n\n')
      } else {
        section += `文件完整内容:\n\`\`\`\n${content.slice(0, 2000)}\n\`\`\``
      }
      return section
    } catch {
      return `## 上下文增强 — ${file.filename}\n[无法获取文件内容]`
    }
  }))

  return enrichments.join('\n\n')
}
