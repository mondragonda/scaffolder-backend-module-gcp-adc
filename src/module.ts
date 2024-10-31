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
} from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { adcDeployAction } from './adc-deploy-action';
import { adcCatalogRegisterAction, adcEntityProviderServiceRef } from './adc-catalog-register-action';
import { catalogProcessingExtensionPoint, catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { CatalogClient } from '@backstage/catalog-client';

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
        scaffolder.addActions(adcDeployAction());
        scaffolder.addActions(adcCatalogRegisterAction(adcEntityProvider, catalogApi, authService))
      },
    });
  },
});