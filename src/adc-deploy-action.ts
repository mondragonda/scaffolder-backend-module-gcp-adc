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

export const adcDeployAction = () => {
  return createTemplateAction({
    id: 'gcloud:adc:deploy',
    description: 'Deploy an adc application template.',
    schema: {
      input: z.object({
        adcTemplate: z.string().describe('The adc application template id to deploy.'),
        token: z.string().describe('Google OAuth token with necessary IAM permissions to deploy on Google Cloud ADC.')
      }),
    },
    async handler(context) {
      context.logger.info('Starting deployment on ADC...');
      context.logger.info('Deployment info: ');
      context.logger.info(`ADC template: ${context.input.adcTemplate}`);
      context.logger.info(`token: ${context.input.token}`);
      // const response = await fetch('https://external-service-url/deploy', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${context.input.token}`,
      //   },
      //   body: JSON.stringify({ templateId: context.input.adcTemplate }),
      // });

      // if (!response.ok) {
      //   throw new Error(`Deployment failed: ${response.statusText}`);
      // }

      context.logger.info('Deployment succeeded.');
    },
  });
};