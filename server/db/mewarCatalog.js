const departments = [
  'Computer Science and Engineering',
  'Computer Applications',
  'Civil Engineering',
  'Chemical Engineering',
  'Electrical Engineering',
  'Electronics and Communication Engineering',
  'Mechanical Engineering',
  'Mining Engineering',
  'Biotechnology',
  'Basic and Applied Sciences',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Life Sciences',
  'Management Studies',
  'Commerce',
  'Legal Studies',
  'Education',
  'Psychology',
  'Physical Education',
  'Agriculture',
  'Pharmacy',
  'Physiotherapy',
  'Paramedical Sciences',
  'Economics',
  'Geography',
  'History',
  'Political Science',
  'Sociology',
  'Humanities and Social Sciences',
  'Hospitality and Tourism',
  'Yoga',
  'Alternative Therapy',
  'Astrology'
];

const programmes = [
  ['Computer Applications', ['BCA', 'MCA', 'BCA-MCA', 'PGDCA', 'PhD in Computer Science']],
  ['Computer Science and Engineering', ['Diploma in Computer Science Engineering', 'B.Tech Computer Science Engineering', 'M.Tech Computer Science Engineering', 'M.Tech Data Science', 'PhD in Computer Science']],
  ['Civil Engineering', ['Diploma in Civil Engineering', 'B.Tech Civil Engineering', 'M.Tech Civil Engineering']],
  ['Mechanical Engineering', ['Diploma in Mechanical Engineering', 'B.Tech Mechanical Engineering', 'M.Tech Mechanical Engineering']],
  ['Electrical Engineering', ['Diploma in Electrical Engineering', 'B.Tech Electrical Engineering']],
  ['Electronics and Communication Engineering', ['B.Tech Electronics and Communication Engineering']],
  ['Engineering', ['M.Tech Engineering Programmes']],
  ['Management Studies', ['BBA', 'MBA', 'BBA-MBA']],
  ['Commerce', ['B.Com', 'M.Com']],
  ['Legal Studies', ['BA LLB', 'BBA LLB', 'LLB', 'LLM']],
  ['Education', ['D.El.Ed', 'B.Ed', 'MA Education']],
  ['Basic and Applied Sciences', ['B.Sc', 'M.Sc', 'PhD']],
  ['Agriculture', ['B.Sc Agriculture', 'M.Sc Agronomy', 'PhD Agriculture']],
  ['Pharmacy', ['D.Pharm', 'B.Pharm', 'M.Pharm', 'PhD Pharmacy']],
  ['Physiotherapy', ['BPT', 'MPT', 'PhD']]
];

const facultyByDepartment = [
  ['Computer Science and Engineering', [
    'Anuradha Gupta', 'Asifa Farooq', 'Bachcha Pal', 'Bhagya Sharma', 'Bhupesh Devda',
    'Chandikaditya Kumawat', 'Chandra Shekhar', 'Deepti Shastri', 'Dilip Menariya',
    'Idrees Bhat', 'Jahangeer Rajab', 'Jyoti Mundra', 'Kalpana Purbiya', 'Kundan Rav',
    'Neelu Maheshwari', 'Nidhi Sharma', 'Nihal Dadheech', 'Pallavi Purohit',
    'Rajesh Khator', 'Ravi Sharma', 'Saurabh Singh', 'Shailendra Rathore', 'Sneha Tank',
    'Sonia Singla', 'Sunit Kumar', 'Veerkant Bhaskar', 'Vikram Rao', 'Virendra Singh',
    'Yukti Tiwari'
  ]],
  ['Civil Engineering', [
    'Abhay Singh', 'Ankita Saxena', 'Arun Yadav', 'Deepak Dwivedi', 'Esar Ahmad',
    'Gourav Tiwari', 'Himanshu Sadhya', 'Kamaljeet Singh', 'Mustazib Raza',
    'Prafful Sharma', 'Qadir Raza', 'Rajat Saxena', 'Rameez Khan', 'Sajad Mir'
  ]],
  ['Chemical Engineering', [
    'Amal Haridas', 'Gaurav Jatav', 'Giriraj Tailor', 'Mukul Vijay', 'Rahul Lodha',
    'Sanjay Soni'
  ]],
  ['Electrical Engineering', [
    'Abhishek Chauhan', 'Ankit Singh', 'Anuj Kumar', 'Anurag Shekhawat', 'Deepak Joshi',
    'Falguni Chaturvedi', 'Ibrahim Khan', 'Kosha Dutta', 'Rohan Singh',
    'Shipra Khandelwal', 'Suraj Kumhar', 'Vinesh Agarwal'
  ]],
  ['Electronics and Communication Engineering', [
    'Gaurav Sharma', 'Jitendra Vaswani', 'Komal Yadav', 'Neha Sharma', 'Priyanka Sharma',
    'Ritesh Ojha', 'Shashank Kumar', 'Yuvraj Ranawat'
  ]],
  ['Mechanical Engineering', [
    'Akhil Manhas', 'Ananya Mishra', 'Chandan Kumar', 'Dhwaj Sharma', 'Dinesh Kumar',
    'Jatinder Kumar', 'Javed Qurashi', 'Nikita Jain', 'Prakash Mohan', 'Samer Khan',
    'Tanveer Koka', 'Udai Regar'
  ]],
  ['Mining Engineering', ['Azharuddin Azharuddin', 'Dinkar Narayan', 'Shivam Yagnik']],
  ['Basic and Applied Sciences', [
    'Akhilesh Dwivedi', 'Anurag Pakal', 'Debdeep Sinha', 'Deepak Vyas', 'Harish Saraswat',
    'Harshpreet Cheema', 'Jeevan Sisodiya', 'Karuna Laddha', 'Komal Prajapat',
    'Lirbon Englengpi', 'Neha Shrivas', 'Prachi Singh', 'Pramod Mehta', 'Raman Malik',
    'Ritu Sharma', 'Sweta Kumari', 'Ujjwal Tripathy', 'Umesh Garu', 'Vandana Chundawat'
  ]],
  ['Biotechnology', ['Pankaj Teli']],
  ['Education', [
    'Dr. Aruna Dube', 'Dr. Munendra Kumar Tyagi', 'Dr. Urus Fatema',
    'Dr. Sushil Kumar Sharma', 'Dr. Ramesh Pareek', 'Dr. Ravendra Kumar',
    'Dr. Pooja Gupta', 'Dr. Indira Singh', 'Dr. Shubhada Pandey', 'Dr. Mamta Sharma',
    'Dr. Munendra Kumar', 'Dr. Kiran Tripathi', 'Dr. Sanjay Kumar'
  ]]
];

