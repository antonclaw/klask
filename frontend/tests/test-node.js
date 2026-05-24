// Node.js test runner for game logic
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load scripts and execute with explicit filenames so c8 can map coverage.
const gameLogicPath = join(__dirname, '../klask/src/klask/game-logic.ts');
const gameLogicCode = readFileSync(gameLogicPath, 'utf8').replace(/^export /gm, '');
const testsCode = readFileSync(join(__dirname, 'game-logic.test.js'), 'utf8');
const klask4TestsCode = readFileSync(join(__dirname, 'klask-4.test.js'), 'utf8');

try {
    vm.runInThisContext(gameLogicCode, { filename: gameLogicPath });
    vm.runInThisContext(testsCode, { filename: join(__dirname, 'game-logic.test.js') });
    vm.runInThisContext(klask4TestsCode, { filename: join(__dirname, 'klask-4.test.js') });
    const success = vm.runInThisContext('runTests()', { filename: join(__dirname, 'runner-eval.js') });
    process.exit(success ? 0 : 1);
} catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
}
