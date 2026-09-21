export * from '../shared/types/index.js';

export interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
}
