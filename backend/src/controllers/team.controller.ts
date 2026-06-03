import { Response, NextFunction } from 'express';
import { teamService } from '../services/team.service';
import { AuthRequest, CreateTeamRequest, InviteMemberRequest, UpdateRoleRequest } from '../types';
import { successResponse, createdResponse, noContentResponse } from '../utils/response';

class TeamController {
  createTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const data: CreateTeamRequest = req.body;
      const team = await teamService.createTeam(userId, data);

      createdResponse(res, team, 'Team created successfully');
    } catch (error) {
      next(error);
    }
  };

  getTeam = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const team = await teamService.getTeam(id, userId);

      successResponse(res, team, 'Team fetched successfully');
    } catch (error) {
      next(error);
    }
  };

  getUserTeams = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const teams = await teamService.getUserTeams(userId);

      successResponse(res, teams, 'Teams fetched successfully');
    } catch (error) {
      next(error);
    }
  };

  inviteMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { email, role }: InviteMemberRequest = req.body;
      const member = await teamService.inviteMember(id, userId, email, role);

      createdResponse(res, member, 'Member added to team successfully');
    } catch (error) {
      next(error);
    }
  };

  removeMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id, memberUserId } = req.params;
      await teamService.removeMember(id, userId, memberUserId);

      successResponse(res, null, 'Member removed from team successfully');
    } catch (error) {
      next(error);
    }
  };

  updateMemberRole = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id, memberUserId } = req.params;
      const { role }: UpdateRoleRequest = req.body;
      const updated = await teamService.updateMemberRole(id, userId, memberUserId, role);

      successResponse(res, updated, 'Member role updated successfully');
    } catch (error) {
      next(error);
    }
  };

  getTeamMembers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const members = await teamService.getTeamMembers(id, userId);

      successResponse(res, members, 'Team members fetched successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const teamController = new TeamController();
export default teamController;
