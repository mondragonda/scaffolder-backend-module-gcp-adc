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
  EntityProviderConnection,

} from '@backstage/plugin-catalog-node';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  CompoundEntityRef,
  Entity,
  parseEntityRef,
} from '@backstage/catalog-model';
import { ADCEntityProviderService } from './adc-entity-provider-service';
import { ADCDeploymentInfo } from './types';


export class ADCEntityProvider implements ADCEntityProviderService {
  private connection: EntityProviderConnection|null = null;
  private readonly adcLocationKeyPrefix = 'gcp-adc';

  getProviderName(): string {
    return `${this.adcLocationKeyPrefix}-entity-provider`;
  }

  getLocationKey(adcDeploymentResourceUrl: string): string {
    return `${this.getProviderName()}:${adcDeploymentResourceUrl}`;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
  }

  generateADCEntityConfiguration(entityInfo: Entity, adcDeploymentInfo: ADCDeploymentInfo,  annotateLocation: boolean = true): Entity {
      return {
        ...entityInfo,
        metadata: {
          ...entityInfo.metadata,
          annotations: {
            ...entityInfo.metadata.annotations,
            ...annotateLocation && {[ANNOTATION_LOCATION]: `${this.getLocationKey(adcDeploymentInfo.adcDeploymentCallUrl)}`},
            [ANNOTATION_ORIGIN_LOCATION]: `${this.getLocationKey(adcDeploymentInfo.adcDeploymentCallUrl)}`,
            'google.cloud/adc-template-identifier': adcDeploymentInfo.adcTemplate
          },
          links: [...(entityInfo.metadata.links || []), {
            icon: 'cloud',
            title: adcDeploymentInfo.adcTemplate,
            url: adcDeploymentInfo.resourceUrl,
          }]
        }
      }
  }

  async registerADCEntity(entityInfo: Entity, adcDeploymentInfo: ADCDeploymentInfo): Promise<CompoundEntityRef> {
    if (!this.connection) {
      throw new Error('Entity provider connection not initialized.');
    }

    const entity = this.generateADCEntityConfiguration(entityInfo, adcDeploymentInfo);

    await this.connection.applyMutation({
      type: 'delta',
      added: [{ 
        locationKey: `${this.getLocationKey(adcDeploymentInfo.resourceUrl)}`, 
        entity
      }],
      removed: []
    });
   
    return parseEntityRef({ kind: entity.kind, name: entity.metadata.name, namespace: entity.metadata.namespace });
  }
}
