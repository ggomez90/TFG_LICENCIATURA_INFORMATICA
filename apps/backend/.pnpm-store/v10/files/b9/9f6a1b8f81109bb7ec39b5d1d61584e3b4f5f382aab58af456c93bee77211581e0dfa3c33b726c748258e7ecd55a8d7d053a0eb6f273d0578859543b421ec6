"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeycloakMultiTenantService = void 0;
const common_1 = require("@nestjs/common");
const keycloak_connect_1 = __importDefault(require("keycloak-connect"));
const constants_1 = require("../constants");
/**
 * Stores all keycloak instances when multi tenant option is defined.
 */
let KeycloakMultiTenantService = class KeycloakMultiTenantService {
    constructor(keycloakOpts) {
        this.keycloakOpts = keycloakOpts;
        this.instances = new Map();
    }
    /**
     * Clears the cached Keycloak instances.
     */
    clear() {
        this.instances.clear();
    }
    /**
     * Retrieves a keycloak instance based on the realm provided.
     * @param realm the realm to retrieve from
     * @param request the request instance, defaults to undefined
     * @returns the multi tenant keycloak instance
     */
    get(realm_1) {
        return __awaiter(this, arguments, void 0, function* (realm, request = undefined) {
            if (typeof this.keycloakOpts === 'string') {
                throw new Error('Keycloak configuration is a configuration path. This should not happen after module load.');
            }
            if (this.keycloakOpts.multiTenant === null ||
                this.keycloakOpts.multiTenant === undefined) {
                throw new Error('Multi tenant is not defined yet multi tenant service is being called.');
            }
            const authServerUrl = yield this.resolveAuthServerUrl(realm, request);
            const secret = yield this.resolveSecret(realm, request);
            // Check if existing
            if (this.instances.has(realm)) {
                // If resolve always is enabled, resolve everything again
                if (this.keycloakOpts.multiTenant.resolveAlways) {
                    const keycloak = this.instances.get(realm);
                    keycloak.config.authServerUrl = authServerUrl;
                    keycloak.config.secret = secret;
                    keycloak.grantManager.secret = secret;
                    // Save instance
                    this.instances.set(realm, keycloak);
                    return keycloak;
                }
                // Otherwise return the instance
                return this.instances.get(realm);
            }
            else {
                // TODO: Repeating code from  provider, will need to rework this in 2.0
                // Override realm, secret, and authServerUrl
                const keycloakOpts = Object.assign(this.keycloakOpts, {
                    authServerUrl,
                    realm,
                    secret,
                });
                const keycloak = new keycloak_connect_1.default({}, keycloakOpts);
                // The most important part
                keycloak.accessDenied = (req, res, next) => {
                    req.resourceDenied = true;
                    next();
                };
                // Save instance
                this.instances.set(realm, keycloak);
                return keycloak;
            }
        });
    }
    resolveAuthServerUrl(realm_1) {
        return __awaiter(this, arguments, void 0, function* (realm, request = undefined) {
            if (typeof this.keycloakOpts === 'string') {
                throw new Error('Keycloak configuration is a configuration path. This should not happen after module load.');
            }
            if (this.keycloakOpts.multiTenant === null ||
                this.keycloakOpts.multiTenant === undefined) {
                throw new Error('Multi tenant is not defined yet multi tenant service is being called.');
            }
            // If no realm auth server url resolver is defined, return defaults
            if (!this.keycloakOpts.multiTenant.realmAuthServerUrlResolver) {
                return (this.keycloakOpts.authServerUrl ||
                    this.keycloakOpts['auth-server-url'] ||
                    this.keycloakOpts.serverUrl ||
                    this.keycloakOpts['server-url']);
            }
            // Resolve realm authServerUrl
            const resolvedAuthServerUrl = this.keycloakOpts.multiTenant.realmAuthServerUrlResolver(realm, request);
            const authServerUrl = resolvedAuthServerUrl || resolvedAuthServerUrl instanceof Promise
                ? yield resolvedAuthServerUrl
                : resolvedAuthServerUrl;
            // Override auth server url
            // Order of priority: resolved realm auth server url > provided auth server url
            return (authServerUrl ||
                this.keycloakOpts.authServerUrl ||
                this.keycloakOpts['auth-server-url'] ||
                this.keycloakOpts.serverUrl ||
                this.keycloakOpts['server-url']);
        });
    }
    resolveSecret(realm_1) {
        return __awaiter(this, arguments, void 0, function* (realm, request = undefined) {
            if (typeof this.keycloakOpts === 'string') {
                throw new Error('Keycloak configuration is a configuration path. This should not happen after module load.');
            }
            if (this.keycloakOpts.multiTenant === null ||
                this.keycloakOpts.multiTenant === undefined) {
                throw new Error('Multi tenant is not defined yet multi tenant service is being called.');
            }
            // If no realm secret resolver is defined, return defaults
            if (!this.keycloakOpts.multiTenant.realmSecretResolver) {
                return this.keycloakOpts.secret;
            }
            // Resolve realm secret
            const resolvedRealmSecret = this.keycloakOpts.multiTenant.realmSecretResolver(realm, request);
            const realmSecret = resolvedRealmSecret || resolvedRealmSecret instanceof Promise
                ? yield resolvedRealmSecret
                : resolvedRealmSecret;
            // Override secret
            // Order of priority: resolved realm secret > default global secret
            return realmSecret || this.keycloakOpts.secret;
        });
    }
};
exports.KeycloakMultiTenantService = KeycloakMultiTenantService;
exports.KeycloakMultiTenantService = KeycloakMultiTenantService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(constants_1.KEYCLOAK_CONNECT_OPTIONS)),
    __metadata("design:paramtypes", [Object])
], KeycloakMultiTenantService);
