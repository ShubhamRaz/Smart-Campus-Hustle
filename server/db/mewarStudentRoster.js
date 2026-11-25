const studentNames = [
  'ARTI KUSHWAHA',
  'MOHAMED ABDALMAGED ALDOWMA ADAM',
  'GAUTAM KUMAR',
  'KUNDAN KUMAR CHOUDHARY',
  'MIR FAIZANUL MUSTAFA',
  'REKHA KUMARI',
  'MD AARIF HUSSAIN',
  'SUCHARJA KARMAKAR',
  'VIKASH RAJ',
  'DIPSHIKHA SAH',
  'SAJIYA KHAN',
  'VICKY KUMAR',
  'ALBARA MOHAMMED MUSTAFA AHMED',
  'MOHD AFSAR',
  'ANUJ SINGH RAWAT',
  'ROSHNI GEHLOT',
  'SOUVIK MALIK',
  'MD FAIZAN PERWEZ',
  'RISHITA RANAWAT',
  'KOMAL KATYANI',
  'MD SAMIR ANSARI',
  'PRIYANSHU SINGH',
  'DEVENDRA KUMAWAT',
  'ABHISHEK BAIRWA',
  'MS. SANIYA DESHWALI',
  'VINEET PRAJAPATI',
  'SACHIN KUMAR RAM',
  'RAVI JOSHI',
  'RAJ KUMAR SINGH',
  'TAJDARUL HAQUE',
  'KARUNA AMBEDKAR',
  'RAVI RANJAN KUMAR',
  'SHIVAM SINGH',
  'NAMAN KUMAR',
  'RABIUL MIDDYA',
  'VIKRAM SINGH',
  'GUNGUN PATWA',
  'MD ARSHAD ALI',
  'RAMESHWAR DASHORA',
  'SHEETAL PRIYA',
  'MANISH YADAV',
  'MS. VANSHIKA DEVDA',
  'HIMANSHU SAIN',
  'DIVYANSHI SACHAN',
  'MONU PRATAP SINGH',
  'MD HASAN RAZA',
  'MD FARHAN AHMAD',
  'ANISH KUMAR SONI',
  'SAKSHAM BAKSHI',
  'ANKIT KUMAR',
  'ROHIT BHASKAR'
];

const importBatch = 'mewar_authorized_roster_2026_11_01';
const sourceNote =
  'Name-only roster supplied by an authorized user. Student identity and enrollment details are incomplete; no login account has been created.';

export function seedMewarStudentRoster(db, tenantId = 'tenant_apex') {
  const insertRosterEntry = db.prepare(`
    INSERT OR IGNORE INTO student_roster_records (
      id, tenant_id, full_name, record_status, source_note, import_batch
    ) VALUES (?, ?, ?, 'INCOMPLETE', ?, ?)
  `);

  db.exec('BEGIN');
  try {
    studentNames.forEach((fullName, index) => {
      insertRosterEntry.run(
        `mewar_student_roster_2026_${String(index + 1).padStart(3, '0')}`,
        tenantId,
        fullName,
        sourceNote,
        importBatch
      );
    });
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
