import { Route } from "../../httpServer";
import { HTTPServer } from "../../httpServer/HTTPServer";
import { checkPermission } from "../../httpServer/auth/rbac/middleware";
import { User } from "../../httpServer/auth/rbac/types";
import { RequestType } from "../../httpServer/request/RequestType";
import Middlewares from "../../httpServer/routing/Middleware";
import { logger } from "../../utils/winston";

// Initialize server
HTTPServer.init({
    port: 3000,
    timeout: 5000,
    logLevel: 'debug'
});
const server = HTTPServer.getInstance();


// Create routes with RBAC
/**
 * Route for fetching posts with the following steps:
 * 1. Authenticates the request.
 * 2. Checks the user's permission to read posts.
 * 3. Responds with a list of posts if all checks pass.
 */
const postsRoute = new Route('/posts', RequestType.GET)
    // .route(Middlewares.timeout())
    .route(Middlewares.auth) // First authenticate
    .route(checkPermission('read', 'posts')) // Then check permission
    .route(async (req, res) => {
        return res.send({
            posts: [
                { id: 1, title: 'First Post' },
                { id: 2, title: 'Second Post' }
            ]
        });
    });

const createPostRoute = new Route('/posts', RequestType.POST)
    .route(Middlewares.auth)
    .route(Middlewares.rbacCheckPerm('create', 'posts'))
    .route(async (req, res) => {
        // Editor can create posts
        return res.send({
            message: 'Post created successfully',
            // post: { id: 3, title: req.body.title }
        });
    });

const deletePostRoute = new Route('/posts/:id', RequestType.DELETE)
    .route(Middlewares.auth)
    .route(Middlewares.rbacCheckPerm('delete', 'posts'))
    .route(async (req, res) => {
        // Only admin can delete posts
        // This will fail for editor role
        return res.send({
            message: 'Post deleted successfully',
            // id: req.params.id
        });
    });

// Add routes to server
server.addRoute(postsRoute);
server.addRoute(createPostRoute);
server.addRoute(deletePostRoute);

// Start server
server.start();