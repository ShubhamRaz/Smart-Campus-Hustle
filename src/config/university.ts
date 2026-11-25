export const university = {
  name: 'Mewar University',
  campus: 'Gangrar Campus',
  location: 'Gangrar, Chittorgarh, Rajasthan'
};

export const getInstitutionName = (tenantId?: string, fallbackName?: string) =>
  tenantId === 'tenant_apex' ? university.name : fallbackName || university.name;

export const getCampusName = (campusId?: string, fallbackName?: string) =>
  campusId === 'campus_apex_main' ? university.campus : fallbackName || university.campus;

export const formatCgpaOutOfTen = (gpa: number | null | undefined) =>
  ((gpa ?? 3.92) * 2.5).toFixed(2);
