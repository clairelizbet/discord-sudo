import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ghDir = resolve(process.cwd(), '.github')
const ghDistDir = resolve(ghDir, 'dist')

const templateFile = resolve(ghDir, 'release.md')
const outputFile = resolve(ghDistDir, 'release.md')

const manifest: { version: string } = JSON.parse(
  readFileSync(resolve(process.cwd(), 'package.json'), {
    encoding: 'utf-8',
  })
)

const context: Record<string, string | undefined> = {
  tagVersion: manifest.version,
  tagMajorVersion: manifest.version.split('.')[0],
}

const template = readFileSync(resolve(templateFile), {
  encoding: 'utf-8',
})

let releaseText = replaceTokens(template)
let titleText = ''

const titleMatch = releaseText.match(/#\s*(?<template>.*)(?:\r\n|\r|\n|\s)*/m)

if (titleMatch && typeof titleMatch.index === 'number') {
  releaseText = releaseText.substring(titleMatch.index + titleMatch[0].length)
  titleText = titleMatch.groups?.template?.trim() ?? ''
}

mkdirSync(ghDistDir, { recursive: true })
writeFileSync(outputFile, releaseText, { encoding: 'utf-8' })
writeFileSync(resolve(ghDistDir, 'title.txt'), titleText, {
  encoding: 'utf-8',
})

function replaceTokens(template: string): string {
  const variables = template.matchAll(/(?<ref>\$\{(?<name>.*)\})/g)
  let result = template

  for (const variable of variables) {
    const variableRef = variable.groups?.ref
    const variableName = variable.groups?.name

    if (typeof variable.index !== 'number') continue
    if (typeof variableRef !== 'string') continue
    if (typeof variableName !== 'string') continue

    result = result.replaceAll(variableRef, context[variableName] ?? '')
  }

  return result
}
