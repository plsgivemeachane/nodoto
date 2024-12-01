import { CorsOptions } from 'cors';

export default interface HTTPServerConfig {
    // Server configuration
    port?: number;
    
    // Parser settings
    useJsonParser?: boolean;
    useUrlParser?: boolean;
    
    // CORS configuration
    corsSetting?: CorsOptions;
    
    // Additional settings can be added here as needed
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    bodyLimit?: string; // e.g., '50mb'
    timeout?: number;   // in milliseconds
}
