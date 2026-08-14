#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const READY_STATUS = 'ready-for-agent'
const RESOLVED_STATUS = 'resolved'

function slash(path) {
  return path.split(sep).join('/')
}

function metadataValue(markdown, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`^\\s*(?:\\*\\*)?${escaped}:(?:\\*\\*)?\\s*(.*)$`, 'im')
  return markdown.match(pattern)?.[1]?.trim() ?? ''
}

export function parseIssue(filePath, root = process.cwd()) {
  const markdown = readFileSync(filePath, 'utf8')
  const fileName = basename(filePath)
  const numberMatch = fileName.match(/^(\d+)-/)
  if (!numberMatch) throw new Error(`Issue filename must begin with a number: ${filePath}`)

  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? fileName
  const title = heading.replace(/^\d+\s*[—–-]\s*/, '').trim()
  const blockedText = metadataValue(markdown, 'Blocked by')
  const blockers = /^(none\b|$)/i.test(blockedText)
    ? []
    : [...blockedText.matchAll(/\b(\d{1,3})\b/g)].map((match) => Number(match[1]))
  const acceptanceCriteria = [...markdown.matchAll(/^\s*-\s*\[[ xX]\]\s+(.+)$/gm)]
    .map((match) => match[1].trim())
  const description = metadataValue(markdown, 'What to build')
    || markdown.match(/^##\s+Question\s*\r?\n+([^#]+?)(?:\r?\n\r?\n|$)/m)?.[1]?.trim()
    || title

  return {
    number: Number(numberMatch[1]),
    title,
    status: metadataValue(markdown, 'Status').toLowerCase(),
    blockers: [...new Set(blockers)],
    acceptanceCriteria,
    description,
    sourcePath: slash(relative(root, filePath)),
  }
}

export function readIssues(effortDirectory, root = process.cwd()) {
  const issuesDirectory = join(effortDirectory, 'issues')
  if (!existsSync(issuesDirectory)) throw new Error(`Issues directory not found: ${issuesDirectory}`)

  return readdirSync(issuesDirectory)
    .filter((name) => /^\d+-.*\.md$/i.test(name))
    .map((name) => parseIssue(join(issuesDirectory, name), root))
    .sort((left, right) => left.number - right.number)
}

function selectEligibleIssues(issues) {
  const byNumber = new Map(issues.map((issue) => [issue.number, issue]))
  const candidates = new Map(
    issues.filter((issue) => issue.status === READY_STATUS).map((issue) => [issue.number, issue]),
  )
  const excluded = new Map()

  let changed = true
  while (changed) {
    changed = false
    for (const issue of candidates.values()) {
      const unresolvedExternal = issue.blockers.filter((number) => {
        const blocker = byNumber.get(number)
        return !blocker || (blocker.status !== RESOLVED_STATUS && !candidates.has(number))
      })
      if (unresolvedExternal.length > 0) {
        candidates.delete(issue.number)
        excluded.set(issue.number, { issue, unresolvedBlockers: unresolvedExternal })
        changed = true
      }
    }
  }

  for (const issue of issues) {
    if (issue.status === READY_STATUS && !candidates.has(issue.number) && !excluded.has(issue.number)) {
      const unresolvedBlockers = issue.blockers.filter((number) => byNumber.get(number)?.status !== RESOLVED_STATUS)
      excluded.set(issue.number, { issue, unresolvedBlockers })
    }
  }

  return { candidates, excluded }
}

function topologicalOrder(candidates) {
  const ordered = []
  const visiting = new Set()
  const visited = new Set()

  function visit(issue) {
    if (visited.has(issue.number)) return
    if (visiting.has(issue.number)) throw new Error(`Issue dependency cycle includes ${issue.number}`)
    visiting.add(issue.number)
    for (const blockerNumber of issue.blockers) {
      const blocker = candidates.get(blockerNumber)
      if (blocker) visit(blocker)
    }
    visiting.delete(issue.number)
    visited.add(issue.number)
    ordered.push(issue)
  }

  for (const issue of [...candidates.values()].sort((a, b) => a.number - b.number)) visit(issue)
  return ordered
}

function taskId(issueNumber, criterionIndex) {
  return `ISSUE-${String(issueNumber).padStart(2, '0')}-${String(criterionIndex + 1).padStart(2, '0')}`
}

function lastTaskId(issue) {
  return taskId(issue.number, issue.acceptanceCriteria.length - 1)
}

function readPreviousPasses(outputDirectory) {
  const taskListPath = join(outputDirectory, 'tasks.json')
  if (!existsSync(taskListPath)) return new Map()
  const tasks = JSON.parse(readFileSync(taskListPath, 'utf8'))
  return new Map(tasks.map((task) => [task.id, task.passes === true]))
}

export function buildQueue(issues, previousPasses = new Map(), specDirectory = '.agent/tasks') {
  const { candidates, excluded } = selectEligibleIssues(issues)
  const orderedIssues = topologicalOrder(candidates)
  const tasks = []
  const specs = new Map()

  for (const issue of orderedIssues) {
    if (issue.acceptanceCriteria.length === 0) {
      throw new Error(`Ready issue ${issue.number} has no checklist acceptance criteria`)
    }

    issue.acceptanceCriteria.forEach((criterion, criterionIndex) => {
      const id = taskId(issue.number, criterionIndex)
      const dependencies = criterionIndex > 0
        ? [taskId(issue.number, criterionIndex - 1)]
        : issue.blockers
          .map((number) => candidates.get(number))
          .filter(Boolean)
          .map(lastTaskId)

      tasks.push({
        id,
        title: `${issue.number}: ${criterion}`,
        category: 'functional',
        specFilePath: `${slash(specDirectory)}/${id}.json`,
        passes: previousPasses.get(id) === true,
      })

      const steps = [
        {
          step: 1,
          description: 'Read the source issue and repository constraints',
          details: `Read ${issue.sourcePath}, AGENTS.md, CONTEXT.md, and relevant ADRs before changing code. Preserve the full source issue contract while focusing this invocation on one criterion.`,
          pass: false,
        },
        {
          step: 2,
          description: 'Implement the criterion',
          details: `Make the smallest coherent implementation that satisfies: ${criterion}`,
          pass: false,
        },
        {
          step: 3,
          description: 'Add focused verification',
          details: 'Add or update automated tests that verify the user-visible behavior or domain result without weakening existing coverage.',
          pass: false,
        },
        {
          step: 4,
          description: 'Run repository verification',
          details: 'Run the applicable formatting, lint, type-check, unit, integration, and browser checks declared by the repository. During bootstrap, run only checks that the completed setup makes available.',
          pass: false,
        },
      ]

      specs.set(id, {
        id,
        title: `${issue.number}: ${criterion}`,
        category: 'functional',
        description: `${issue.description}\n\nThis task implements one acceptance criterion from issue ${issue.number}.`,
        acceptanceCriteria: [criterion],
        steps,
        dependencies,
        estimatedComplexity: 'medium',
        technicalNotes: [
          `Source issue: ${issue.sourcePath}`,
          `Source issue number: ${issue.number}`,
          'The Markdown issue is the planning source of truth; this JSON file is generated.',
        ],
      })
    })
  }

  return { tasks, specs, excluded: [...excluded.values()] }
}

export function generate(effortDirectory, outputDirectory, root = process.cwd()) {
  const issues = readIssues(effortDirectory, root)
  const tasksDirectory = join(outputDirectory, 'tasks')
  const queue = buildQueue(
    issues,
    readPreviousPasses(outputDirectory),
    relative(root, tasksDirectory),
  )
  mkdirSync(tasksDirectory, { recursive: true })

  writeFileSync(join(outputDirectory, 'tasks.json'), `${JSON.stringify(queue.tasks, null, 2)}\n`)
  for (const [id, spec] of queue.specs) {
    writeFileSync(join(tasksDirectory, `${id}.json`), `${JSON.stringify(spec, null, 2)}\n`)
  }
  writeFileSync(join(outputDirectory, 'blocked-issues.json'), `${JSON.stringify(
    queue.excluded.map(({ issue, unresolvedBlockers }) => ({
      issue: issue.number,
      title: issue.title,
      sourcePath: issue.sourcePath,
      unresolvedBlockers,
    })),
    null,
    2,
  )}\n`)

  return queue
}

export function validate(effortDirectory, outputDirectory, root = process.cwd()) {
  const errors = []
  const issues = readIssues(effortDirectory, root)
  const taskListPath = join(outputDirectory, 'tasks.json')
  if (!existsSync(taskListPath)) return ['Generated task list does not exist']

  let tasks
  try {
    tasks = JSON.parse(readFileSync(taskListPath, 'utf8'))
  } catch (error) {
    return [`Cannot parse generated task list: ${error.message}`]
  }

  const ids = new Set()
  const taskIndex = new Map()
  const tasksByIssue = new Map()

  tasks.forEach((task, index) => {
    if (ids.has(task.id)) errors.push(`Duplicate task ID: ${task.id}`)
    ids.add(task.id)
    taskIndex.set(task.id, index)

    const specPath = resolve(root, task.specFilePath)
    if (!existsSync(specPath)) {
      errors.push(`Missing task spec: ${task.specFilePath}`)
      return
    }

    let spec
    try {
      spec = JSON.parse(readFileSync(specPath, 'utf8'))
    } catch (error) {
      errors.push(`Cannot parse ${task.specFilePath}: ${error.message}`)
      return
    }

    if (spec.id !== task.id) errors.push(`Task ID mismatch in ${task.specFilePath}`)
    for (const dependency of spec.dependencies ?? []) {
      if (!ids.has(dependency)) errors.push(`${task.id} depends on missing or later task ${dependency}`)
    }

    const issueNumber = Number(spec.technicalNotes?.find((note) => note.startsWith('Source issue number:'))?.split(':')[1])
    if (!Number.isInteger(issueNumber)) {
      errors.push(`${task.id} has no source issue number`)
      return
    }
    const group = tasksByIssue.get(issueNumber) ?? []
    group.push({ task, spec })
    tasksByIssue.set(issueNumber, group)
  })

  const issueByNumber = new Map(issues.map((issue) => [issue.number, issue]))
  const expected = buildQueue(
    issues,
    new Map(tasks.map((task) => [task.id, task.passes === true])),
    relative(root, join(outputDirectory, 'tasks')),
  )
  const expectedIds = expected.tasks.map((task) => task.id)
  const activeIds = tasks
    .filter((task) => {
      const issueNumber = Number(task.id.match(/^ISSUE-(\d+)-/)?.[1])
      return issueByNumber.get(issueNumber)?.status !== RESOLVED_STATUS
    })
    .map((task) => task.id)
  if (JSON.stringify(activeIds) !== JSON.stringify(expectedIds)) {
    errors.push('Generated task IDs or ordering differ from the current runnable issue graph; regenerate the queue')
  }

  for (const issue of issues) {
    const group = tasksByIssue.get(issue.number)
    if (!group) continue
    const represented = group.map(({ spec }) => spec.acceptanceCriteria?.[0])
    if (JSON.stringify(represented) !== JSON.stringify(issue.acceptanceCriteria)) {
      errors.push(`Issue ${issue.number} acceptance criteria are not represented exactly once and in order`)
    }
    const allPassed = group.every(({ task }) => task.passes === true)
    if (allPassed && issue.status !== RESOLVED_STATUS) {
      errors.push(`Issue ${issue.number} must be resolved because all derived tasks pass`)
    }
    if (!allPassed && issue.status === RESOLVED_STATUS) {
      errors.push(`Issue ${issue.number} is resolved while derived tasks remain incomplete`)
    }
  }

  return errors
}

export function syncCompletion(effortDirectory, outputDirectory, root = process.cwd()) {
  const issues = readIssues(effortDirectory, root)
  const tasks = JSON.parse(readFileSync(join(outputDirectory, 'tasks.json'), 'utf8'))
  const passedByIssue = new Map()

  for (const task of tasks) {
    const spec = JSON.parse(readFileSync(resolve(root, task.specFilePath), 'utf8'))
    const issueNumber = Number(spec.technicalNotes?.find((note) => note.startsWith('Source issue number:'))?.split(':')[1])
    if (!Number.isInteger(issueNumber)) continue
    const states = passedByIssue.get(issueNumber) ?? []
    states.push(task.passes === true)
    passedByIssue.set(issueNumber, states)
  }

  const resolvedIssues = []
  for (const issue of issues) {
    const states = passedByIssue.get(issue.number)
    if (!states?.length || !states.every(Boolean) || issue.status === RESOLVED_STATUS) continue

    const issuePath = resolve(root, issue.sourcePath)
    const markdown = readFileSync(issuePath, 'utf8')
    const updated = markdown.replace(
      /^(\s*(?:\*\*)?Status:(?:\*\*)?\s*).*$/im,
      '$1resolved',
    )
    if (updated === markdown) throw new Error(`Could not update Status in ${issue.sourcePath}`)
    writeFileSync(issuePath, updated)
    resolvedIssues.push(issue.number)
  }

  return resolvedIssues
}

function usage() {
  console.log('Usage: node scripts/ralph-tasks.mjs <generate|validate|sync> <effort-directory> [--out <agent-directory>]')
}

function main(argv) {
  const [command, effortArgument, ...rest] = argv
  if (!command || !effortArgument || !['generate', 'validate', 'sync'].includes(command)) {
    usage()
    return 1
  }

  const outIndex = rest.indexOf('--out')
  const outputDirectory = resolve(outIndex >= 0 ? rest[outIndex + 1] : '.agent')
  const effortDirectory = resolve(effortArgument)

  if (command === 'generate') {
    const queue = generate(effortDirectory, outputDirectory)
    console.log(`Generated ${queue.tasks.length} tasks; ${queue.excluded.length} ready issues remain blocked.`)
    return 0
  }

  if (command === 'sync') {
    const resolvedIssues = syncCompletion(effortDirectory, outputDirectory)
    console.log(resolvedIssues.length > 0
      ? `Resolved source issues: ${resolvedIssues.join(', ')}`
      : 'No source issues became resolved.')
    return 0
  }

  const errors = validate(effortDirectory, outputDirectory)
  if (errors.length > 0) {
    for (const error of errors) console.error(`ERROR: ${error}`)
    return 1
  }
  console.log('Ralph task queue is valid.')
  return 0
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2))
