// Run the training-inference job locally: npm run training:infer
import { config } from 'dotenv';
config({ path: '.env.local' });

const { runTrainingInference } = await import('../../src/server/sync/inference');
const result = await runTrainingInference('manual');
console.log(result);
