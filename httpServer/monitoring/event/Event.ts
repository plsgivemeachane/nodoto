export default class Event {
    name: string
    timestamp: number
    data?: any

    constructor(name: string, data?: any, timestamp?: number) {
        this.name = name
        this.timestamp = timestamp || Date.now()
        this.data = data
    }

    public static getName(): string {
        return this.name;
    }
}