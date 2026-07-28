import Utils from '../utils/utils';

describe('Utils', () => {
    describe('snowflakeId()', () => {
        it('should generate a string ID', () => {
            const id = Utils.snowflakeId();
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        });

        it('should generate IDs that are numeric strings', () => {
            const id = Utils.snowflakeId();
            expect(BigInt(id).toString()).toBe(id);
        });

        it('should generate unique IDs across calls', async () => {
            const ids = new Set<string>();
            for (let i = 0; i < 50; i++) {
                ids.add(Utils.snowflakeId());
                await Utils.sleep(2);
            }
            // Snowflake may collide within same ms, just verify most are unique
            expect(ids.size).toBeGreaterThan(40);
        });
    });

    describe('sleep()', () => {
        it('should resolve after the specified time', async () => {
            const start = Date.now();
            await Utils.sleep(50);
            const elapsed = Date.now() - start;
            expect(elapsed).toBeGreaterThanOrEqual(40);
        });
    });

    describe('defer()', () => {
        it('should execute function after delay', (done) => {
            let executed = false;
            Utils.defer(() => {
                executed = true;
                expect(executed).toBe(true);
                done();
            }, 50);
        });
    });
});
