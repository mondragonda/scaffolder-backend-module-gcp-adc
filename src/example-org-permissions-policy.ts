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
import { AuthorizeResult, isPermission, isResourcePermission, PolicyDecision } from "@backstage/plugin-permission-common";
import { PolicyQuery, PolicyQueryUser, PermissionPolicy } from "@backstage/plugin-permission-node";
import { catalogConditions, createCatalogConditionalDecision } from "@backstage/plugin-catalog-backend/alpha";
import {
  templateParameterReadPermission,
  templateStepReadPermission,
} from '@backstage/plugin-scaffolder-common/alpha';
import {
  createScaffolderTemplateConditionalDecision,
  scaffolderTemplateConditions,
} from '@backstage/plugin-scaffolder-backend/alpha';
import { googleApisAuthPermission } from "./google-apis-auth";


/**
 * An example organizational permissions policy with basic checks and usage of the module features.
 * Backstage only allows to have one permission policy loaded.
 */
export class ExampleOrgPermissionsPolicy implements PermissionPolicy {
  async handle(request: PolicyQuery, user?: PolicyQueryUser): Promise<PolicyDecision> {

    /**
     * Allow only executing actions over catalog entities if request user is owner (by itself or group ownership)
     */
    if (isResourcePermission(request.permission, 'catalog-entity')) {
      return createCatalogConditionalDecision(
        request.permission,
        catalogConditions.isEntityOwner({
          claims: user?.info.ownershipEntityRefs ?? []
        })
      )
    }

    /**
     * Deny access to any template parameter or template step action tagged with "disabled":
     * https://backstage.io/docs/features/software-templates/authorizing-scaffolder-template-details/#authorizing-parameters-and-steps
     */
    if (
      isPermission(request.permission, templateParameterReadPermission) ||
      isPermission(request.permission, templateStepReadPermission)
    ) {
      return createScaffolderTemplateConditionalDecision(request.permission, {
        not: scaffolderTemplateConditions.hasTag({ tag: 'disabled' })
      });
    }

    /**
     * Deny by default access for usage of Google APIs backend authentication
     */
    if (isPermission(request.permission, googleApisAuthPermission)) {
      return {
        result: AuthorizeResult.DENY
      }
    }

    /**
     * Allow all other authorization requests
     */
    return {
      result: AuthorizeResult.ALLOW
    }
  }
}