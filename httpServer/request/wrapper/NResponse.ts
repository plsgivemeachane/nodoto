import { Response } from "express";
import Observable from "../../../utils/Observable";


export default class NResponse {
    private readonly res: Response
    private responseSent: boolean = false
    private observer: Observable<string> = new Observable();
    
    constructor(res: Response) {
        this.res = res;
    }

    json(data: any, status: number = 200) {
        if(this.responseSent) {
            return;
        }

        this.responseSent = true
        return this.res.status(status).json(data)
    }

    send(data: any, status: number = 200) {
        if(this.responseSent) {
            return;
        }

        this.responseSent = true
        return this.res.status(status).send(data)
    }
}