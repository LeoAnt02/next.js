#!/usr/bin/env node

import { execSync, exec } from 'child_process'
import { promisify } from 'util'
import {
  readFileSync,
  writeFileSync,
  existsSync,
  copyFileSync,
  unlinkSync,
} from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createInterface } from 'readline'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Colors for output
const colors = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  NC: '\x1b[0m', // No Color
}

// Configuration
const PACKAGE_DIR = resolve(__dirname, 'packages/next')
const ORIGINAL_NPMRC = join(PACKAGE_DIR, '.npmrc')
const BACKUP_NPMRC = join(PACKAGE_DIR, '.npmrc.backup')
const PACKAGE_JSON = join(PACKAGE_DIR, 'package.json')
const PACKAGE_JSON_BACKUP = join(PACKAGE_DIR, 'package.json.backup')

// Default values
const defaults = {
  registryUrl: process.env.NPM_REGISTRY_URL || 'https://registry.npmjs.org/',
  scope: process.env.NPM_SCOPE || '@leoant',
  access: process.env.NPM_ACCESS || 'restricted',
  dryRun: process.env.DRY_RUN === 'true',
}

// Logging functions
const log = (message) =>
  console.log(`${colors.BLUE}[INFO]${colors.NC} ${message}`)
const warn = (message) =>
  console.log(`${colors.YELLOW}[WARN]${colors.NC} ${message}`)
const error = (message) =>
  console.error(`${colors.RED}[ERROR]${colors.NC} ${message}`)
const success = (message) =>
  console.log(`${colors.GREEN}[SUCCESS]${colors.NC} ${message}`)

// Configuration state
let config = { ...defaults }
let cleanupTasks = []

function getNpmEnv() {
  // npm may ignore .npmrc files inside workspace packages.
  // Force npm to use the generated config we write in `setupNpmrc()`.
  return {
    ...process.env,
    NPM_CONFIG_USERCONFIG: ORIGINAL_NPMRC,
  }
}

function printUsage() {
  console.log(`Usage: node ${__filename} [OPTIONS]

Options:
  -r, --registry URL    NPM registry URL (default: ${defaults.registryUrl})
  -s, --scope SCOPE     Package scope (default: ${defaults.scope})
  -a, --access ACCESS   Package access (private|public, default: ${defaults.access})
  -d, --dry-run         Perform a dry run without actually publishing
  -h, --help            Show this help message

Environment variables:
  NPM_TOKEN             NPM authentication token (required)
  NPM_REGISTRY_URL      NPM registry URL
  NPM_SCOPE             Package scope
  NPM_ACCESS            Package access level
  DRY_RUN              Set to 'true' for dry run

Examples:
  # Publish to default registry
  node ${__filename}

  # Publish to GitHub Packages
  node ${__filename} -r https://npm.pkg.github.com -s @your-username

  # Dry run
  node ${__filename} --dry-run`)
}

function loadConfigFile() {
  const configFile = join(__dirname, 'publish-config.env')
  if (existsSync(configFile)) {
    log(`Loading configuration from ${configFile}`)
    const content = readFileSync(configFile, 'utf8')

    // Parse environment file
    content.split('\n').forEach((line) => {
      line = line.trim()
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=', 2)
        if (key && value) {
          process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
        }
      }
    })

    // Update config with environment variables
    config.registryUrl = process.env.NPM_REGISTRY_URL || config.registryUrl
    config.scope = process.env.NPM_SCOPE || config.scope
    config.access = process.env.NPM_ACCESS || config.access
    config.dryRun = process.env.DRY_RUN === 'true' || config.dryRun
  }
}

function parseArguments() {
  const args = process.argv.slice(2)

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '-r':
      case '--registry':
        if (i + 1 >= args.length) {
          error('Registry URL is required')
          process.exit(1)
        }
        config.registryUrl = args[++i]
        break
      case '-s':
      case '--scope':
        if (i + 1 >= args.length) {
          error('Scope is required')
          process.exit(1)
        }
        config.scope = args[++i]
        break
      case '-a':
      case '--access':
        if (i + 1 >= args.length) {
          error('Access level is required')
          process.exit(1)
        }
        config.access = args[++i]
        break
      case '-d':
      case '--dry-run':
        config.dryRun = true
        break
      case '-h':
      case '--help':
        printUsage()
        process.exit(0)
        break
      default:
        error(`Unknown option: ${args[i]}`)
        printUsage()
        process.exit(1)
    }
  }
}

