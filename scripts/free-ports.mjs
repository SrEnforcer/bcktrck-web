#!/usr/bin/env node

import { execSync, spawnSync } from 'node:child_process'

const DEV_PORTS = Object.freeze([5173, 8787])

const hasCommand = (commandName) =>
  spawnSync('sh', ['-c', `command -v ${commandName}`], { stdio: 'ignore' }).status === 0

const killByFuser = (port) => {
  try {
    execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' })
  } catch {
    // No process on this port or command returned a non-zero exit code.
  }
}

const killByLsof = (port) => {
  const findPids = () => {
    try {
      const rawPids = execSync(`lsof -ti tcp:${port}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim()

      if (rawPids.length === 0) {
        return []
      }

      return rawPids.split('\n').filter((pid) => pid.length > 0)
    } catch {
      return []
    }
  }

  const sendSignal = (pid, signal) => {
    try {
      process.kill(Number(pid), signal)
      return true
    } catch {
      return false
    }
  }

  const initialPids = findPids()

  initialPids.forEach((pid) => {
    sendSignal(pid, 'SIGTERM')
  })

  const remainingPids = findPids()

  remainingPids.forEach((pid) => {
    sendSignal(pid, 'SIGKILL')
  })
}

const freePort = (port) => {
  if (hasCommand('fuser')) {
    killByFuser(port)
  }

  if (hasCommand('lsof')) {
    killByLsof(port)
  }
}

DEV_PORTS.forEach(freePort)
