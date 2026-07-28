import Queue from '../httpServer/queue/Queue';
import * as fs from 'fs';
import * as path from 'path';

describe('Queue', () => {
    const testFile = path.join(__dirname, 'test_queue.json');

    afterEach(() => {
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    });

    it('should create a queue with empty messages', () => {
        const queue = new Queue<string>(testFile);
        expect(queue).toBeDefined();
    });

    it('should push items to the queue', () => {
        const queue = new Queue<string>(testFile);
        queue.push('item1');
        queue.push('item2');
        expect(queue.peek(2, 'item2')).toBe(false); // Different items at bottom
        expect(queue.peek(1, 'item2')).toBe(true);
    });

    it('should pop items from the queue', () => {
        const queue = new Queue<string>(testFile);
        queue.push('item1');
        queue.push('item2');
        queue.pop();
        expect(queue.peek(1, 'item2')).toBe(false);
        expect(queue.peek(1, 'item1')).toBe(true);
    });

    it('should peek and return false for empty queue', () => {
        const queue = new Queue<string>(testFile);
        expect(queue.peek(1, 'nonexistent')).toBe(false);
    });
});
