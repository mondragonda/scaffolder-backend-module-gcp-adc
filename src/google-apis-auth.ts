/*
 * Copyright 2024 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { LoggerService, HttpAuthService, UserInfoService, RootConfigService, PermissionsService } from "@backstage/backend-plugin-api";
import { createPermissionIntegrationRouter } from "@backstage/plugin-permission-node";
import express from 'express'
import { AnyAuthClient, GoogleAuth } from 'google-auth-library';
import { AuthorizeResult, createPermission } from "@backstage/plugin-permission-common";
import { NotAllowedError, NotImplementedError } from "@backstage/errors";


export const googleApisAuthPermission = createPermission({
    name: 'google.auth.token',
    attributes: { action: 'read' },
});

export interface GoogleAPIAuthRouterOptions  {
    logger: LoggerService;
    userInfo: UserInfoService;
    httpAuth: HttpAuthService;
    config: RootConfigService;
    permissions: PermissionsService;
}

export async function createGoogleAPIsAuthRouter(
    { logger, httpAuth, userInfo, config, permissions }: GoogleAPIAuthRouterOptions 
): Promise<express.Router> {

    const router = createPermissionIntegrationRouter({
      permissions: [googleApisAuthPermission],
    });
    
    router.use(express.json());
    
    const authEnvironment = config.getOptionalString('auth.environment');
    
    let client: AnyAuthClient;
    const AUTH_CLIENT_REQUESTS_SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];
    
    try {
        client = await new GoogleAuth({
            credentials: process.env.BACKSTAGE_GOOGLE_APPLICATION_CREDENTIALS_JSON ? JSON.parse(process.env.BACKSTAGE_GOOGLE_APPLICATION_CREDENTIALS_JSON): null,
            keyFile: config.getOptionalString(`auth.providers.google.${authEnvironment}.credentialsFilePath`) ?? process.env.BACKSTAGE_GOOGLE_APPLICATION_CREDENTIALS_PATH,
            apiKey: config.getOptionalString(`auth.providers.google.${authEnvironment}.apiKey`) ?? process.env.BACKSTAGE_GOOGLE_API_KEY,
            scopes: AUTH_CLIENT_REQUESTS_SCOPES,
        }).getClient();
    } catch (error){
        logger.debug("GoogleAuth client failed to initialize: ", error);
    }
    
    router.get('/auth-token', async (_, response) => {
        const credentials = await httpAuth.credentials(_, {allow: ['user']});
        const requestInitiator = await userInfo.getUserInfo(credentials);

        logger.info(`${requestInitiator.userEntityRef} requested Google APIs backend token access.`)

        const authAccessDecision = (
            await permissions.authorize(
                [{ permission: googleApisAuthPermission }],
                { credentials }
            )
        )[0];

        if (authAccessDecision.result === AuthorizeResult.DENY) {
            logger.info(`${requestInitiator.userEntityRef} access to Google APIs backend token was denied.`);
            throw new NotAllowedError('Not authorized for Google APIs backend authentication.');
        }

        if (!client) {
            throw new NotImplementedError("Backend Google APIs authentication is not available.");
        }
        
        const { token } = await client.getAccessToken();

        logger.info(`${requestInitiator.userEntityRef} Google APIs backend token access was granted.`);

        return response.json({ "token": token }).status(200);
    });

    return router;
}