const leadership = [
  ['Dean Academics', 'Prof. (Dr.) Deepak Vyas'],
  ['Alternative Therapy', 'Dr. Om Prakash Sharma'],
  ['Legal Studies', 'Prof. (Dr.) Alok Misra'],
  ['Education and Psychology', 'Prof. (Dr.) Aruna Dubey'],
  ['Science and Technology', 'Dr. Pramod Mehta'],
  ['Humanities, Social Science and Fine Arts', 'Prof. (Dr.) Sonia Singla'],
  ['Paramedical and Health Science', 'Dr. Gyan Maheshwari']
];

const slug = (value) => value
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export function seedMewarCatalog(db, tenantId = 'tenant_apex') {
  ensureProgrammeDepartmentOptional(db);

  const insertProfile = db.prepare(`
    INSERT OR IGNORE INTO university_profiles (
      tenant_id, university_type, established_year, location, district, state,
      country, postal_code, region, academic_session, official_website,
      admissions_website, student_portal, admissions_helpline, admissions_email,
      source_note
    ) VALUES (?, 'Private University', 2009, 'Gangrar, Chittorgarh', 'Chittorgarh',
      'Rajasthan', 'India', '312901', 'Mewar, Rajasthan', '2026-2027',
      'https://www.mewaruniversity.org/', 'https://muenquiry.mewaruniversity.edu.in/',
      'https://portal.mewaruniversity.edu.in/', '18001218086',
      'admission@mewaruniversity.org',
      'Imported from user-provided Mewar University dataset; verify official details before publication.')
  `);
  const insertDepartment = db.prepare(`
    INSERT OR IGNORE INTO university_departments (id, tenant_id, name)
    VALUES (?, ?, ?)
  `);
  const insertProgramme = db.prepare(`
    INSERT OR IGNORE INTO university_programmes (id, tenant_id, department_id, name)
    VALUES (?, ?, ?, ?)
  `);
  const insertFaculty = db.prepare(`
    INSERT OR IGNORE INTO faculty_directory (
      id, tenant_id, department_id, full_name, directory_section, source_note
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN');
  try {
    insertProfile.run(tenantId);
    for (const name of departments) {
      insertDepartment.run(`mewar_dept_${slug(name)}`, tenantId, name);
    }

    const departmentIds = new Map(
      db.prepare('SELECT id, name FROM university_departments WHERE tenant_id = ?')
        .all(tenantId)
        .map((row) => [row.name, row.id])
    );

    for (const [departmentName, entries] of programmes) {
      const departmentId = departmentIds.get(departmentName);
      for (const name of entries) {
        insertProgramme.run(
          `mewar_programme_${slug(departmentName)}_${slug(name)}`,
          tenantId,
          departmentId || null,
          name
        );
      }
    }

    const facultySource =
      'Name and department copied from the user-provided directory; current employment and assignment are pending university verification.';
    for (const [departmentName, names] of facultyByDepartment) {
      const departmentId = departmentIds.get(departmentName);
      if (!departmentId) continue;
      for (const name of names) {
        insertFaculty.run(
          `mewar_faculty_${slug(departmentName)}_${slug(name)}`,
          tenantId,
          departmentId,
          name,
          'FACULTY',
          facultySource
        );
      }
    }

    for (const [area, name] of leadership) {
      insertFaculty.run(
        `mewar_leadership_${slug(area)}_${slug(name)}`,
        tenantId,
        null,
        name,
        'PUBLISHED_LEADERSHIP',
        'Leadership listing copied from the user-provided directory; current appointment is pending university verification.'
      );
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function ensureProgrammeDepartmentOptional(db) {
  const departmentColumn = db.prepare('PRAGMA table_info(university_programmes)')
    .all()
    .find((column) => column.name === 'department_id');
  if (!departmentColumn || departmentColumn.notnull === 0) return;

  db.exec('BEGIN');
  try {
    db.exec(`
      DROP INDEX IF EXISTS idx_university_programmes_tenant_department;
      ALTER TABLE university_programmes RENAME TO university_programmes_legacy;
      CREATE TABLE university_programmes (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        department_id TEXT,
        name TEXT NOT NULL,
        verification_status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (tenant_id, department_id, name),
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES university_departments(id) ON DELETE CASCADE
      );
      INSERT INTO university_programmes (
        id, tenant_id, department_id, name, verification_status, created_at
      )
      SELECT id, tenant_id, department_id, name, verification_status, created_at
      FROM university_programmes_legacy;
      DROP TABLE university_programmes_legacy;
      CREATE INDEX idx_university_programmes_tenant_department
      ON university_programmes (tenant_id, department_id, name);
    `);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
