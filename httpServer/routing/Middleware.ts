import express from 'express'
import { logger } from "../../utils/winston";
import Route from "./Route";
import { JWT } from 'quanvnjwt'
import dotenv from 'dotenv'
dotenv.config()

export default class Middlewares {

    public static authUserUsingJWT(req: express.Request, res: express.Response) {
        logger.verbose(`[Auth] Validating JWT token for ${req.method} ${req.url}`)
        const token = req.headers.authorization
        if (!token) {
            logger.verbose(`[Auth] Request denied: No authorization token provided`)
            res.status(401).send('[Auth] Unauthorized: No token provided')
            return false
        }

        const token_data = token.split(' ')

        if (token_data.length !== 2) {
            logger.verbose(`[Auth] Request denied: Malformed authorization token`)
            res.status(401).send('[Auth] Unauthorized: Invalid token format')
            return false
        }

        const jwt = new JWT(process.env.JWT_SECRET??"")
        const stats = jwt.verify(token_data[1])

        if(!stats.status) {
            logger.verbose(`[Auth] Request denied: Invalid or expired token`)
            res.status(401).send('[Auth] Unauthorized: Invalid or expired token')
            return false
        }

        logger.verbose(`[Auth] Request authorized successfully`)
        return true
    }

    public static timeoutHandler(req: express.Request, res: express.Response) {
        logger.verbose(`[Timeout] Request timed out: ${req.method} ${req.url}`)
        res.status(408).send('Request timed out');
    }

    //* Config in Route.ts after adding method to middleware

    public static auth(route: Route) {
        route.route(this.authUserUsingJWT)
    }

    public static timeout(route: Route) {
        route.route(this.timeout)
    }

}