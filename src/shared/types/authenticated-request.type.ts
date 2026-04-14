import { User } from 'src/auth/user/entities/user.entity';

export type AuthenticatedRequest = Request & {
  user: User;
};
