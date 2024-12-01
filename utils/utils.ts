import { Snowflake } from "nodejs-snowflake";

class Utils {
    private static snowflake: Snowflake;

    public static init() {
        this.snowflake = new Snowflake({ 
            custom_epoch: 19112021000, // Defaults to Date.now(). This is UNIX timestamp in ms
            instance_id: undefined // A value ranging between 0 - 4095. If not provided then a random value will be used
        });
    }

    public static snowflakeId(): string {
        if (!this.snowflake) {
            this.init();
        }
        return this.snowflake.idFromTimestamp(Date.now()).toString()
    }

    static async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static defer(fn: Function, ms: number) {
        setTimeout(fn, ms);
    }
}

export default Utils;