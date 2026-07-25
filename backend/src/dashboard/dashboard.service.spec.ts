import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';

describe('DashboardService authorization', () => {
  const db = {
    organizerMember: { findFirst: jest.fn() },
    organizer: { findMany: jest.fn() },
  };
  const service = new DashboardService(db as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects organizer users from admin sections', async () => {
    await expect(service.section({ sub: 'user-1', role: 'ORGANIZER_ADMIN' }, 'admin', 'organizers')).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.organizer.findMany).not.toHaveBeenCalled();
  });

  it('rejects users without an organizer membership', async () => {
    db.organizerMember.findFirst.mockResolvedValue(null);
    await expect(service.section({ sub: 'user-1', role: 'ORGANIZER_STAFF' }, 'organizer', 'trips')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects unknown dashboard roles', async () => {
    await expect(service.section({ sub: 'admin-1', role: 'SUPER_ADMIN' }, 'unknown', 'trips')).rejects.toBeInstanceOf(NotFoundException);
  });
});
