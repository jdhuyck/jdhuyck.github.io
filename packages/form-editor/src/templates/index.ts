/**
 * Register every template here. To add one:
 *   1. Put the blank PDF in /public/templates/ (repo root).
 *   2. Describe its fields in a new file next to this one (copy lesson-plan.ts).
 *      Use the "measure" mode in `npm run dev` to read off field rectangles.
 *   3. Import and register it below.
 */
import { templates } from './registry';
import { lessonPlan } from './lesson-plan';
import { traineeObservation } from './trainee-observation';
import { fops } from './fops';

templates.register(lessonPlan);
templates.register(traineeObservation);
fops.forEach(t => templates.register(t));

export { templates };
