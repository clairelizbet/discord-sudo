import { Database } from './base'
import { MemoryDatabase } from './memory'
import { SQLiteDatabase } from './sqlite'

let db: Database
const dbDriverMap: Map<string, new () => Database> = new Map()

dbDriverMap.set('__DEVELOPMENT__memory', MemoryDatabase)
dbDriverMap.set('sqlite', SQLiteDatabase)

async function connectDatabase(): Promise<Database> {
  if (db) return db

  const driverName = String(process.env.DB_DRIVER ?? 'sqlite')
  const DBClass = dbDriverMap.get(driverName)

  if (DBClass) {
    db = new DBClass()
    return db
  } else {
    throw new Error(`No driver class found for database driver ${driverName}`)
  }
}

function getDatabase() {
  if (!db)
    throw new Error('Attempted to access database prior to initialization')

  return db
}

export { connectDatabase, getDatabase }
