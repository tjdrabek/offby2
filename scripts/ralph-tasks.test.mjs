import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'

import { buildQueue, generate, parseIssue, syncCompletion, validate } from './ralph-tasks.mjs'

function writeIssue(root, number, slug, { title, status, blockedBy = 'None', criteria = [] }) {
  const filePath = join(root, '.scratch', 'effort', 'issues', `${String(number).padStart(2, '0')}-${slug}.md`)
  mkdirSync(join(root, '.scratch', 'effort', 'issues'), { recursive: true })
  writeFileSync(filePath, [
    `# ${number} — ${title}`,
    '',
    `**What to build:** ${title} behavior.`,
    '',
    `**Blocked by:** ${blockedBy}`,
    '',
    `**Status:** ${status}`,
    '',
    ...criteria.map((criterion) => `- [ ] ${criterion}`),
    '',
  ].join('\n'))
  return filePath
}

test('parses bold issue metadata and acceptance criteria', () => {
  const root = mkdtempSync(join(tmpdir(), 'ralph-tasks-'))
  try {
    const filePath = writeIssue(root, 14, 'shell', {
      title: 'Create shell',
      status: 'ready-for-agent',
      criteria: ['Project persists', 'Offline startup works'],
    })
    assert.deepEqual(parseIssue(filePath, root), {
      number: 14,
      title: 'Create shell',
      status: 'ready-for-agent',
      blockers: [],
      acceptanceCriteria: ['Project persists', 'Offline startup works'],
      description: 'Create shell behavior.',
      sourcePath: '.scratch/effort/issues/14-shell.md',
    })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('splits criteria, orders dependencies, and reports external blockers', () => {
  const issues = [
    { number: 13, title: 'Materials', status: 'open', blockers: [], acceptanceCriteria: [], description: '', sourcePath: '13.md' },
    { number: 14, title: 'Shell', status: 'ready-for-agent', blockers: [], acceptanceCriteria: ['Create', 'Persist'], description: '', sourcePath: '14.md' },
    { number: 15, title: 'Layout', status: 'ready-for-agent', blockers: [14], acceptanceCriteria: ['Revise'], description: '', sourcePath: '15.md' },
    { number: 16, title: 'Physical', status: 'ready-for-agent', blockers: [13], acceptanceCriteria: ['Measure'], description: '', sourcePath: '16.md' },
  ]

  const queue = buildQueue(issues)
  assert.deepEqual(queue.tasks.map((task) => task.id), ['ISSUE-14-01', 'ISSUE-14-02', 'ISSUE-15-01'])
  assert.deepEqual(queue.specs.get('ISSUE-14-02').dependencies, ['ISSUE-14-01'])
  assert.deepEqual(queue.specs.get('ISSUE-15-01').dependencies, ['ISSUE-14-02'])
  assert.deepEqual(queue.excluded.map(({ issue }) => issue.number), [16])
})

test('generates and validates a queue, preserving completed task state', () => {
  const root = mkdtempSync(join(tmpdir(), 'ralph-tasks-'))
  try {
    const effort = join(root, '.scratch', 'effort')
    const output = join(root, '.agent')
    writeIssue(root, 14, 'shell', {
      title: 'Create shell',
      status: 'ready-for-agent',
      criteria: ['Project persists', 'Offline startup works'],
    })

    generate(effort, output, root)
    assert.deepEqual(validate(effort, output, root), [])

    const tasksPath = join(output, 'tasks.json')
    const tasks = JSON.parse(readFileSync(tasksPath, 'utf8'))
    tasks[0].passes = true
    writeFileSync(tasksPath, `${JSON.stringify(tasks, null, 2)}\n`)
    generate(effort, output, root)

    const regenerated = JSON.parse(readFileSync(tasksPath, 'utf8'))
    assert.equal(regenerated[0].passes, true)
    assert.equal(regenerated[1].passes, false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('resolves a source issue only after every derived task passes', () => {
  const root = mkdtempSync(join(tmpdir(), 'ralph-tasks-'))
  try {
    const effort = join(root, '.scratch', 'effort')
    const output = join(root, '.agent')
    const issuePath = writeIssue(root, 14, 'shell', {
      title: 'Create shell',
      status: 'ready-for-agent',
      criteria: ['Project persists', 'Offline startup works'],
    })

    generate(effort, output, root)
    const tasksPath = join(output, 'tasks.json')
    const tasks = JSON.parse(readFileSync(tasksPath, 'utf8'))
    tasks[0].passes = true
    writeFileSync(tasksPath, `${JSON.stringify(tasks, null, 2)}\n`)
    assert.deepEqual(syncCompletion(effort, output, root), [])

    tasks[1].passes = true
    writeFileSync(tasksPath, `${JSON.stringify(tasks, null, 2)}\n`)
    assert.deepEqual(syncCompletion(effort, output, root), [14])
    assert.match(readFileSync(issuePath, 'utf8'), /\*\*Status:\*\* resolved/)
    assert.deepEqual(validate(effort, output, root), [])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
