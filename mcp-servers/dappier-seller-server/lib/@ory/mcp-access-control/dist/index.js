"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  McpAccessControl: () => McpAccessControl
});
module.exports = __toCommonJS(index_exports);
var import_client_fetch = require("@ory/client-fetch");
var McpAccessControl = class _McpAccessControl {
  constructor(options) {
    this.jwksUrl = options.jwksUrl;
    this.issuer = options.issuer;
    this.audience = options.audience;
    this.claimKey = options.claimKey;
    this.schemaId = options.schemaId || "default";
    this.oryProjectUrl = options.oryProjectUrl;
    this.initJwks();
    const configuration = new import_client_fetch.Configuration({
      basePath: options.oryProjectUrl,
      accessToken: options.oryApiKey
    });
    this.identityApi = new import_client_fetch.IdentityApi(configuration);
    this.frontendApi = new import_client_fetch.FrontendApi(configuration);
  }
  async initJwks() {
    const { createRemoteJWKSet } = await import("jose");
    this.jwks = createRemoteJWKSet(new URL(this.jwksUrl));
  }
  static getNestedProperty(obj, path) {
    const parts = path.split(".");
    let current = obj;
    for (let i = 0; i < parts.length; i++) {
      if (current === null || typeof current !== "object") {
        return void 0;
      }
      current = current[parts[i]];
    }
    return current;
  }
  async findIdentityByEmail(email) {
    try {
      const identities = await this.identityApi.listIdentities({
        credentialsIdentifier: email
      });
      return identities.length > 0 ? identities[0] : null;
    } catch (error) {
      return null;
    }
  }
  async createIdentityWithCredentials(email, password) {
    const identity = await this.identityApi.createIdentity({
      createIdentityBody: {
        schema_id: this.schemaId,
        traits: {
          email
        },
        credentials: {
          password: {
            config: {
              password
            }
          }
        }
      }
    });
    return identity;
  }
  async authenticateIdentity(email, password) {
    const loginFlow = await this.frontendApi.createNativeLoginFlow();
    const session = await this.frontendApi.updateLoginFlow({
      flow: loginFlow.id,
      updateLoginFlowBody: {
        method: "password",
        identifier: email,
        password
      }
    });
    return session;
  }
  /**
   * Validates an Ory session token from the request headers
   * @param headers - Object containing request headers
   * @param options - Session validation options including header name
   * @returns Validation result with identity information if valid
   */
  async validateSession(headers, options) {
    try {
      const sessionToken = headers[options.headerName.toLowerCase()];
      if (!sessionToken) {
        return {
          isValid: false,
          error: `No session token found in header: ${options.headerName}`
        };
      }
      const { identity } = await this.frontendApi.toSession(
        {
          xSessionToken: sessionToken
        },
        {
          headers: {
            "X-Session-Token": sessionToken
          }
        }
      );
      if (!identity) {
        return {
          isValid: false,
          error: "Invalid or expired session token"
        };
      }
      return {
        isValid: true,
        identity: {
          id: identity.id,
          email: identity.traits.email
        }
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : "Failed to validate session"
      };
    }
  }
  getToolDefinition() {
    return {
      name: "ory_access_control",
      description: "Validates a JWT token and creates/retrieves an Ory identity for the associated claim, then authenticates the identity",
      parameters: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "JWT token containing the required claim"
          },
          password: {
            type: "string",
            description: "Password to set for new identities or authenticate existing ones"
          }
        },
        required: ["token", "password"]
      },
      handler: async (params) => {
        try {
          if (!this.jwks) {
            await this.initJwks();
          }
          const { jwtVerify } = await import("jose");
          const { payload } = await jwtVerify(params.token, this.jwks, {
            issuer: this.issuer,
            audience: this.audience
          });
          const claimValue = _McpAccessControl.getNestedProperty(
            payload,
            this.claimKey
          );
          if (!claimValue) {
            throw new Error(`JWT must contain a ${this.claimKey} claim`);
          }
          let identity = await this.findIdentityByEmail(claimValue);
          if (!identity) {
            identity = await this.createIdentityWithCredentials(
              claimValue,
              params.password
            );
          }
          const session = await this.authenticateIdentity(
            claimValue,
            params.password
          );
          return {
            success: true,
            identity: {
              id: identity.id,
              email: claimValue
            },
            session: {
              id: session.session?.id,
              token: session.session_token
            }
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
          };
        }
      }
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  McpAccessControl
});
//# sourceMappingURL=index.js.map