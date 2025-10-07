interface McpAccessControlOptions {
    jwksUrl: string;
    issuer: string;
    audience: string;
    claimKey: string;
    oryProjectUrl: string;
    oryApiKey: string;
    schemaId?: string;
}
interface JwtPayload {
    [key: string]: unknown;
}
interface SessionValidationOptions {
    headerName: string;
}
interface ValidationResult {
    isValid: boolean;
    identity?: {
        id: string;
        email: string;
    };
    error?: string;
}
declare class McpAccessControl {
    private readonly jwksUrl;
    private readonly issuer;
    private readonly audience;
    private readonly claimKey;
    private readonly schemaId;
    private readonly identityApi;
    private readonly frontendApi;
    private jwks;
    private readonly oryProjectUrl;
    constructor(options: McpAccessControlOptions);
    private initJwks;
    private static getNestedProperty;
    private findIdentityByEmail;
    private createIdentityWithCredentials;
    private authenticateIdentity;
    /**
     * Validates an Ory session token from the request headers
     * @param headers - Object containing request headers
     * @param options - Session validation options including header name
     * @returns Validation result with identity information if valid
     */
    validateSession(headers: Record<string, string>, options: SessionValidationOptions): Promise<ValidationResult>;
    getToolDefinition(): {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                token: {
                    type: string;
                    description: string;
                };
                password: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
        handler: (params: {
            token: string;
            password: string;
        }) => Promise<{
            success: boolean;
            identity: {
                id: string;
                email: any;
            };
            session: {
                id: string;
                token: string | undefined;
            };
            error?: undefined;
        } | {
            success: boolean;
            error: string;
            identity?: undefined;
            session?: undefined;
        }>;
    };
}

export { type JwtPayload, McpAccessControl, type McpAccessControlOptions, type SessionValidationOptions, type ValidationResult };
