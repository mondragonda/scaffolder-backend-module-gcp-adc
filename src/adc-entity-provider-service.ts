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
import { createServiceFactory } from "@backstage/backend-plugin-api";
import { createServiceRef } from "@backstage/backend-plugin-api";
import { CompoundEntityRef, Entity } from "@backstage/catalog-model";
import { EntityProvider } from "@backstage/plugin-catalog-node";
import { ADCEntityProvider } from "./adc-entity-provider";
import { ADCDeploymentInfo } from ".";


export interface ADCEntityProviderService extends EntityProvider {
    getLocationKey(adcDeploymentResourceUrl: string): string;
    generateADCEntityConfiguration(entityInfo: Entity, adcDeploymentInfo: ADCDeploymentInfo,  annotateLocation?: boolean): Entity;
    registerADCEntity(entityInfo: Entity, adcDeploymentInfo: ADCDeploymentInfo): Promise<CompoundEntityRef>;
}
  
export const adcEntityProviderServiceRef = createServiceRef<ADCEntityProviderService>({
    id: 'gcp-adc.entityprovider',
    scope: 'root',
    defaultFactory: async service => 
      createServiceFactory({
        service,
        deps: {},
        factory() {
          return new ADCEntityProvider()
        }
      })
  });