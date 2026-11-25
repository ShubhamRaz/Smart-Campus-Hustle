import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import db from './connection.js';

const expectedHeader = [
  'Enrollment No.',
  'Roll No.',
  'Student Name',
  'Course-Branch-Semester-Year',
  'Room No.'
];
const importBatch = 'mewar_student_register_2026_11_01';
const verificationNote =
  'Authorized user designated the supplied register as verified; not independently verified by the university.';

export function parseMewarStudentRegisterTsv(contents) {
  const lines = contents.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('The student register must include a header and at least one record.');

  const header = lines[0].split('\t').map((field) => field.trim());
  if (header.length !== expectedHeader.length || header.some((field, index) => field !== expectedHeader[index])) {
    throw new Error('The student register header does not match the expected five-column format.');
  }

  const seenEnrollmentNumbers = new Set();
  return lines.slice(1).map((line, index) => {
    const cells = line.split('\t').map((field) => field.trim());
    const lineNumber = index + 2;
    if (cells.length !== expectedHeader.length) {
      throw new Error(`Student register row ${lineNumber} must contain exactly five columns.`);
    }

    const [enrollmentNumber, rollNumber, fullName, courseDetails, roomNumber] = cells;
    if (!/^MUR\d+$/.test(enrollmentNumber)) {
      throw new Error(`Student register row ${lineNumber} has an invalid enrollment number.`);
    }
    if (!fullName || !courseDetails) {
      throw new Error(`Student register row ${lineNumber} is missing a name or course description.`);
    }
    if (seenEnrollmentNumbers.has(enrollmentNumber)) {
      throw new Error(`Student register contains a duplicate enrollment number on row ${lineNumber}.`);
    }
    seenEnrollmentNumbers.add(enrollmentNumber);

    return {
      enrollmentNumber,
      rollNumber: rollNumber || null,
      fullName,
      courseDetails,
      roomNumber: roomNumber || null
    };
  });
}

export function importMewarStudentProfiles(database, contents, tenantId = 'tenant_apex') {
  const profiles = parseMewarStudentRegisterTsv(contents);
  const upsertProfile = database.prepare(`
    INSERT INTO student_profiles (
      id, tenant_id, enrollment_number, roll_number, full_name, course_details,
      room_number, verification_status, verification_note, import_batch,
      verified_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'VERIFIED', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (tenant_id, enrollment_number) DO UPDATE SET
      roll_number = excluded.roll_number,
      full_name = excluded.full_name,
      course_details = excluded.course_details,
      room_number = excluded.room_number,
      verification_status = excluded.verification_status,
      verification_note = excluded.verification_note,
      import_batch = excluded.import_batch,
      verified_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `);

  database.exec('BEGIN IMMEDIATE');
  try {
    for (const profile of profiles) {
      upsertProfile.run(
        `mewar_student_profile_${profile.enrollmentNumber}`,
        tenantId,
        profile.enrollmentNumber,
        profile.rollNumber,
        profile.fullName,
        profile.courseDetails,
        profile.roomNumber,
        verificationNote,
        importBatch
      );
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
  return profiles.length;
}

function readCliOptions(args) {
  const fileIndex = args.indexOf('--file');
  if (fileIndex < 0 || !args[fileIndex + 1]) {
    throw new Error('Usage: node server/db/mewarStudentProfiles.js --file <tab-separated-register> [--tenant tenant_apex]');
  }
  const tenantIndex = args.indexOf('--tenant');
  return {
    filePath: args[fileIndex + 1],
    tenantId: tenantIndex >= 0 ? args[tenantIndex + 1] : 'tenant_apex'
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const { filePath, tenantId } = readCliOptions(process.argv.slice(2));
    const contents = fs.readFileSync(filePath, 'utf8');
    const importedCount = importMewarStudentProfiles(db, contents, tenantId);
    process.stdout.write(`Imported ${importedCount} student profiles for ${tenantId}.\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
