// Single entry point — one import for everything:
//   import { HTTPServer } from 'nodoto';
//
//   HTTPServer.init({ port: 3000 })
//   HTTPServer.Logger.info('hello')
//   HTTPServer.Auth.register()
//   HTTPServer.Validator.validate({ ... })

export { HTTPServer } from './httpServer/HTTPServer';
