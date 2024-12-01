import express from 'express'
import { logger } from "../../utils/winston";
import Route from "./Route";
import { JWT } from 'quanvnjwt'
import dotenv from 'dotenv'
dotenv.config()
import { TimeoutMonitor } from '../monitoring/TimeoutMonitor';

export default class Middlewares {

    public static authUserUsingJWT(req: express.Request, res: express.Response, next?: express.NextFunction) {
        logger.verbose(`[Auth] Validating JWT token for ${req.method} ${req.url}`)
        const token = req.headers.authorization
        if (!token) {
            logger.warn(`[Auth] No token provided for ${req.method} ${req.url}`)
            res.status(401).send('No token provided')
            return false
        }

        try {
            const jwt = new JWT(process.env.JWT_SECRET || '')
            const decoded = jwt.verify(token)
            if (!decoded) {
                logger.warn(`[Auth] Invalid token provided for ${req.method} ${req.url}`)
                res.status(401).send('Invalid token')
                return false
            }
            next?.()
            return true
        } catch (error) {
            logger.error(`[Auth] Error validating token: ${error}`)
            res.status(401).send('Invalid token')
            return false
        }
    }

    //* Config in Route.ts after adding method to middleware

    public static auth(route: Route) {
        route.route(this.authUserUsingJWT)
    }

    public static timeout(route: Route) {
        route.route(TimeoutMonitor.middleware)
    }
}