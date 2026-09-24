let lang=localStorage.getItem('tv_lang')||'en';
let page='dashboard';
let pageHistory=['dashboard'];
const get=(k,d)=>{try{const x=JSON.parse(localStorage.getItem(k));return x==null?d:x}catch{return d}};
const t=k=>T[lang][k]||k;
let __tvAutoBackupTimer=null;
const put=(k,v)=>{localStorage.setItem(k,JSON.stringify(v));if(window.tvgs?.autoBackup){clearTimeout(__tvAutoBackupTimer);__tvAutoBackupTimer=setTimeout(()=>autoBackupSilent(),1800)}};
const keys={students:'tv_students',classes:'tv_classes',subjects:'tv_subjects',staff:'tv_staff',school:'tv_school',fees:'tv_fees',feeStructure:'tv_fee_structure',salary:'tv_salary',attendance:'tv_attendance',exams:'tv_exams',marks:'tv_marks',tc:'tv_tc',sessions:'tv_sessions',subjectAssignments:'tv_subject_assignments',shifts:'tv_shifts',periods:'tv_periods',timetable:'tv_timetable',teacherAttendance:'tv_teacher_attendance',auth:'tv_auth',accountingIncome:'tv_accounting_income',accountingExpenses:'tv_accounting_expenses',permissions:'tv_staff_permissions',formFields:'tv_form_fields',documentRules:'tv_document_rules',theme:'tv_theme',currentUser:'tv_current_user',rollManagement:'tv_roll_management',mIncome:'tv_madrasa_income',mRaseedBooks:'tv_madrasa_raseed_books',mRaseedCollections:'tv_madrasa_raseed_collections',mBoxes:'tv_madrasa_sadaqah_boxes',mBoxCollections:'tv_madrasa_box_collections',mHostelBuildings:'tv_madrasa_hostel_buildings',mHostelRooms:'tv_madrasa_hostel_rooms',mHostelAllocations:'tv_madrasa_hostel_allocations',mLibraryBooks:'tv_madrasa_library_books',mLibraryLoans:'tv_madrasa_library_loans'};
function currentUser(){return get(keys.currentUser,null)}
