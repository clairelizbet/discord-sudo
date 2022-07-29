import { readFileSync } from 'fs'

type PackageManifestPartial = {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

function latestMatchingVersion(dependency: [string, string]) {
  const [pkg, currentVersion] = dependency
  const updateType = currentVersion.match(/^[^\d]/)?.[0]
  const [major, minor, patch] = currentVersion.replace(/^[^\d]/, '').split('.')

  if (!major) return `${pkg}@latest`

  if (updateType === '^') return `${pkg}@${major}`
  if (!updateType && (!minor || minor === 'x')) return `${pkg}@${major}`

  if (updateType === '~') return `${pkg}@${major}.${minor}`
  if (!updateType && (!patch || patch === 'x'))
    return `${pkg}@${major}.${minor}`

  return `${pkg}@${major}.${minor}.${patch}`
}

const manifest: PackageManifestPartial = JSON.parse(
  readFileSync('package.json', { encoding: 'utf-8' })
)

const deps = Object.entries(manifest.dependencies)
  .map((dep) => latestMatchingVersion(dep))
  .join(' ')

const devDeps = Object.entries(manifest.devDependencies)
  .map((dep) => latestMatchingVersion(dep))
  .join(' ')

console.log('deps')
console.log(deps)
console.log('devDeps')
console.log(devDeps)
