import express from 'express'
import { logger } from "../../utils/winston";
import Route from "./Route";
import { JWT } from 'quanvnjwt'
import dotenv from 'dotenv'
dotenv.config()
import NResponse from '../request/wrapper/NResponse';
import NRequest from '../request/wrapper/NRequest';
import type { routeFunction } from '../request/InjectableRequest';

export default class Middlewares {

    public static authUserUsingJWT: routeFunction = async (req: NRequest, res: NResponse) => {
        logger.verbose(`[Auth] Validating JWT token for ${req.getRequest().method} ${req.getRequest().url}`)
        const token = req.getRequest().headers.authorization
        if (!token) {
            logger.warn(`[Auth] No token provided for ${req.getRequest().method} ${req.getRequest().url}`)
            res.send('No token provided', 401)
            return false // Stop processing
        }

        try {
            const jwt = new JWT(process.env.JWT_SECRET || '')
            const decoded = jwt.verify(token)
            if (!decoded) {
                logger.warn(`[Auth] Invalid token provided for ${req.getRequest().method} ${req.getRequest().url}`)
                res.send('Invalid token', 401)
                return false
            }
            return true // == next
        } catch (error) {
            logger.error(`[Auth] Error validating token: ${error}`)
            res.send('Invalid token', 401)
            return false // Stop processing
        }
    }

    //* Config in Route.ts after adding method to middleware

    public static auth() {
        return this.authUserUsingJWT;
    }

    // public static timeout() {
    //     return TimeoutMonitor.middleware;
    // }
}