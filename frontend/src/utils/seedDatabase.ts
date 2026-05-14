import { seedDatabase } from '../lib/seedData';

// This function can be called from the browser console
// Run: window.seedDatabase()
declare global {
  interface Window {
    seedDatabase: () => void;
  }
}

window.seedDatabase = seedDatabase;

console.log('Seeding function available. Run window.seedDatabase() in console to seed the database.');
