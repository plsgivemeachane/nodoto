// Request event queue
import fs from 'fs'
import { logger } from '../../utils/winston';

export default class Queue<T> {

    private messages: T[];
    private dataFile: string;
    private IOStatus: boolean = false;

    constructor(file: string) {
        this.messages = []
        this.dataFile = file
        this.load();
    }

    load() {
        if(this.IOStatus) {
            logger.error("Load file fail: Another process was initiated")
        }
        // Load messages from file
        this.IOStatus = true
        fs.readFile(this.dataFile, (err, data) => {
            this.IOStatus = false
            if(err) {
                this.messages = []
                return;
            }
            this.messages = JSON.parse(data.toString())
        })
    }

    peek(itemCount: number, data: any): boolean {
        // Peek itemCount message from the bottom to check if the same message is already in the queue
        for(let i = 0; i < itemCount; i++) {
            if(data != this.messages[this.messages.length - 1 - i]) {
                return false
            }
        }
        return true
    }

    push(item: T) {
        this.messages.push(item);
        this.save()
    }

    pop() {
        this.messages.pop();
        this.save()
    }
    
    save() {
        if(this.IOStatus) return; // Another saving has been intiated
        const content = JSON.stringify(this.messages)
        if(!content) return; // Empty message queue
        this.IOStatus = true
        fs.writeFile(this.dataFile, content, (err) => {
            this.IOStatus = false
            if(err) {
                // This file saving has fail
                // save again
                this.save()
            }
        })

    }

}