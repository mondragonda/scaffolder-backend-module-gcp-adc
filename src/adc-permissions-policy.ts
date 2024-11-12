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
    templateParameterReadPermission,
    templateStepReadPermission,
  } from '@backstage/plugin-scaffolder-common/alpha';
  import {
    createScaffolderTemplateConditionalDecision,
    scaffolderTemplateConditions,
  } from '@backstage/plugin-scaffolder-backend/alpha';
import { PermissionPolicy, PolicyQuery } from '@backstage/plugin-permission-node';
import { AuthorizeResult, isPermission } from '@backstage/plugin-permission-common';
import { PolicyQueryUser } from '@backstage/plugin-permission-node';
import { PolicyDecision } from '@backstage/plugin-permission-common';
  
export class ADCTemplatePermissionsPolicy implements PermissionPolicy {
    async handle(
      request: PolicyQuery,
      user?: PolicyQueryUser,
    ): Promise<PolicyDecision> {
      if (
        isPermission(request.permission, templateParameterReadPermission) ||
        isPermission(request.permission, templateStepReadPermission)
      ) {

        const scaffolderConditionalPolicyDecision = createScaffolderTemplateConditionalDecision(request.permission, {
          not: scaffolderTemplateConditions.hasTag({ tag: 'secret' })
        });

        return scaffolderConditionalPolicyDecision;
      }
      return {
        result: AuthorizeResult.ALLOW,
      };
    }
}