async function promptUser(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

function cleanup() {
  cleanupTasks.forEach((task) => {
    try {
      task()
    } catch (err) {
      warn(`Cleanup failed: ${err.message}`)
    }
  })
}

function validateInputs() {
  if (!process.env.NPM_TOKEN) {
    error('NPM_TOKEN environment variable is required')
    process.exit(1)
  }

  if (!existsSync(PACKAGE_DIR)) {
    error(`Package directory not found: ${PACKAGE_DIR}`)
    process.exit(1)
  }

  if (!existsSync(PACKAGE_JSON)) {
    error(`package.json not found in: ${PACKAGE_DIR}`)
    process.exit(1)
  }

  if (!['restricted', 'public'].includes(config.access)) {
    error("Access must be 'restricted' or 'public'")
    process.exit(1)
  }
}

function getPackageInfo() {
  const packageJson = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'))
  return {
    name: packageJson.name,
    version: packageJson.version,
  }
}

function modifyPackageName() {
  // Backup original package.json
  copyFileSync(PACKAGE_JSON, PACKAGE_JSON_BACKUP)
  log('Backed up original package.json')

  // Add cleanup task to restore the original package.json
  cleanupTasks.push(() => {
    if (existsSync(PACKAGE_JSON_BACKUP)) {
      copyFileSync(PACKAGE_JSON_BACKUP, PACKAGE_JSON)
      unlinkSync(PACKAGE_JSON_BACKUP)
      log('Restored original package.json')
    }
  })

  // Read and modify package.json
  const packageJson = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'))
  const originalName = packageJson.name

  // Create the scoped name
  const scopedName = `${config.scope}/next`

  if (originalName === scopedName) {
    log('Package name already has correct scope')
    return { originalName, scopedName }
  }

  // Modify the name
  packageJson.name = scopedName

  // Write the modified package.json
  writeFileSync(PACKAGE_JSON, JSON.stringify(packageJson, null, 2) + '\n')
  log(
    `Temporarily changed package name from "${originalName}" to "${scopedName}"`
  )

  return { originalName, scopedName }
}

function setupNpmrc() {
  // Backup original .npmrc if it exists
  if (existsSync(ORIGINAL_NPMRC)) {
    copyFileSync(ORIGINAL_NPMRC, BACKUP_NPMRC)
    log('Backed up original .npmrc')

    // Add cleanup task to restore backup
    cleanupTasks.push(() => {
      if (existsSync(BACKUP_NPMRC)) {
        copyFileSync(BACKUP_NPMRC, ORIGINAL_NPMRC)
        unlinkSync(BACKUP_NPMRC)
        log('Restored original .npmrc')
      }
    })
  } else {
    // Add cleanup task to remove created .npmrc
    cleanupTasks.push(() => {
      if (existsSync(ORIGINAL_NPMRC)) {
        unlinkSync(ORIGINAL_NPMRC)
        log('Removed created .npmrc')
      }
    })
  }

  // Extract hostname from registry URL for auth token
  const registryHostname = config.registryUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')

  const npmrcContent = `# Private registry configuration
registry=${config.registryUrl}
${config.scope}:registry=${config.registryUrl}

# Authentication
//${registryHostname}/:_authToken=${process.env.NPM_TOKEN}

# Required for private packages
always-auth=true
`

  writeFileSync(ORIGINAL_NPMRC, npmrcContent)
  log('Created .npmrc for private registry')
}

async function verifyAuthentication() {
  log('Verifying authentication...')

  try {
    const { stdout } = await execAsync(
      `npm whoami --registry "${config.registryUrl}"`,
      {
        cwd: PACKAGE_DIR,
        env: getNpmEnv(),
      }
    )
    const authenticatedUser = stdout.trim()
    success(`Authenticated as: ${authenticatedUser}`)
    return authenticatedUser
  } catch (err) {
    error('Authentication failed. Please check your NPM_TOKEN')
    process.exit(1)
  }
}

async function checkExistingVersion(packageName, version) {
  log(`Checking if version ${version} already exists...`)

  try {
    await execAsync(`npm view "${packageName}@${version}" version`, {
      cwd: PACKAGE_DIR,
      env: getNpmEnv(),
    })

    warn(`Version ${version} already exists in registry`)
    const answer = await promptUser('Do you want to continue anyway? (y/N): ')

    if (!answer.toLowerCase().startsWith('y')) {
      log('Publishing cancelled')
      process.exit(0)
    }
  } catch (err) {
    // Version doesn't exist, which is what we want
    log('Version is available for publishing')
  }
}

async function buildPackage(packageName) {
  log('Building package...')

  try {
    execSync('pnpm turbo build', {
      cwd: __dirname,
      stdio: 'inherit',
    })
  } catch (err) {
    error(`Build failed: ${err.message}`)
    process.exit(1)
  }
}

async function verifyPackageContents() {
  log('Package contents:')

  try {
    const { stdout } = await execAsync('npm pack --dry-run', {
      cwd: PACKAGE_DIR,
      env: getNpmEnv(),
    })
    console.log(stdout)
  } catch (err) {
    warn(`Could not verify package contents: ${err.message}`)
  }
}

async function publishPackage(packageName, version) {
  if (config.dryRun) {
    log('DRY RUN: Would publish with the following command:')
    console.log(`npm publish --access ${config.access} --provenance=false`)
    return
  }

  log('Publishing package...')

  try {
    await execAsync(
      `npm publish --access ${config.access} --provenance=false`,
      {
        cwd: PACKAGE_DIR,
        env: getNpmEnv(),
      }
    )

    success(
      `Successfully published ${packageName}@${version} to ${config.registryUrl}`
    )

    // Verify the published package
    log('Verifying published package...')
    try {
      await execAsync(`npm view "${packageName}@${version}" version`, {
        cwd: PACKAGE_DIR,
        env: getNpmEnv(),
      })
      success('Package verification successful')
    } catch (verifyErr) {
      warn('Package published but verification failed')
    }
  } catch (err) {
    error(`Failed to publish package: ${err.message}`)
    process.exit(1)
  }
}

function showInstallationInstructions(packageName, version, originalName) {
  console.log('')
  success('Package published successfully!')
  console.log('')
  log('To install this package in your projects, use:')
  console.log(`"${originalName}": "npm:${packageName}@${version}"`)
  console.log('')
  log('Or directly:')
  console.log(
    `npm install ${packageName}@${version} --registry=${config.registryUrl}`
  )
  console.log('')
  log('Or add to your .npmrc:')
  console.log(`registry=${config.registryUrl}`)
  console.log(`${config.scope}:registry=${config.registryUrl}`)
}

async function main() {
  // Setup cleanup on exit
  process.on('exit', cleanup)
  process.on('SIGINT', () => {
    cleanup()
    process.exit(130)
  })
  process.on('SIGTERM', () => {
    cleanup()
    process.exit(143)
  })

  try {
    // Load configuration and parse arguments
    loadConfigFile()
    parseArguments()

    // Validate inputs
    validateInputs()

    // Change to package directory
    process.chdir(PACKAGE_DIR)

    log('Publishing Next.js package to private registry')
    log(`Registry: ${config.registryUrl}`)
    log(`Scope: ${config.scope}`)
    log(`Access: ${config.access}`)
    log(`Dry run: ${config.dryRun}`)

    // Get original package information
    const { name: originalName, version } = getPackageInfo()
    log(`Original package: ${originalName}@${version}`)

    // Modify package name for publishing
    const { scopedName } = modifyPackageName()

    // Setup npm registry configuration
    setupNpmrc()

    // Verify authentication
    await verifyAuthentication()

    // Check if version already exists (using scoped name)
    await checkExistingVersion(scopedName, version)

    // Build package (using scoped name for turbo filter)
    await buildPackage(scopedName)

    // Verify package contents
    await verifyPackageContents()

    // Publish the package
    await publishPackage(scopedName, version)

    // Show installation instructions
    if (!config.dryRun) {
      showInstallationInstructions(scopedName, version, originalName)
    }
  } catch (err) {
    error(`Unexpected error: ${err.message}`)
    process.exit(1)
  }
}

// Run the script
main().catch((err) => {
  error(`Fatal error: ${err.message}`)
  process.exit(1)
})
