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
import {
  createBackendModule,
  coreServices,
  createBackendPlugin
} from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { adcDeployAction } from './adc-deploy-action';
import { catalogProcessingExtensionPoint, catalogServiceRef} from '@backstage/plugin-catalog-node/alpha';
import { adcEntityProviderServiceRef } from './adc-entity-provider-service';
import { createGoogleAPIsAuthRouter } from './google-apis-auth';
import { policyExtensionPoint } from '@backstage/plugin-permission-node/alpha';
import { ExampleOrgPermissionsPolicy } from './example-org-permissions-policy';

export const catalogModuleGcpAdc = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'gcp-adc-entity-provider',
  register(reg) {
    reg.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        adcEntityProvider: adcEntityProviderServiceRef
      },
      async init({ catalog, adcEntityProvider }){
        catalog.addEntityProvider(adcEntityProvider);
      }
    })
  },
});

export const scaffolderModuleGcpAdc = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'gcp-adc-scaffolder-actions',
  register(reg) {
    reg.registerInit({
      deps: { 
          scaffolder: scaffolderActionsExtensionPoint, 
          adcEntityProvider: adcEntityProviderServiceRef,
          catalogApi: catalogServiceRef,
          authService: coreServices.auth
      },
      async init({ scaffolder, adcEntityProvider , catalogApi, authService}) {
        scaffolder.addActions(adcDeployAction(adcEntityProvider, catalogApi, authService));
      },
    });
  },
});

export const googleAPIsAuthPlugin = createBackendPlugin({
  pluginId: 'google-apis-auth-backend',
  register(reg) {
    reg.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        httpAuth: coreServices.httpAuth,
        userInfo: coreServices.userInfo,
        config: coreServices.rootConfig,
        permissions: coreServices.permissions,
      },
      async init({ httpRouter, logger, httpAuth, userInfo, config, permissions }) {
        httpRouter.use(
          await createGoogleAPIsAuthRouter({
            logger,
            httpAuth,
            userInfo,
            config,
            permissions,
          })
        );
      }
    })
  },
});

export const permissionsPolicyBackendModule = createBackendModule({
  pluginId: 'permission',
  moduleId: 'example-org-permissions-policy',
  register(reg) {
    reg.registerInit({
      deps: { policy: policyExtensionPoint },
      async init({ policy }){
        policy.setPolicy(new ExampleOrgPermissionsPolicy());
      }
    })
  }
});