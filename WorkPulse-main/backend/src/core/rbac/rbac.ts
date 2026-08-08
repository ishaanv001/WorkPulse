import { Role, RoleId, Permission, User } from '../../types';

export const ROLES: Role[] = [
  {
    id: 'member', name: 'Team Member',
    description: 'Standard team member with access to own workload data',
    color: '#60a5fa',
    permissions: ['workload:view:own', 'workload:edit:own', 'task:create', 'task:edit:own', 'analytics:view:basic'],
  },
  {
    id: 'team_lead', name: 'Team Lead',
    description: 'Team lead with team-wide visibility and task management',
    color: '#34d399',
    inheritsFrom: ['member'],
    permissions: ['workload:view:team', 'workload:edit:team', 'task:assign', 'task:edit:team', 'team:view:members', 'analytics:view:advanced'],
  },
  {
    id: 'manager', name: 'Manager',
    description: 'Manager with full team management and predictive analytics',
    color: '#f59e0b',
    inheritsFrom: ['team_lead'],
    permissions: ['workload:view:all', 'team:manage', 'task:delete', 'workload:export', 'analytics:view:predictive', 'team:invite', 'fuzzy:configure', 'checkpoint:create', 'checkpoint:restore'],
  },
  {
    id: 'hr', name: 'HR Specialist',
    description: 'HR with cross-team workload visibility and export rights',
    color: '#a78bfa',
    permissions: ['workload:view:all', 'analytics:view:advanced', 'workload:export', 'team:view:members'],
  },
  {
    id: 'executive', name: 'Executive',
    description: 'Executive with strategic analytics access',
    color: '#00d9ff',
    permissions: ['workload:view:all', 'analytics:view:predictive', 'team:view:members', 'workload:export'],
  },
  {
    id: 'admin', name: 'System Admin',
    description: 'Full system administration including RBAC and audit',
    color: '#f87171',
    inheritsFrom: ['manager'],
    permissions: ['admin:users:manage', 'admin:system:configure', 'admin:audit:view', 'admin:rbac:manage', 'ml:retrain', 'ml:export', 'checkpoint:delete'],
  },
];

const ROLE_MAP = Object.fromEntries(ROLES.map(r => [r.id, r])) as Record<RoleId, Role>;

export function getAllPermissions(roleId: RoleId, visited = new Set<RoleId>()): Permission[] {
  if (visited.has(roleId)) return [];
  visited.add(roleId);
  const role = ROLE_MAP[roleId];
  if (!role) return [];
  const inherited = (role.inheritsFrom ?? []).flatMap(pid => getAllPermissions(pid, visited));
  return Array.from(new Set([...role.permissions, ...inherited]));
}

export function hasPermission(roleId: RoleId, permission: Permission): boolean {
  return getAllPermissions(roleId).includes(permission);
}

export function getRole(roleId: RoleId): Role | undefined {
  return ROLE_MAP[roleId];
}

export const USERS: User[] = [
  { id: 'u1', name: 'Sarah Miller',  email: 'sarah.miller@workloadiq.com',  roles: ['manager'],   teamIds: ['t1'], avatar: 'SM' },
  { id: 'u2', name: 'David Chen',    email: 'david.chen@workloadiq.com',    roles: ['admin'],     teamIds: ['t1', 't2'], avatar: 'DC' },
  { id: 'u3', name: 'Anna Rodriguez',email: 'anna.rodriguez@workloadiq.com',roles: ['hr'],        teamIds: [], avatar: 'AR' },
  { id: 'u4', name: 'James Liu',     email: 'james.liu@workloadiq.com',     roles: ['executive'], teamIds: [], avatar: 'JL' },
  { id: 'u5', name: 'Maya Park',     email: 'maya.park@workloadiq.com',     roles: ['team_lead'], teamIds: ['t1'], avatar: 'MP' },
];
