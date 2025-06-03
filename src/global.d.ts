declare module '*.png' {
    const value: string;
    export default value;
}

// Vite environment variables type definitions
interface ImportMeta {
    readonly env: {
        readonly DEV: boolean;
        readonly PROD: boolean;
        readonly MODE: string;
        readonly BASE_URL: string;
        readonly [key: string]: string | boolean | undefined;
    };
}