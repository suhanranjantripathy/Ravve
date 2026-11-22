import { initDatabase } from './schema.js';
import { seedDatabase } from './seed.js';

let dbInstance = null;

export function getDb() {
  if (!dbInstance) {
    dbInstance = initDatabase();
    seedDatabase(dbInstance);
  }
  return dbInstance;
}

export default getDb;
