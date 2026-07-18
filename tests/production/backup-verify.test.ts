import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

/**
 * Backup Verification Test
 *
 * This test verifies that the backup system works correctly by:
 * 1. Creating test data in the database
 * 2. Running a backup
 * 3. Restoring to a temporary database
 * 4. Verifying test data exists in the restored database
 * 5. Cleaning up the temporary database
 *
 * WARNING: This test creates and drops a temporary database.
 * Run in a safe environment (dev/staging) only.
 */

const prisma = new PrismaClient()
const TEST_DB_NAME = `fleet_backup_test_${Date.now()}`

describe('Backup Verification', () => {
  let testCompanyId: string
  let backupFile: string

  beforeAll(async () => {
    // Verify we're not in production
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Backup verification tests must not run in production')
    }

    // Create test data
    const testCompany = await prisma.company.create({
      data: {
        name: `Backup Test Company ${Date.now()}`,
        email: `backup-test-${Date.now()}@example.com`,
        phone: '+254700000000',
        address: 'Test Address for Backup',
        city: 'Nairobi',
        country: 'Kenya',
        status: 'ACTIVE',
      },
    })
    testCompanyId = testCompany.id

    console.log(`Created test company: ${testCompanyId}`)
  })

  afterAll(async () => {
    // Clean up test data from main database
    try {
      await prisma.company.deleteMany({
        where: { id: testCompanyId },
      })
    } catch {
      // Ignore cleanup errors
    }

    await prisma.$disconnect()

    // Clean up backup file
    if (backupFile) {
      try {
        execSync(`rm -f ${backupFile}`, { stdio: 'ignore' })
      } catch {
        // Ignore
      }
    }

    // Clean up temp database (safety net)
    try {
      const dbUrl = process.env.DATABASE_URL || ''
      const adminUrl = dbUrl.replace(/\/[^\/]*$/, '/postgres')
      execSync(
        `psql "${adminUrl}" -c "DROP DATABASE IF EXISTS \\"${TEST_DB_NAME}\\";"`,
        { stdio: 'ignore' }
      )
    } catch {
      // Ignore cleanup errors
    }
  })

  it('creates a backup of the database', async () => {
    const result = execSync(
      'bash scripts/backup/backup-db.sh',
      {
        cwd: process.cwd(),
        encoding: 'utf-8',
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      }
    )

    // Extract backup file path from output
    const match = result.match(/File:\s+(backups\/backup_[^\s]+)/)
    expect(match).toBeTruthy()
    backupFile = match![1]

    console.log(`Backup created: ${backupFile}`)
  })

  it('backup file exists and is not empty', () => {
    const fs = require('fs')
    expect(fs.existsSync(backupFile)).toBe(true)

    const stats = fs.statSync(backupFile)
    expect(stats.size).toBeGreaterThan(1000) // At least 1KB
  })

  it('restores backup to temporary database and verifies test data', async () => {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      throw new Error('DATABASE_URL not set')
    }

    // Parse connection details
    const adminUrl = dbUrl.replace(/\/[^\/]*$/, '/postgres')

    // Create temp database
    execSync(
      `psql "${adminUrl}" -c "CREATE DATABASE \\"${TEST_DB_NAME}\\";"`,
      { stdio: 'pipe' }
    )

    // Restore backup to temp database
    const tempDbUrl = dbUrl.replace(/\/[^\/]*(?:\?.*)?$/, `/${TEST_DB_NAME}`)

    execSync(
      `gunzip -c ${backupFile} | psql "${tempDbUrl}"`,
      { stdio: 'pipe', timeout: 120000 }
    )

    // Verify test data exists in restored database
    const result = execSync(
      `psql "${tempDbUrl}" -t -c "SELECT COUNT(*) FROM \\"Company\\" WHERE id = '${testCompanyId}';"`,
      { encoding: 'utf-8', stdio: 'pipe' }
    )

    const count = parseInt(result.trim(), 10)
    expect(count).toBe(1)

    // Clean up temp database
    execSync(
      `psql "${adminUrl}" -c "DROP DATABASE \\"${TEST_DB_NAME}\\";"`,
      { stdio: 'pipe' }
    )

    console.log('Backup verification passed: test data found in restored database')
  })
})
