import { Router } from 'express';
import { teamController } from '../../controllers/team.controller';
import { authenticate } from '../../middleware/auth';
import { defaultRateLimiter } from '../../middleware/rateLimiter';
import { validateBody, validateParams } from '../../middleware/validator';
import { createTeamSchema, inviteMemberSchema, updateRoleSchema, teamParamsSchema, teamMemberParamsSchema } from '../../validators/team.validator';

const router = Router();

router.use(authenticate);

router.post('/', defaultRateLimiter, validateBody(createTeamSchema), teamController.createTeam);
router.get('/', defaultRateLimiter, teamController.getUserTeams);
router.get('/:id', defaultRateLimiter, validateParams(teamParamsSchema), teamController.getTeam);
router.get('/:id/members', defaultRateLimiter, validateParams(teamParamsSchema), teamController.getTeamMembers);
router.post('/:id/members', defaultRateLimiter, validateParams(teamParamsSchema), validateBody(inviteMemberSchema), teamController.inviteMember);
router.delete('/:id/members/:memberUserId', defaultRateLimiter, teamController.removeMember);
router.put('/:id/members/:memberUserId', defaultRateLimiter, validateBody(updateRoleSchema), teamController.updateMemberRole);

export default router;
