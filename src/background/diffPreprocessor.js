const FILE_PRIORITY = {
  high: /\.(ts|vue|js|tsx|jsx|java|py|go|rs|kt|swift)$/i,
  medium: /\.(test|spec)\.|__tests__|\/tests?\//i,
  low: /\.(yml|yaml|json|toml|xml|config|conf)$/i,
}

const NOISE_PATTERNS = [
  /^\+\s*$/,
  /^\-\s*$/,
  /^\+[\s]*\/\//,
  /^\-[\s]*\/\//,
  /^\+[\s]*\*/,
  /^\-[\s]*\*/,
  /^\+\s*import\s/,
  /^\-\s*import\s/,
]

const PRIORITY_ORDER = ['high', 'medium', 'low']
const TOKEN_BUDGET_PER_TYPE = { high: 800, medium: 400, low: 200 }
const TOTAL_TOKEN_BUDGET = 6000
const CHARS_PER_TOKEN = 4

function getFilePriority(filename) {
  if (FILE_PRIORITY.high.test(filename) && !FILE_PRIORITY.medium.test(filename)) return 'high'
  if (FILE_PRIORITY.medium.test(filename)) return 'medium'
  if (FILE_PRIORITY.low.test(filename)) return 'low'
  return 'high'
}

function isNoiseLine(line) {
  return NOISE_PATTERNS.some(p => p.test(line))
}

function filterNoise(patch) {
  if (!patch) return ''
  return patch.split('\n').filter(line => !isNoiseLine(line)).join('\n')
}

function estimateTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

export function preprocessDiff(files) {
  const scored = files.map(f => ({
    ...f,
    priority: getFilePriority(f.filename),
    cleanPatch: filterNoise(f.patch),
  }))

  scored.sort((a, b) => {
    const ai = PRIORITY_ORDER.indexOf(a.priority)
    const bi = PRIORITY_ORDER.indexOf(b.priority)
    return ai - bi
  })

  let totalTokens = 0
  const parts = []

  for (const file of scored) {
    const budget = TOKEN_BUDGET_PER_TYPE[file.priority]
    const patchTokens = estimateTokens(file.cleanPatch)

    if (totalTokens >= TOTAL_TOKEN_BUDGET) {
      parts.push(`File: ${file.filename} (${file.status}, +${file.additions}/-${file.deletions}) — [已跳过，超出 Token 预算]`)
      continue
    }

    if (patchTokens <= budget) {
      if (totalTokens + patchTokens <= TOTAL_TOKEN_BUDGET) {
        parts.push(`File: ${file.filename} (${file.status}, +${file.additions}/-${file.deletions})\n\`\`\`diff\n${file.cleanPatch}\n\`\`\``)
        totalTokens += patchTokens
      } else {
        parts.push(`File: ${file.filename} (${file.status}, +${file.additions}/-${file.deletions}) — [已跳过，超出 Token 预算]`)
      }
    } else {
      const truncated = file.cleanPatch.slice(0, budget * CHARS_PER_TOKEN)
      parts.push(`File: ${file.filename} (${file.status}, +${file.additions}/-${file.deletions})\n\`\`\`diff\n${truncated}\n\`\`\`\n[内容已截断，仅展示前 ${budget} token]`)
      totalTokens += budget
    }
  }

  return {
    diffText: parts.join('\n\n'),
    fileCount: files.length,
    processedCount: scored.length,
    tokenEstimate: totalTokens,
  }
}
