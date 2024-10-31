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
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';
import {
  EntityProvider,
  EntityProviderConnection,

} from '@backstage/plugin-catalog-node';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  CompoundEntityRef,
  Entity,
  parseEntityRef,
  stringifyEntityRef
} from '@backstage/catalog-model';
import { AuthService, createServiceFactory, createServiceRef } from '@backstage/backend-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';

interface ADCEntityProviderService extends EntityProvider {
  getConnection(): EntityProviderConnection|null;
  registerADCEntity(): Promise<CompoundEntityRef>;
}

class ADCEntityProvider implements ADCEntityProviderService {
  private readonly env: string;
  private connection: EntityProviderConnection|null = null;

  constructor(
    env: string,
  ) {
    this.env = env;
  }

  getProviderName(): string {
    return `gcp-adc-${this.env}`;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
  }

  getConnection(): EntityProviderConnection|null {
    return this.connection;
  }

  async registerADCEntity(): Promise<CompoundEntityRef> {
    if (!this.connection) {
      throw new Error('Entity provider connection not initialized.');
    }

    const compoundAdcEntityRef: CompoundEntityRef = {
      kind: 'Resource',
      namespace: 'default',
      name: "gcp-adc-application-template-deployment"
    }

    const adcEntity: Entity = {
        kind: compoundAdcEntityRef.kind,
        apiVersion: 'backstage.io/v1alpha1',
        metadata: {
          namespace: compoundAdcEntityRef.namespace,
          name: compoundAdcEntityRef.name,
          description: "A Backstage entity related to an ADC application template deployment.",
          tags: ['adc', 'gcp'],
          annotations: {
            [ANNOTATION_LOCATION]: 'gcp-adc-https://applicationdesigncenter.gcloud.com/',
            [ANNOTATION_ORIGIN_LOCATION]: 'gcp-adc-https://applicationdesigncenter.gcloud.com/',
            'google.cloud/adc-template': 'selected-template'
          },
          links: [],
        },
        spec: {
          type: 'service',
          lifecycle: 'production',
          owner: 'guest',
        },
    }

    await this.connection.applyMutation({
      type: 'delta',
      added: [{ locationKey: `gcp-adc-provider:${this.env}`, entity: adcEntity }],
      removed: []
    });

    await this.connection.refresh({keys: [`gcp-adc-provider:${this.env}`]});

    return compoundAdcEntityRef;
  }
}

export const adcEntityProviderServiceRef = createServiceRef<ADCEntityProviderService>({
  id: 'gcp-adc.entityprovider',
  scope: 'root',
  defaultFactory: async service => 
    createServiceFactory({
      service,
      deps: {},
      factory() {
        return new ADCEntityProvider('dev')
      }
    })
});

export const adcCatalogRegisterAction = (adcEntityProvider: ADCEntityProviderService, catalogApi: CatalogApi, authService: AuthService) => {
  return createTemplateAction({
    id: 'gcloud:adc:catalog_register',
    description: 'Register an ADC application template deployment in the software catalog.',
    schema: {
      input: z.object({}),
    },
    async handler(context) {
        context.logger.info("Registering ADC entity in Software Catalog...");

        const entityRef = await adcEntityProvider.registerADCEntity();

        const { token } = (await authService.getPluginRequestToken({
          onBehalfOf: await context.getInitiatorCredentials(),
          targetPluginId: 'catalog',
        }));

        const entity = await catalogApi.getEntityByRef(entityRef, { token });
        
        if (!entity){
          throw Error('Entity failed to get registered in Software Catalog');
        } else {
          context.logger.info("Entity was successfully registered in software catalog.");
          context.output("entityRef", stringifyEntityRef(entity));
        }
        
    },
  });
};