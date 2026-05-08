// ===========================================================
//  BiomeCheck · app.js
//  MediaPipe Pose + REBA/RULA scoring engine
//  Basado en papers cientificos:
//  - Lin et al. 2022 (Scientific Reports) "” seleccion automatica REBA/RULA
//  - Agostinelli et al. 2024 (Scientific Reports) "” MoCap 2D RGB validado
//  - Sardar et al. 2024 (Ergonomics) "” deep learning + REBA/RULA
// ===========================================================

// --- STATE ---
const state = {
  cameraActive: false,
  cameraStarting: false,
  mode: 'idle',
  selectedDeviceId: '',
  pose: null,
  showSkeleton: true,
  showPoints: true,
  method: 'REBA',
  lastAngles: {},
  lastScore: null,
  snapshotData: null,
  frameCount: 0,
  lastFpsTime: 0,
  videoStream: null,
  animFrame: null,
  selectedPatientId: '',
  patients: [],
  history: [],
  reportConfig: {
    model: 'auto',
    method: 'REBA',
    skeleton: true,
  },
  uploadImageDataUrl: '',
  currentUploadFile: null,
  currentUploadedFileId: '',
  platform: {
    session: null,
    user: null,
    profile: null,
    companies: [],
    sites: [],
    files: [],
    reports: [],
    actionPlans: [],
    workstations: [],
  },
};

const STORAGE = {
  patients: 'biomecheck_patients_v1',
  history: 'biomecheck_history_v1',
};

const PLATFORM_STORAGE = {
  session: 'biomecheck_platform_session_v1',
  theme: 'biomecheck_theme_v1',
  company: 'biomecheck_company_v1',
  companyId: 'biomecheck_company_id_v1',
  site: 'biomecheck_site_v1',
  siteId: 'biomecheck_site_id_v1',
  lang: 'biomecheck_lang_v1',
};

// ─── i18n ───
const I18N = {
  es: {
    'auth.tagline': 'Ergonomia, IA y gestion operativa',
    'auth.eyebrow': 'Acceso seguro',
    'auth.heading': 'Inicia sesion para evaluar puestos, reportes y planes de accion.',
    'auth.subheading': 'Acceso conectado a Supabase Auth. Los datos del panel se cargan desde tu base real.',
    'auth.email': 'Email',
    'auth.password': 'Contrasena',
    'auth.passwordPlaceholder': 'minimo 4 caracteres',
    'auth.login': 'Entrar al panel',
    'auth.signup': 'Crear cuenta',
    'auth.note': 'Usa el usuario creado en Supabase Auth o crea una cuenta nueva para pruebas.',
    'selector.step1': 'Paso 1',
    'selector.step2': 'Paso 2',
    'selector.companyTitle': 'Selecciona la compania',
    'selector.siteTitle': 'Selecciona la sede industrial',
    'selector.searchCompany': 'Buscar compania',
    'selector.searchSite': 'Buscar sede',
    'common.back': 'Anterior',
    'topbar.selectOrg': 'Selecciona empresa / sede',
    'topbar.myAccount': 'Mi cuenta',
    'topbar.changeOrg': 'Cambiar empresa / sede',
    'topbar.logout': 'Cerrar sesion',
    'status.ready': 'Listo',
    'status.processing': 'Procesando',
    'status.error': 'Error',
    'nav.dashboard': 'Dashboard',
    'nav.upload': 'Subir',
    'nav.files': 'Archivos',
    'nav.reports': 'Reportes',
    'nav.rotation': 'Multitarea y rotacion',
    'nav.ewa': 'EWA',
    'nav.pea': 'PEA Aggregator',
    'nav.actions': 'Planes de accion',
    'nav.settings': 'Configuracion',
    'nav.account': 'Mi cuenta',
    'nav.preferences': 'Preferencias',
    'nav.manageUsers': 'Gestionar usuarios',
    'nav.manageCompanies': 'Gestionar empresas',
    'nav.customReports': 'Reportes personalizados',
    'nav.liveCamera': 'Captura IA en vivo',
    'nav.patients': 'Pacientes',
    'nav.history': 'Historial',
    'panel.dashboard': 'Dashboard',
    'panel.upload': 'Subir archivo',
    'panel.files': 'Archivos',
    'panel.reports': 'Reportes',
    'panel.report': 'Reporte REBA / RULA',
    'panel.rotation': 'Multitarea y rotacion',
    'panel.ewa': 'Ergonomic Workplace Analysis',
    'panel.pea': 'PEA Aggregator',
    'panel.actions': 'Planes de accion',
    'panel.settings-account': 'Mi cuenta',
    'panel.settings-preferences': 'Preferencias',
    'panel.settings-users': 'Gestionar usuarios',
    'panel.settings-companies': 'Gestionar empresas',
    'panel.settings-custom-reports': 'Reportes personalizados',
    'panel.camera': 'Camara en vivo',
    'panel.patients': 'Pacientes',
    'panel.history': 'Historial de sesiones',
    'camera.pressStart': 'Presiona <strong>Iniciar</strong> para activar la camara',
    'bc.home': 'Inicio',
    'common.create': 'Crear',
    'common.newReport': 'Nuevo reporte',
    'common.filter': 'Filtrar',
    'common.search': 'Buscar',
    'upload.title': 'Enviar video',
    'rotation.title': 'Multitarea y rotacion',
    'pea.title': 'Evaluaciones ergonomicas preliminares',
    'account.overview': 'Resumen de la cuenta',
    'patients.new': 'Nuevo paciente',
    'history.clear': 'Limpiar historial',
    'dashboard.title': 'Dashboard con datos reales',
    'dashboard.summary': 'Resumen calculado desde Supabase.',
    'dashboard.empty': 'Aun no hay reportes guardados para esta empresa.',
    'dashboard.sendVideo': 'Enviar video',
    'dashboard.workstations': 'Puestos de trabajo',
    'dashboard.evaluated': 'Evaluados',
    'dashboard.reports': 'reportes',
    'dashboard.noCompany': 'Sin compania',
    'dashboard.highestRisk': 'Riesgo mas alto encontrado:',
    'dashboard.highestRiskShort': 'Riesgo mas alto encontrado',
    'dashboard.checklist': 'Checklist',
    'dashboard.realReports': 'Reportes reales',
    'dashboard.generatedReports': 'Reportes generados',
    'dashboard.realActivity': 'Actividad real',
    'dashboard.uploadedFiles': 'Archivos subidos',
    'dashboard.highRisk': 'Riesgo alto',
    'dashboard.requiresReview': 'Requiere revision',
    'dashboard.actionPlans': 'Planes de accion',
    'dashboard.openClosed': 'Abiertos y cerrados',
    'dashboard.latestReports': 'Ultimos reportes',
    'dashboard.method': 'Metodo',
    'dashboard.score': 'Score',
    'dashboard.risk': 'Riesgo',
    'dashboard.date': 'Fecha',
    'dashboard.noReports': 'No hay reportes aun. Sube un archivo o captura un frame para generar el primero.',
    'risk.negligible': 'Inapreciable',
    'risk.low': 'Riesgo aceptable',
    'risk.medium': 'Riesgo moderado',
    'risk.high': 'Riesgo alto',
    'risk.veryHigh': 'Riesgo muy alto',
    'risk.acceptableShort': 'aceptable',
    'risk.moderateShort': 'moderado',
    'risk.highShort': 'alto',
    'risk.veryHighShort': 'muy alto',
    'common.refresh': 'Actualizar',
    'common.apply': 'Aplicar',
    'common.ordering': 'Ordenar por',
    'common.noData': 'Sin datos',
    'common.newDocument': 'Nuevo documento',
    'upload.processingModels': 'Modelos de procesamiento',
    'upload.onePerson': 'Una persona',
    'upload.onePersonDesc': 'En videos con un solo trabajador, la persona evaluada se identifica automaticamente.',
    'upload.multiplePeople': 'Multiples personas',
    'upload.multiplePeopleDesc': 'Elige que trabajador sera evaluado cuando el video tenga mas de una persona.',
    'upload.drop': 'Agregar archivos o arrastrar y soltar',
    'upload.maxSize': 'Tamano maximo: 3GB',
    'upload.maxFiles': 'Maximo de archivos: 10',
    'upload.analyze': 'Analizar archivo',
    'upload.change': 'Cambiar archivo',
    'reports.biomechanical': 'Analisis biomecanico',
    'reports.angleByTime': 'Angulo por tiempo',
    'reports.wristHand': 'Reporte de muneca y mano',
    'reports.load': 'Analisis de carga',
    'reports.manualLifting': 'Levantamiento manual',
    'reports.pushPull': 'Empujar y jalar',
    'reports.manualHandling': 'Manipulacion manual',
    'reports.materialHandling': 'Manejo de materiales',
    'reports.liftingCarrying': 'Levantar y transportar',
    'reports.repeatability': 'Analisis de repetitividad',
    'reports.strainIndex': 'Indice de tension',
    'reports.ergonomic': 'Analisis ergonomico',
    'reports.peaFull': 'Evaluacion ergonomica preliminar',
    'files.search': 'Buscar archivo',
    'files.list': 'Lista',
    'files.table': 'Tabla',
    'files.loading': 'Cargando archivos desde Supabase...',
    'actions.board': 'Tablero',
    'actions.new': 'Nuevo plan de accion',
    'actions.count': 'Planes de accion: 0',
    'kanban.todo': 'Por hacer',
    'kanban.doing': 'En curso',
    'kanban.done': 'Hecho',
    'camera.uploadFile': 'Subir archivo',
    'camera.control': 'Control',
    'camera.start': 'Iniciar camara',
    'camera.stop': 'Detener',
    'camera.capture': 'Capturar frame',
    'camera.device': 'Camara',
    'camera.auto': 'Camara automatica',
    'camera.skeleton': 'Esqueleto visible',
    'camera.points': 'Puntos articulares',
    'camera.risk': 'Riesgo ergonomico',
    'camera.noData': 'Sin datos',
    'camera.method': 'Metodo de evaluacion',
    'camera.rebaInfo': '<strong>REBA</strong> - Rapid Entire Body Assessment. Evalua posturas dinamicas de cuerpo completo.',
    'body.neck': 'Cuello',
    'body.trunk': 'Tronco',
    'body.armR': 'Brazo D.',
    'body.armL': 'Brazo I.',
    'body.kneeR': 'Rodilla D.',
    'body.kneeL': 'Rodilla I.',
    'body.ankleR': 'Tobillo D.',
    'body.ankleL': 'Tobillo I.',
    'report.title': 'Reporte ergonomico',
    'report.captureFirst': 'Captura el frame primero desde la camara o analiza un archivo',
    'report.engineAuto': 'Motor: Auto',
    'report.engineBackend': 'Motor: YOLO11 backend',
    'report.engineLocal': 'Motor: Local',
    'report.skeleton': 'Esqueleto',
    'report.exportPdf': 'Exportar PDF',
    'report.empty': 'Aun no hay datos. Captura un frame desde la camara o analiza un video.',
    'table.reportName': 'Nombre del reporte',
    'table.riskRange': 'Rango de riesgo',
    'table.evaluator': 'Evaluador',
    'table.creationDate': 'Fecha de creacion',
    'table.actions': 'Acciones',
    'table.site': 'Sede industrial',
    'table.status': 'Estado',
    'table.worstScore': 'Peor score',
    'table.report': 'Reporte',
    'table.peaSelected': 'PEA seleccionado',
    'table.collectionDate': 'Fecha de recoleccion',
    'prefs.riskRanges': 'Rangos de riesgo',
    'prefs.method': 'Metodo',
    'prefs.lowMax': 'Bajo (≤)',
    'prefs.mediumMax': 'Medio (≤)',
    'prefs.highMax': 'Alto (≤)',
    'account.profile': 'Perfil',
    'account.name': 'Nombre',
    'account.email': 'Email',
    'account.role': 'Rol',
    'account.organization': 'Organizacion',
    'account.company': 'Empresa',
    'account.site': 'Sede',
    'account.plan': 'Plan',
    'account.subscription': 'Suscripcion',
    'account.status': 'Estado',
    'account.statusActive': 'Activo',
    'account.security': 'Seguridad',
    'account.password': 'Contrasena',
    'account.changePassword': 'Cambiar contrasena',
    'users.name': 'Nombre',
    'users.email': 'Email',
    'users.role': 'Rol',
    'users.status': 'Estado',
    'users.actions': 'Acciones',
    'users.empty': 'Cargando usuarios desde Supabase...',
    'patients.fullName': 'Nombre y apellidos',
    'patients.occupation': 'Ocupacion',
    'patients.age': 'Edad',
    'patients.riskLow': 'Riesgo inicial: Bajo',
    'patients.riskMedium': 'Riesgo inicial: Medio',
    'patients.riskHigh': 'Riesgo inicial: Alto',
    'patients.save': 'Guardar paciente',
  },
  en: {
    'auth.tagline': 'Ergonomics, AI and operational management',
    'auth.eyebrow': 'Secure access',
    'auth.heading': 'Sign in to evaluate workstations, reports and action plans.',
    'auth.subheading': 'Connected to Supabase Auth. Dashboard data is loaded from your real database.',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.passwordPlaceholder': 'minimum 4 characters',
    'auth.login': 'Enter dashboard',
    'auth.signup': 'Create account',
    'auth.note': 'Use the user created in Supabase Auth or sign up for testing.',
    'selector.step1': 'Step 1',
    'selector.step2': 'Step 2',
    'selector.companyTitle': 'Select your company',
    'selector.siteTitle': 'Select industrial site',
    'selector.searchCompany': 'Search company',
    'selector.searchSite': 'Search site',
    'common.back': 'Back',
    'topbar.selectOrg': 'Select company / site',
    'topbar.myAccount': 'My account',
    'topbar.changeOrg': 'Change company / site',
    'topbar.logout': 'Sign out',
    'status.ready': 'Ready',
    'status.processing': 'Processing',
    'status.error': 'Error',
    'nav.dashboard': 'Dashboard',
    'nav.upload': 'Upload',
    'nav.files': 'Files',
    'nav.reports': 'Reports',
    'nav.rotation': 'Multitasks and rotation',
    'nav.ewa': 'EWA',
    'nav.pea': 'PEA Aggregator',
    'nav.actions': 'Action plans',
    'nav.settings': 'Settings',
    'nav.account': 'My account',
    'nav.preferences': 'Preferences',
    'nav.manageUsers': 'Manage users',
    'nav.manageCompanies': 'Manage companies',
    'nav.customReports': 'Personalised reports',
    'nav.liveCamera': 'Live AI capture',
    'nav.patients': 'Patients',
    'nav.history': 'History',
    'panel.dashboard': 'Dashboard',
    'panel.upload': 'Upload',
    'panel.files': 'Files',
    'panel.reports': 'Reports',
    'panel.report': 'REBA / RULA report',
    'panel.rotation': 'Multitasks and rotation',
    'panel.ewa': 'Ergonomic Workplace Analysis',
    'panel.pea': 'PEA Aggregator',
    'panel.actions': 'Action plans',
    'panel.settings-account': 'My account',
    'panel.settings-preferences': 'Preferences',
    'panel.settings-users': 'Manage users',
    'panel.settings-companies': 'Manage companies',
    'panel.settings-custom-reports': 'Personalised reports',
    'panel.camera': 'Live camera',
    'panel.patients': 'Patients',
    'panel.history': 'Session history',
    'camera.pressStart': 'Press <strong>Start</strong> to activate the camera',
    'bc.home': 'Home',
    'common.create': 'Create',
    'common.newReport': 'New report',
    'common.filter': 'Filter',
    'common.search': 'Search',
    'upload.title': 'Send video',
    'rotation.title': 'Multitasking and rotation assessment tool',
    'pea.title': 'Preliminary Ergonomic Assessments',
    'account.overview': 'Account overview',
    'patients.new': 'New patient',
    'history.clear': 'Clear history',
    'dashboard.title': 'Dashboard with real data',
    'dashboard.summary': 'Summary computed from Supabase.',
    'dashboard.empty': 'No reports saved for this company yet.',
    'dashboard.sendVideo': 'Send video',
    'dashboard.workstations': 'Workstations',
    'dashboard.evaluated': 'Evaluated',
    'dashboard.reports': 'reports',
    'dashboard.noCompany': 'No company',
    'dashboard.highestRisk': 'Highest risk found:',
    'dashboard.highestRiskShort': 'Highest risk found',
    'dashboard.checklist': 'Checklist',
    'dashboard.realReports': 'Real reports',
    'dashboard.generatedReports': 'Generated reports',
    'dashboard.realActivity': 'Real activity',
    'dashboard.uploadedFiles': 'Uploaded files',
    'dashboard.highRisk': 'High risk',
    'dashboard.requiresReview': 'Requires review',
    'dashboard.actionPlans': 'Action plans',
    'dashboard.openClosed': 'Open and closed',
    'dashboard.latestReports': 'Latest reports',
    'dashboard.method': 'Method',
    'dashboard.score': 'Score',
    'dashboard.risk': 'Risk',
    'dashboard.date': 'Date',
    'dashboard.noReports': 'No reports yet. Upload a file or capture a frame to generate the first one.',
    'risk.negligible': 'Negligible',
    'risk.low': 'Acceptable risk',
    'risk.medium': 'Moderate risk',
    'risk.high': 'High risk',
    'risk.veryHigh': 'Very high risk',
    'risk.acceptableShort': 'acceptable',
    'risk.moderateShort': 'moderate',
    'risk.highShort': 'high',
    'risk.veryHighShort': 'very high',
    'common.refresh': 'Refresh',
    'common.apply': 'Apply',
    'common.ordering': 'Sort by',
    'common.noData': 'No data',
    'common.newDocument': 'New document',
    'upload.processingModels': 'Processing models',
    'upload.onePerson': 'One person',
    'upload.onePersonDesc': 'In videos with just one worker, the evaluated person is automatically identified.',
    'upload.multiplePeople': 'Multiple people',
    'upload.multiplePeopleDesc': 'Choose which worker will be evaluated when the video has more than one person.',
    'upload.drop': 'Add files or drag and drop',
    'upload.maxSize': 'Maximum size: 3GB',
    'upload.maxFiles': 'Maximum files: 10',
    'upload.analyze': 'Analyze file',
    'upload.change': 'Change file',
    'reports.biomechanical': 'Biomechanical analysis',
    'reports.angleByTime': 'Angle by time',
    'reports.wristHand': 'Wrist and hand report',
    'reports.load': 'Load analysis',
    'reports.manualLifting': 'Manual lifting',
    'reports.pushPull': 'Push and pull',
    'reports.manualHandling': 'Manual Handling',
    'reports.materialHandling': 'Material handling',
    'reports.liftingCarrying': 'Lifting and carrying',
    'reports.repeatability': 'Repeatability analysis',
    'reports.strainIndex': 'Strain index',
    'reports.ergonomic': 'Ergonomic analysis',
    'reports.peaFull': 'Preliminary Ergonomic Assessment',
    'files.search': 'Search a file',
    'files.list': 'List',
    'files.table': 'Table',
    'files.loading': 'Loading files from Supabase...',
    'actions.board': 'Board',
    'actions.new': 'New action plan',
    'actions.count': 'Action plans: 0',
    'kanban.todo': 'To Do',
    'kanban.doing': 'Doing',
    'kanban.done': 'Done',
    'camera.uploadFile': 'Upload file',
    'camera.control': 'Control',
    'camera.start': 'Start camera',
    'camera.stop': 'Stop',
    'camera.capture': 'Capture frame',
    'camera.device': 'Camera',
    'camera.auto': 'Auto camera',
    'camera.skeleton': 'Show skeleton',
    'camera.points': 'Joint points',
    'camera.risk': 'Ergonomic risk',
    'camera.noData': 'No data',
    'camera.method': 'Assessment method',
    'camera.rebaInfo': '<strong>REBA</strong> - Rapid Entire Body Assessment. Evaluates dynamic full-body postures.',
    'body.neck': 'Neck',
    'body.trunk': 'Trunk',
    'body.armR': 'Arm R',
    'body.armL': 'Arm L',
    'body.kneeR': 'Knee R',
    'body.kneeL': 'Knee L',
    'body.ankleR': 'Ankle R',
    'body.ankleL': 'Ankle L',
    'report.title': 'Ergonomic report',
    'report.captureFirst': 'Capture a frame from the camera or analyze a file first',
    'report.engineAuto': 'Engine: Auto',
    'report.engineBackend': 'Engine: YOLO11 backend',
    'report.engineLocal': 'Engine: Local',
    'report.skeleton': 'Skeleton',
    'report.exportPdf': 'Export PDF',
    'report.empty': 'No data yet. Capture a frame from the camera or analyze a video.',
    'table.reportName': 'Report name',
    'table.riskRange': 'Risk range',
    'table.evaluator': 'Evaluator',
    'table.creationDate': 'Creation date',
    'table.actions': 'Actions',
    'table.site': 'Industrial site',
    'table.status': 'Status',
    'table.worstScore': 'Worst score',
    'table.report': 'Report',
    'table.peaSelected': 'Selected PEA',
    'table.collectionDate': 'Collection date',
    'prefs.riskRanges': 'Risk ranges',
    'prefs.method': 'Method',
    'prefs.lowMax': 'Low (≤)',
    'prefs.mediumMax': 'Medium (≤)',
    'prefs.highMax': 'High (≤)',
    'account.profile': 'Profile',
    'account.name': 'Name',
    'account.email': 'Email',
    'account.role': 'Role',
    'account.organization': 'Organization',
    'account.company': 'Company',
    'account.site': 'Site',
    'account.plan': 'Plan',
    'account.subscription': 'Subscription',
    'account.status': 'Status',
    'account.statusActive': 'Active',
    'account.security': 'Security',
    'account.password': 'Password',
    'account.changePassword': 'Change password',
    'users.name': 'Name',
    'users.email': 'Email',
    'users.role': 'Role',
    'users.status': 'Status',
    'users.actions': 'Actions',
    'users.empty': 'Loading users from Supabase...',
    'patients.fullName': 'Full name',
    'patients.occupation': 'Occupation',
    'patients.age': 'Age',
    'patients.riskLow': 'Initial risk: Low',
    'patients.riskMedium': 'Initial risk: Medium',
    'patients.riskHigh': 'Initial risk: High',
    'patients.save': 'Save patient',
  },
};

function getLanguage() {
  return localStorage.getItem(PLATFORM_STORAGE.lang) === 'en' ? 'en' : 'es';
}

function t(key) {
  const lang = getLanguage();
  return (I18N[lang] && I18N[lang][key]) || (I18N.es && I18N.es[key]) || key;
}

function applyTranslations() {
  const lang = getLanguage();
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = t(key);
    if (value.includes('<')) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });
  const langCurrent = document.getElementById('lang-current');
  if (langCurrent) langCurrent.textContent = lang.toUpperCase();
  const authLangCurrent = document.getElementById('auth-lang-current');
  if (authLangCurrent) authLangCurrent.textContent = lang.toUpperCase();
}

function toggleLanguage() {
  const next = getLanguage() === 'es' ? 'en' : 'es';
  localStorage.setItem(PLATFORM_STORAGE.lang, next);
  applyTranslations();
  const activePanel = document.querySelector('.panel.active');
  if (activePanel) {
    const name = activePanel.id.replace('panel-', '');
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.textContent = t('panel.' + name) || name;
    if (name === 'dashboard' && typeof renderDashboardReal === 'function') {
      renderDashboardReal();
    }
  }
}

function toggleSettingsNav(event) {
  if (event) event.stopPropagation();
  const nav = document.getElementById('settings-nav-section');
  if (!nav) return;
  const expanded = nav.classList.toggle('expanded');
  const btn = nav.querySelector('.settings-toggle');
  btn?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

function expandSettingsNav() {
  const nav = document.getElementById('settings-nav-section');
  if (!nav) return;
  nav.classList.add('expanded');
  const btn = nav.querySelector('.settings-toggle');
  btn?.setAttribute('aria-expanded', 'true');
}

function toggleUserMenu(event) {
  if (event) event.stopPropagation();
  const dd = document.getElementById('user-dropdown');
  const btn = document.getElementById('user-chip-btn');
  if (!dd) return;
  const isOpen = !dd.hasAttribute('hidden');
  if (isOpen) {
    dd.setAttribute('hidden', '');
    btn?.setAttribute('aria-expanded', 'false');
  } else {
    dd.removeAttribute('hidden');
    btn?.setAttribute('aria-expanded', 'true');
  }
}

function closeUserMenu() {
  const dd = document.getElementById('user-dropdown');
  const btn = document.getElementById('user-chip-btn');
  dd?.setAttribute('hidden', '');
  btn?.setAttribute('aria-expanded', 'false');
}

document.addEventListener('click', (e) => {
  const menu = document.querySelector('.user-menu');
  if (menu && !menu.contains(e.target)) closeUserMenu();
});

// --- MediaPipe POSE LANDMARKS (indices) ---
const LM = {
  NOSE: 0, L_EYE: 2, R_EYE: 5,
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW: 13,    R_ELBOW: 14,
  L_WRIST: 15,    R_WRIST: 16,
  L_HIP: 23,      R_HIP: 24,
  L_KNEE: 25,     R_KNEE: 26,
  L_ANKLE: 27,    R_ANKLE: 28,
  L_HEEL: 29,     R_HEEL: 30,
  L_FOOT: 31,     R_FOOT: 32,
};

// --- DOM REFS ---
const webcam       = document.getElementById('webcam');
const poseCanvas   = document.getElementById('pose-canvas');
const ctx          = poseCanvas.getContext('2d');
const videoOverlay = document.getElementById('video-overlay');
const fpsEl        = document.getElementById('fps-badge');
const statusDot    = document.querySelector('.status-dot');
const statusText   = document.getElementById('status-text');
const cameraSelect = document.getElementById('camera-select');
const uploadVideo  = document.getElementById('upload-video');
const uploadImage  = document.getElementById('upload-image');
const APP_CONFIG = window.BIOMECHECK_CONFIG || {};
const API_BASE_URL = (
  window.localStorage.getItem('biomecheck_api_url') ||
  APP_CONFIG.API_BASE_URL ||
  ''
).replace(/\/$/, '');
let supabaseClient = null;
const YOLO_CONNECTIONS = [
  [0, 5], [0, 6], [5, 6],
  [5, 7], [7, 9],
  [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15],
  [12, 14], [14, 16],
];

async function refreshCameraDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return;

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((d) => d.kind === 'videoinput');
    const previous = state.selectedDeviceId;

    cameraSelect.innerHTML = '<option value="">Camara automatica</option>';
    cameras.forEach((cam, idx) => {
      const opt = document.createElement('option');
      opt.value = cam.deviceId;
      opt.textContent = cam.label || ('Camara ' + (idx + 1));
      cameraSelect.appendChild(opt);
    });

    if (previous && cameras.some((c) => c.deviceId === previous)) {
      cameraSelect.value = previous;
    } else {
      cameraSelect.value = '';
      state.selectedDeviceId = '';
    }
  } catch (_) {
    // Ignore device listing errors and keep automatic mode.
  }
}

function setCameraDevice(deviceId) {
  state.selectedDeviceId = deviceId || '';
}

async function refreshOrSwitchCamera() {
  if (!state.cameraActive) {
    // Camera is off, just refresh device list
    await refreshCameraDevices();
    return;
  }

  // Camera is on, switch to selected device
  try {
    setStatus('active', 'Cambiando camara...');
    
    // Stop current stream
    if (state.videoStream) {
      state.videoStream.getTracks().forEach(t => t.stop());
      state.videoStream = null;
    }

    // Get new stream with selected device
    const stream = await getCameraStreamWithFallback();
    webcam.srcObject = stream;
    state.videoStream = stream;
    
    // Wait for video to be ready
    await new Promise((resolve) => {
      webcam.onloadedmetadata = resolve;
    });

    // Update canvas size
    poseCanvas.width  = webcam.videoWidth  || 640;
    poseCanvas.height = webcam.videoHeight || 480;

    setStatus('active', 'Analizando...');
  } catch (err) {
    setStatus('error', 'Error al cambiar camara');
    showToast('No se pudo cambiar de camara: ' + (err?.message || 'error desconocido'), 'error');
  }
}

async function analyzeFrameWithBackend(imageDataUrl) {
  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL not configured');
  }
  const response = await fetch(API_BASE_URL + '/api/pose/analyze-frame', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_data_url: imageDataUrl, method: state.method }),
  });

  if (!response.ok) {
    throw new Error('Backend unavailable (' + response.status + ')');
  }

  return response.json();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

async function ensureDataUrl(src) {
  if (!src) return '';
  if (src.startsWith('data:')) return src;
  if (src.startsWith('blob:')) {
    const blob = await fetch(src).then((r) => r.blob());
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('No se pudo convertir blob a data URL'));
      reader.readAsDataURL(blob);
    });
  }
  return src;
}

async function renderBackendOverlay(imageDataUrl, keypoints) {
  const raw = await ensureDataUrl(imageDataUrl);
  if (!raw || !Array.isArray(keypoints) || keypoints.length === 0) {
    return raw;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const c = canvas.getContext('2d');
      c.drawImage(img, 0, 0, canvas.width, canvas.height);

      c.lineWidth = Math.max(2, Math.round(canvas.width / 480));
      YOLO_CONNECTIONS.forEach(([a, b]) => {
        const pa = keypoints[a];
        const pb = keypoints[b];
        if (!pa || !pb) return;
        const grad = c.createLinearGradient(pa[0], pa[1], pb[0], pb[1]);
        grad.addColorStop(0, '#00e5b4');
        grad.addColorStop(1, '#0099ff');
        c.strokeStyle = grad;
        c.beginPath();
        c.moveTo(pa[0], pa[1]);
        c.lineTo(pb[0], pb[1]);
        c.stroke();
      });

      c.fillStyle = '#00e5b4';
      keypoints.forEach((p) => {
        if (!p || p.length < 2) return;
        c.beginPath();
        c.arc(p[0], p[1], Math.max(3, Math.round(canvas.width / 260)), 0, Math.PI * 2);
        c.fill();
      });

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve(raw);
    img.src = raw;
  });
}

function captureImageFromVideo(video) {
  const canvas = document.createElement('canvas');
  const width = video.videoWidth || 960;
  const height = video.videoHeight || 540;
  canvas.width = width;
  canvas.height = height;
  const c2d = canvas.getContext('2d');
  c2d.drawImage(video, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.9);
}

function waitForVideoMetadata(video) {
  if (video.readyState >= 1) return Promise.resolve();
  return new Promise((resolve) => {
    const onLoaded = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      resolve();
    };
    video.addEventListener('loadedmetadata', onLoaded);
  });
}

function seekVideo(video, timeSec) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      video.removeEventListener('seeked', onSeeked);
      reject(new Error('Timeout al mover video'));
    }, 4000);

    const onSeeked = () => {
      clearTimeout(timeoutId);
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };

    video.addEventListener('seeked', onSeeked, { once: true });
    video.currentTime = Math.max(0, timeSec);
  });
}

async function captureVideoFrameSamples(video, sampleCount) {
  await waitForVideoMetadata(video);

  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  const safeDuration = Math.max(duration, 1);
  const originalTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
  const wasPaused = video.paused;
  if (!wasPaused) video.pause();

  const frames = [];
  for (let i = 0; i < sampleCount; i++) {
    const ratio = (i + 0.5) / sampleCount;
    const t = Math.min(safeDuration - 0.05, ratio * safeDuration);
    await seekVideo(video, t);
    frames.push({ time: t, imageDataUrl: captureImageFromVideo(video) });
  }

  await seekVideo(video, Math.min(originalTime, safeDuration - 0.05));
  if (!wasPaused) {
    video.play().catch(() => {});
  }

  return frames;
}

async function applyBackendReport(result, imageDataUrl, originLabel) {
  const scoreData = result.score;
  const anglesData = {
    neck: Number(result.angles?.neck ?? 0),
    trunk: Number(result.angles?.trunk ?? 0),
    armR: Number(result.angles?.armR ?? 180),
    armL: Number(result.angles?.armL ?? 180),
    kneeR: Number(result.angles?.kneeR ?? 180),
    kneeL: Number(result.angles?.kneeL ?? 180),
    ankleR: Number(result.angles?.ankleR ?? 90),
    ankleL: Number(result.angles?.ankleL ?? 90),
    elbowR: Number(result.angles?.elbowR ?? 90),
    elbowL: Number(result.angles?.elbowL ?? 90),
  };

  const rawDataUrl = await ensureDataUrl(imageDataUrl);
  const overlayDataUrl = await renderBackendOverlay(rawDataUrl, result.keypoints || []);

  state.lastAngles = anglesData;
  state.lastScore = scoreData;
  updateMetricsUI(anglesData, scoreData);

  state.snapshotData = {
    imageDataUrl: state.reportConfig.skeleton ? overlayDataUrl : rawDataUrl,
    rawImageDataUrl: rawDataUrl,
    overlayImageDataUrl: overlayDataUrl,
    angles: { ...anglesData },
    score: { ...scoreData },
    method: state.method,
    sourceModel: 'YOLO11 backend',
    timestamp: new Date().toISOString(),
  };

  buildReport(state.snapshotData);
  document.getElementById('btn-export').disabled = false;
  document.getElementById('report-date').textContent =
    originLabel + ': ' + new Date().toLocaleString('es-PE') + ' (IA YOLO11 Pose local)';
  setStatus('active', 'Analisis IA completado');
  switchPanel('report');
}

// ==========================================
//  NAVIGATION
// ==========================================
function legacySwitchPanel(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('panel-' + name).classList.add('active');
  document.querySelector(`[data-panel="${name}"]`).classList.add('active');

  const titles = {
    camera: 'Camara en vivo',
    upload: 'Subir Video / Imagen',
    report: 'Reporte REBA / RULA',
    patients: 'Pacientes',
    history: 'Historial de sesiones'
  };
  document.getElementById('topbar-title').textContent = titles[name] || name;
}

function updateReportConfigUI() {
  const modelSel = document.getElementById('report-model');
  const methodSel = document.getElementById('report-method');
  const skeletonCheck = document.getElementById('report-skeleton');
  if (!modelSel || !methodSel || !skeletonCheck) return;

  modelSel.value = state.reportConfig.model;
  methodSel.value = state.reportConfig.method;
  skeletonCheck.checked = state.reportConfig.skeleton;
}

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
}

// ==========================================
//  MEDIAPIPE SETUP
// ==========================================
let poseDetector = null;

async function initMediaPipe() {
  try {
    poseDetector = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseDetector.setOptions({
      modelComplexity: 1,          // 0=fast, 1=balanced, 2=accurate
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    poseDetector.onResults(onPoseResults);
    return true;
  } catch (err) {
    showToast('MediaPipe no disponible para analisis en vivo.', 'error');
    return false;
  }
}

// ==========================================
//  CAMERA
// ==========================================
async function startCamera() {
  if (state.cameraStarting) return;
  state.cameraStarting = true;

  try {
    if (state.videoStream || state.cameraActive) {
      stopCamera();
    }

    state.mode = 'camera';
    setStatus('active', 'Iniciando...');

    await refreshCameraDevices();
    const stream = await getCameraStreamWithFallback();

    webcam.srcObject = stream;
    state.videoStream = stream;
    await webcam.play();
    await refreshCameraDevices();

    poseCanvas.width  = webcam.videoWidth  || 640;
    poseCanvas.height = webcam.videoHeight || 480;

    videoOverlay.classList.add('hidden');
    document.getElementById('btn-start').disabled        = true;
    document.getElementById('btn-stop').disabled         = false;
    document.getElementById('btn-snapshot').disabled     = false;
    document.getElementById('btn-refresh-camera').disabled = false;

    state.cameraActive = true;

    // Init MediaPipe
    const ok = await initMediaPipe();

    if (ok) {
      setStatus('active', 'Analizando...');
      processLoop();
    } else {
      setStatus('error', 'Pose no disponible');
    }

  } catch (err) {
    setStatus('error', 'Sin camara');
    if (err?.name === 'AbortError') {
      showToast('AbortError: la camara esta ocupada o cambiando. Cierra otras apps y reintenta.', 'error');
      return;
    }

    showToast('No se pudo acceder a la camara (' + (err?.name || 'error') + ').', 'error');
    stopCamera();
  } finally {
    state.cameraStarting = false;
  }
}

function delayMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCameraStreamWithFallback() {
  const selected = state.selectedDeviceId;

  if (selected) {
    const selectedOnly = [
      { video: { deviceId: { exact: selected }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { deviceId: { exact: selected } }, audio: false },
    ];

    for (const constraints of selectedOnly) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        if (err?.name === 'AbortError') {
          await delayMs(250);
          try {
            return await navigator.mediaDevices.getUserMedia(constraints);
          } catch (_) {}
        }
      }
    }
  }

  const attempts = [
    {
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    },
    {
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    },
    {
      video: true,
      audio: false,
    },
  ];

  let lastError = null;
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      if (err?.name === 'AbortError') {
        await delayMs(250);
        try {
          return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (errRetry) {
          lastError = errRetry;
          continue;
        }
      }
      lastError = err;
    }
  }

  throw lastError || new Error('No se pudo abrir camara');
}

function startDemoMode() {
  stopCamera();
  state.mode = 'demo';
  state.cameraActive = true;

  poseCanvas.width = 960;
  poseCanvas.height = 540;
  videoOverlay.classList.add('hidden');
  webcam.srcObject = null;

  document.getElementById('btn-start').disabled = false;
  document.getElementById('btn-stop').disabled = false;
  document.getElementById('btn-snapshot').disabled = false;

  setStatus('active', 'Demo sin camara');
  showToast('Modo demo activo para pruebas locales.', 'success');
  demoLoop();
}

function stopCamera() {
  state.cameraActive = false;
  state.mode = 'idle';
  if (state.videoStream) {
    state.videoStream.getTracks().forEach(t => t.stop());
    state.videoStream = null;
  }
  if (state.animFrame) cancelAnimationFrame(state.animFrame);
  ctx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
  videoOverlay.classList.remove('hidden');
  document.getElementById('btn-start').disabled        = false;
  document.getElementById('btn-stop').disabled         = true;
  document.getElementById('btn-snapshot').disabled     = true;
  document.getElementById('btn-refresh-camera').disabled = true;
  setStatus('idle', 'Listo');
  resetMetrics();
}

async function processLoop() {
  if (!state.cameraActive) return;

  if (webcam.readyState >= 2 && poseDetector) {
    try {
      await poseDetector.send({ image: webcam });
    } catch(e) {}
  }

  // FPS counter
  state.frameCount++;
  const now = performance.now();
  if (now - state.lastFpsTime > 1000) {
    fpsEl.textContent = state.frameCount + ' fps';
    state.frameCount = 0;
    state.lastFpsTime = now;
  }

  state.animFrame = requestAnimationFrame(processLoop);
}

// --- MediaPipe result callback ---
function onPoseResults(results) {
  poseCanvas.width  = webcam.videoWidth;
  poseCanvas.height = webcam.videoHeight;

  ctx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);

  if (!results.poseLandmarks) return;

  const lm = results.poseLandmarks;
  const w = poseCanvas.width;
  const h = poseCanvas.height;

  // Draw skeleton
  if (state.showSkeleton) {
    drawSkeleton(ctx, lm, w, h);
  }

  // Draw landmark points
  if (state.showPoints) {
    drawPoints(ctx, lm, w, h);
  }

  // Calculate angles and scores
  const angles = calculateAngles(lm, w, h);
  state.lastAngles = angles;

  const score = calculateREBAScore(angles);
  state.lastScore = score;

  updateMetricsUI(angles, score);
}

// ==========================================
//  DRAWING
// ==========================================
const CONNECTIONS = [
  [LM.NOSE, LM.L_SHOULDER], [LM.NOSE, LM.R_SHOULDER],
  [LM.L_SHOULDER, LM.R_SHOULDER],
  [LM.L_SHOULDER, LM.L_ELBOW], [LM.L_ELBOW, LM.L_WRIST],
  [LM.R_SHOULDER, LM.R_ELBOW], [LM.R_ELBOW, LM.R_WRIST],
  [LM.L_SHOULDER, LM.L_HIP],   [LM.R_SHOULDER, LM.R_HIP],
  [LM.L_HIP, LM.R_HIP],
  [LM.L_HIP, LM.L_KNEE],       [LM.L_KNEE, LM.L_ANKLE],
  [LM.R_HIP, LM.R_KNEE],       [LM.R_KNEE, LM.R_ANKLE],
  [LM.L_ANKLE, LM.L_HEEL],     [LM.L_HEEL, LM.L_FOOT],
  [LM.R_ANKLE, LM.R_HEEL],     [LM.R_HEEL, LM.R_FOOT],
];

function drawSkeleton(ctx, lm, w, h) {
  ctx.lineWidth = 2.5;
  CONNECTIONS.forEach(([a, b]) => {
    const pa = lm[a], pb = lm[b];
    if (!pa || !pb || pa.visibility < 0.3 || pb.visibility < 0.3) return;
    ctx.beginPath();
    ctx.moveTo(pa.x * w, pa.y * h);
    ctx.lineTo(pb.x * w, pb.y * h);
    const grad = ctx.createLinearGradient(pa.x*w, pa.y*h, pb.x*w, pb.y*h);
    grad.addColorStop(0, '#00e5b4');
    grad.addColorStop(1, '#0099ff');
    ctx.strokeStyle = grad;
    ctx.stroke();
  });
}

function drawPoints(ctx, lm, w, h) {
  const KEY_JOINTS = Object.values(LM);
  KEY_JOINTS.forEach(idx => {
    const p = lm[idx];
    if (!p || p.visibility < 0.3) return;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#00e5b4';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

// ==========================================
//  ANGLE CALCULATION
// ==========================================
function angleBetween(a, b, c) {
  // Angle at point B, formed by A-B-C
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x*cb.x + ab.y*cb.y;
  const magAB = Math.sqrt(ab.x**2 + ab.y**2);
  const magCB = Math.sqrt(cb.x**2 + cb.y**2);
  if (magAB === 0 || magCB === 0) return 0;
  const cos = Math.min(1, Math.max(-1, dot / (magAB * magCB)));
  return Math.round(Math.acos(cos) * 180 / Math.PI);
}

function verticalAngle(a, b) {
  // Angle of vector a-b from vertical
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.round(Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI);
}

function calculateAngles(lm, w, h) {
  const safePoint = (idx, fallback) => {
    const p = lm[idx];
    if (!p || p.visibility < 0.2) return fallback;
    return { x: p.x, y: p.y, vis: p.visibility };
  };

  const lHip      = safePoint(LM.L_HIP, { x: 0.45, y: 0.55, vis: 0 });
  const rHip      = safePoint(LM.R_HIP, { x: 0.55, y: 0.55, vis: 0 });
  const lKnee     = safePoint(LM.L_KNEE, { x: 0.45, y: 0.7, vis: 0 });
  const rKnee     = safePoint(LM.R_KNEE, { x: 0.55, y: 0.7, vis: 0 });
  const lAnkle    = safePoint(LM.L_ANKLE, { x: 0.45, y: 0.86, vis: 0 });
  const rAnkle    = safePoint(LM.R_ANKLE, { x: 0.55, y: 0.86, vis: 0 });

  const nose      = safePoint(LM.NOSE, { x: 0.5, y: 0.2, vis: 0 });
  const lShoulder = safePoint(LM.L_SHOULDER, { x: 0.44, y: 0.34, vis: 0 });
  const rShoulder = safePoint(LM.R_SHOULDER, { x: 0.56, y: 0.34, vis: 0 });
  const lElbow    = safePoint(LM.L_ELBOW, { x: 0.42, y: 0.48, vis: 0 });
  const rElbow    = safePoint(LM.R_ELBOW, { x: 0.58, y: 0.48, vis: 0 });
  const lWrist    = safePoint(LM.L_WRIST, { x: 0.41, y: 0.62, vis: 0 });
  const rWrist    = safePoint(LM.R_WRIST, { x: 0.59, y: 0.62, vis: 0 });
  const lFoot     = safePoint(LM.L_FOOT, { x: lAnkle.x + 0.03, y: lAnkle.y + 0.02, vis: 0 });
  const rFoot     = safePoint(LM.R_FOOT, { x: rAnkle.x + 0.03, y: rAnkle.y + 0.02, vis: 0 });

  // Mid-points
  const midShoulder = { x: (lShoulder.x + rShoulder.x)/2, y: (lShoulder.y + rShoulder.y)/2 };
  const midHip      = { x: (lHip.x + rHip.x)/2,           y: (lHip.y + rHip.y)/2 };

  return {
    neck:   verticalAngle(midShoulder, nose),
    trunk:  verticalAngle(midHip, midShoulder),
    armR:   angleBetween(rShoulder, rElbow, rWrist),
    armL:   angleBetween(lShoulder, lElbow, lWrist),
    kneeR:  angleBetween(rHip, rKnee, rAnkle),
    kneeL:  angleBetween(lHip, lKnee, lAnkle),
    ankleR: angleBetween(rKnee, rAnkle, rFoot),
    ankleL: angleBetween(lKnee, lAnkle, lFoot),
    elbowR: angleBetween(rShoulder, rElbow, rWrist),
    elbowL: angleBetween(lShoulder, lElbow, lWrist),
  };
}

// ==========================================
//  REBA SCORING ENGINE
//  Basado en: Hignett & McAtamney (2000)
//  Validado por Lin et al. 2022 (Scientific Reports)
// ==========================================
function calculateREBAScore(angles) {
  // GROUP A: Neck, Trunk, Legs
  let neckScore  = neckREBA(angles.neck);
  let trunkScore = trunkREBA(angles.trunk);
  let legScore   = 1;

  const kneeFlexR = 180 - angles.kneeR;
  const kneeFlexL = 180 - angles.kneeL;
  const ankleDeviationR = Math.abs(90 - angles.ankleR);
  const ankleDeviationL = Math.abs(90 - angles.ankleL);
  if (kneeFlexR > 30 || kneeFlexL > 30) legScore = 2;
  if (kneeFlexR > 60 || kneeFlexL > 60 || ankleDeviationR > 25 || ankleDeviationL > 25) legScore = 3;

  // TABLE A score
  const tableA = getTableA(trunkScore, neckScore, legScore);

  // GROUP B: Upper arm, Lower arm, Wrist
  const upperArmR = upperArmREBA(180 - angles.armR);
  const lowerArmR = lowerArmREBA(angles.elbowR);
  const wristScore = 1; // Simplified

  // TABLE B score
  const tableB = getTableB(upperArmR, lowerArmR, wristScore);

  // TABLE C "” combine A and B
  const scoreC = getTableC(tableA, tableB);

  // Final REBA score (activity score simplified)
  const finalScore = scoreC + 1; // +1 for static posture held

  const level = getRiskLevel(finalScore, 'REBA');

  return {
    score: finalScore,
    level: level.label,
    color: level.color,
    group: { neck: neckScore, trunk: trunkScore, leg: legScore },
    tableA, tableB, scoreC
  };
}

function neckREBA(deg) {
  if (deg <= 10) return 1;
  if (deg <= 20) return 2;
  return 3;
}
function trunkREBA(deg) {
  if (deg <= 5)  return 1;
  if (deg <= 20) return 2;
  if (deg <= 60) return 3;
  return 4;
}
function upperArmREBA(deg) {
  if (deg <= 20)  return 1;
  if (deg <= 45)  return 2;
  if (deg <= 90)  return 3;
  return 4;
}
function lowerArmREBA(deg) {
  return (deg >= 60 && deg <= 100) ? 1 : 2;
}

function getTableA(trunk, neck, leg) {
  const table = [
    [[1,2,3,4],[1,2,3,4],[3,3,5,6]],
    [[2,3,4,5],[3,4,5,6],[4,5,6,7]],
    [[2,4,5,6],[4,5,6,7],[5,6,7,8]],
    [[3,5,6,7],[5,6,7,8],[6,7,8,9]],
    [[4,6,7,8],[6,7,8,9],[7,8,9,9]],
  ];
  const t = Math.min(trunk-1, 4);
  const n = Math.min(neck-1, 2);
  const l = Math.min(leg-1, 3);
  return table[t]?.[n]?.[l] ?? 5;
}
function getTableB(upper, lower, wrist) {
  const table = [
    [[1,2,2],[1,2,3]],
    [[1,2,3],[2,3,4]],
    [[3,4,5],[4,5,5]],
    [[4,5,5],[5,6,7]],
    [[6,7,8],[7,8,8]],
    [[7,8,8],[8,9,9]],
  ];
  const u = Math.min(upper-1, 5);
  const l = Math.min(lower-1, 1);
  const w = Math.min(wrist-1, 2);
  return table[u]?.[l]?.[w] ?? 5;
}
function getTableC(a, b) {
  const table = [
    [1,1,1,2,3,3,4,5,6,7,7,7],
    [1,2,2,3,4,4,5,6,6,7,7,8],
    [2,3,3,3,4,5,6,7,7,8,8,8],
    [3,4,4,4,5,6,7,8,8,9,9,9],
    [4,4,4,5,6,7,8,8,9,9,9,9],
    [6,6,6,7,8,8,9,9,10,10,10,10],
    [7,7,7,8,9,9,9,10,10,11,11,11],
    [8,8,8,9,10,10,10,10,10,11,11,11],
    [9,9,9,10,10,10,11,11,11,12,12,12],
    [10,10,10,11,11,11,11,12,12,12,12,12],
    [11,11,11,11,12,12,12,12,12,12,12,12],
    [12,12,12,12,12,12,12,12,12,12,12,12],
  ];
  const ai = Math.min(a-1, 11);
  const bi = Math.min(b-1, 11);
  return table[ai]?.[bi] ?? 8;
}

function getRiskLevel(score, method) {
  if (method === 'REBA') {
    if (score === 1)      return { label: 'Inapreciable', color: '#00e5b4', code: 'negligible' };
    if (score <= 3)       return { label: 'Bajo "” Puede necesitar cambios', color: '#00e5b4', code: 'low' };
    if (score <= 7)       return { label: 'Medio "” Investigar y cambiar pronto', color: '#ffb347', code: 'medium' };
    if (score <= 10)      return { label: 'Alto "” Cambios necesarios urgentes', color: '#ff4d6d', code: 'high' };
    return                       { label: 'Muy alto "” Implementar cambios YA', color: '#ff4d6d', code: 'very-high' };
  }
  // RULA
  if (score <= 2) return { label: 'Aceptable', color: '#00e5b4', code: 'low' };
  if (score <= 4) return { label: 'Investigar', color: '#ffb347', code: 'medium' };
  if (score <= 6) return { label: 'Cambios pronto', color: '#ff4d6d', code: 'high' };
  return               { label: 'Cambios urgentes', color: '#ff4d6d', code: 'very-high' };
}

// ==========================================
//  UI UPDATES
// ==========================================
function updateMetricsUI(angles, score) {
  // Score display
  const scoreEl = document.getElementById('risk-score');
  const levelEl = document.getElementById('risk-level');
  scoreEl.textContent = score.score;
  scoreEl.style.color = score.color;
  levelEl.textContent = score.level;
  levelEl.style.color = score.color;

  // Bar fills (angle - percentage of max range)
  const setBar = (id, valId, deg, maxDeg) => {
    const degNum = Number.isFinite(deg) ? deg : 0;
    const pct = Math.min(100, Math.round((degNum / maxDeg) * 100));
    document.getElementById(id).style.width = pct + '%';
    document.getElementById(id).style.background =
      pct > 70 ? 'linear-gradient(90deg,#ff4d6d,#ff8c69)' :
      pct > 40 ? 'linear-gradient(90deg,#ffb347,#ffd47a)' :
                 'linear-gradient(90deg,#0099ff,#00e5b4)';
    document.getElementById(valId).textContent = Math.round(degNum) + '°';
  };

  setBar('bar-neck',   'val-neck',   angles.neck,   60);
  setBar('bar-trunk',  'val-trunk',  angles.trunk,  90);
  setBar('bar-arm-r',  'val-arm-r',  180 - angles.armR,  160);
  setBar('bar-arm-l',  'val-arm-l',  180 - angles.armL,  160);
  setBar('bar-knee-r', 'val-knee-r', 180 - angles.kneeR, 90);
  setBar('bar-knee-l', 'val-knee-l', 180 - angles.kneeL, 90);
  setBar('bar-ankle-r', 'val-ankle-r', Math.abs(90 - angles.ankleR), 60);
  setBar('bar-ankle-l', 'val-ankle-l', Math.abs(90 - angles.ankleL), 60);
}

function resetMetrics() {
  document.getElementById('risk-score').textContent = '--';
  document.getElementById('risk-level').textContent = 'Sin datos';
  ['bar-neck','bar-trunk','bar-arm-r','bar-arm-l','bar-knee-r','bar-knee-l','bar-ankle-r','bar-ankle-l'].forEach(id => {
    document.getElementById(id).style.width = '0%';
  });
  ['val-neck','val-trunk','val-arm-r','val-arm-l','val-knee-r','val-knee-l','val-ankle-r','val-ankle-l'].forEach(id => {
    document.getElementById(id).textContent = '--°';
  });
}

function setStatus(type, text) {
  statusDot.className = 'status-dot ' + type;
  statusText.textContent = text;
}

// ==========================================
//  CONTROLS
// ==========================================
function toggleSkeleton() {
  state.showSkeleton = document.getElementById('toggle-skeleton').checked;
}
function togglePoints() {
  state.showPoints = document.getElementById('toggle-points').checked;
}

function setMethod(m, btn) {
  state.method = m;
  document.querySelectorAll('.method-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');

  const info = {
    REBA: '<strong>REBA</strong> "” Rapid Entire Body Assessment. Evalua posturas dinamicas de cuerpo completo. Recomendado para tareas de manufactura y trabajo de campo.',
    RULA: '<strong>RULA</strong> "” Rapid Upper Limb Assessment. Enfocado en extremidades superiores. Ideal para trabajo de oficina y tareas repetitivas con brazos.',
    OWAS: '<strong>OWAS</strong> "” Ovako Working posture Analysis System. Clasifica posturas de tronco, brazos y piernas en 4 categorias de accion. Validado en manufactura.'
  };
  document.getElementById('method-info').innerHTML = info[m];
  state.reportConfig.method = m;
  updateReportConfigUI();
}

function calculateRULAScore(angles) {
  const upperArm = Math.max(180 - angles.armR, 180 - angles.armL);
  const lowerArm = Math.max(Math.abs(100 - angles.elbowR), Math.abs(100 - angles.elbowL));
  const neck = angles.neck;
  const trunk = angles.trunk;
  const score = Math.max(1, Math.min(7,
    1 +
    (upperArm > 45 ? 2 : upperArm > 20 ? 1 : 0) +
    (lowerArm > 25 ? 1 : 0) +
    (neck > 20 ? 1 : 0) +
    (trunk > 20 ? 1 : 0)
  ));
  const level = getRiskLevel(score, 'RULA');
  return { score, level: level.label, color: level.color, tableA: '-', tableB: '-', scoreC: '-' };
}

function calculateOWASScore(angles) {
  const trunk = angles.trunk;
  const arms = Math.max(180 - angles.armR, 180 - angles.armL);
  const legs = Math.max(180 - angles.kneeR, 180 - angles.kneeL);
  let score = 1;
  if (trunk > 20 || arms > 45 || legs > 30) score = 2;
  if (trunk > 40 || arms > 70 || legs > 60) score = 3;
  if (trunk > 60 || arms > 90 || legs > 80) score = 4;

  const levelMap = {
    1: { label: 'OWAS 1 "” Sin accion inmediata', color: '#00e5b4' },
    2: { label: 'OWAS 2 "” Ajustes recomendados', color: '#ffb347' },
    3: { label: 'OWAS 3 "” Correccion pronto', color: '#ff8c69' },
    4: { label: 'OWAS 4 "” Correccion inmediata', color: '#ff4d6d' },
  };
  const level = levelMap[score];
  return { score, level: level.label, color: level.color, tableA: '-', tableB: '-', scoreC: '-' };
}

function scoreByMethod(angles, method) {
  if (method === 'RULA') return calculateRULAScore(angles);
  if (method === 'OWAS') return calculateOWASScore(angles);
  return calculateREBAScore(angles);
}

async function applyPreExportSettings() {
  if (!state.snapshotData) {
    showToast('Primero genera un reporte para aplicar configuracion.', 'info');
    return;
  }

  const modelSel = document.getElementById('report-model');
  const methodSel = document.getElementById('report-method');
  const skeletonCheck = document.getElementById('report-skeleton');

  state.reportConfig.model = modelSel?.value || 'auto';
  state.reportConfig.method = methodSel?.value || 'REBA';
  state.reportConfig.skeleton = Boolean(skeletonCheck?.checked);
  state.method = state.reportConfig.method;

  const sourceImage = state.snapshotData.rawImageDataUrl || state.snapshotData.imageDataUrl;
  const sourceDataUrl = await ensureDataUrl(sourceImage);

  if (state.reportConfig.model !== 'local') {
    try {
      const backend = await analyzeFrameWithBackend(sourceDataUrl);
      const backendAngles = {
        ...state.snapshotData.angles,
        ...backend.angles,
      };
      const backendOverlay = await renderBackendOverlay(sourceDataUrl, backend.keypoints || []);
      state.snapshotData.angles = backendAngles;
      state.snapshotData.score = scoreByMethod(backendAngles, state.reportConfig.method);
      state.snapshotData.method = state.reportConfig.method;
      state.snapshotData.sourceModel = 'YOLO11 backend';
      state.snapshotData.rawImageDataUrl = sourceDataUrl;
      state.snapshotData.overlayImageDataUrl = backendOverlay;
      showToast('Reporte actualizado con backend IA.', 'success');
    } catch (err) {
      if (state.reportConfig.model === 'backend') {
        showToast('No se pudo usar backend IA para este reporte.', 'error');
        return;
      }
      state.snapshotData.score = scoreByMethod(state.snapshotData.angles, state.reportConfig.method);
      state.snapshotData.method = state.reportConfig.method;
      state.snapshotData.sourceModel = 'Local';
      showToast('Backend no disponible. Se aplico modo local.', 'info');
    }
  } else {
    state.snapshotData.score = scoreByMethod(state.snapshotData.angles, state.reportConfig.method);
    state.snapshotData.method = state.reportConfig.method;
    state.snapshotData.sourceModel = 'Local';
  }

  if (state.snapshotData.overlayImageDataUrl && state.snapshotData.rawImageDataUrl) {
    state.snapshotData.imageDataUrl = state.reportConfig.skeleton
      ? state.snapshotData.overlayImageDataUrl
      : state.snapshotData.rawImageDataUrl;
  }

  if (sourceDataUrl && sourceDataUrl.startsWith('data:')) {
    state.snapshotData.rawImageDataUrl = sourceDataUrl;
  }

  buildReport(state.snapshotData);
}

// ==========================================
//  SNAPSHOT + REPORT
// ==========================================
function takeSnapshot() {
  if (!state.lastScore) {
    showToast('Espera a que la IA detecte la pose', 'info');
    return;
  }

  // Capture frame
  const snapCanvas = document.createElement('canvas');
  snapCanvas.width  = poseCanvas.width;
  snapCanvas.height = poseCanvas.height;
  const snapCtx = snapCanvas.getContext('2d');
  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = poseCanvas.width;
  rawCanvas.height = poseCanvas.height;
  const rawCtx = rawCanvas.getContext('2d');
  rawCtx.drawImage(webcam, 0, 0);
  snapCtx.drawImage(webcam, 0, 0);
  snapCtx.drawImage(poseCanvas, 0, 0);

  const rawData = rawCanvas.toDataURL('image/jpeg', 0.85);
  const overlayData = snapCanvas.toDataURL('image/jpeg', 0.85);

  state.snapshotData = {
    imageDataUrl: state.reportConfig.skeleton ? overlayData : rawData,
    rawImageDataUrl: rawData,
    overlayImageDataUrl: overlayData,
    angles: { ...state.lastAngles },
    score: scoreByMethod(state.lastAngles, state.reportConfig.method),
    method: state.reportConfig.method,
    sourceModel: 'MediaPipe local',
    timestamp: new Date().toISOString(),
  };

  buildReport(state.snapshotData);
  switchPanel('report');
  showToast('Frame capturado "” reporte generado', 'success');

  // Enable export
  document.getElementById('btn-export').disabled = false;
  document.getElementById('report-date').textContent =
    'Capturado: ' + new Date().toLocaleString('es-PE');

  registerCurrentSession('REBA · Camara en vivo', state.lastScore.score);

  // Intento opcional: enriquecer reporte con YOLO11 Pose desde backend local.
  analyzeFrameWithBackend(state.snapshotData.rawImageDataUrl || state.snapshotData.imageDataUrl)
    .then(async (result) => {
      await applyBackendReport(result, state.snapshotData.rawImageDataUrl || state.snapshotData.imageDataUrl, 'Frame analizado');
      showToast('Reporte actualizado con IA de backend local.', 'success');
    })
    .catch(() => {
      showToast('Backend IA no activo. Se mantiene reporte local.', 'info');
    });
}

function buildReport(data) {
  const grid = document.getElementById('report-grid');
  const { score, angles, method } = data;

  const riskCode = score.color === '#00e5b4' ? 'low' :
                   score.color === '#ffb347'  ? 'medium' : 'high';

  const angleDisplays = [
    { label: 'Cuello', value: angles.neck + '°' },
    { label: 'Tronco', value: angles.trunk + '°' },
    { label: 'Brazo derecho', value: (180 - angles.armR) + '°' },
    { label: 'Brazo izquierdo', value: (180 - angles.armL) + '°' },
    { label: 'Rodilla derecha', value: (180 - angles.kneeR) + '°' },
    { label: 'Rodilla izquierda', value: (180 - angles.kneeL) + '°' },
    { label: 'Tobillo derecho', value: angles.ankleR + '°' },
    { label: 'Tobillo izquierdo', value: angles.ankleL + '°' },
  ];

  const scoreTableRows = [
    { label: 'Puntuacion Tabla A', value: score.tableA },
    { label: 'Puntuacion Tabla B', value: score.tableB },
    { label: 'Puntuacion Tabla C', value: score.scoreC },
    { label: 'Score final', value: score.score, bold: true },
  ];

  let angleTableHtml = '';
  angleDisplays.forEach(angle => {
    angleTableHtml += `<tr><td>${angle.label}</td><td>${angle.value}</td></tr>`;
  });

  let scoreTableHtml = '';
  scoreTableRows.forEach(row => {
    const boldStyle = row.bold ? '<strong>' : '';
    const boldEnd = row.bold ? '</strong>' : '';
    scoreTableHtml += `<tr><td>${boldStyle}${row.label}${boldEnd}</td><td>${boldStyle}${row.value}${boldEnd}</td></tr>`;
  });

  grid.innerHTML = `
    <!-- Title and date for printing -->
    <div style="display: none;" id="print-header">
      <div class="report-title">Reporte Ergonomico</div>
      <div id="report-date"></div>
    </div>

    <!-- Score principal -->
    <div class="report-card">
      <h4>Puntuacion ${method}</h4>
      <div class="report-value ${riskCode}">${score.score}</div>
      <div class="report-desc">${score.level}</div>
      <div class="report-desc">Motor: ${data.sourceModel || 'N/A'}</div>
    </div>

    <!-- Imagen capturada -->
    <div class="report-card">
      <h4>Frame analizado</h4>
      <img src="${data.imageDataUrl}" alt="Frame analizado"/>
    </div>

    <!-- Angulos articulares -->
    <div class="report-card">
      <h4>Angulos articulares</h4>
      <table class="angle-table">
        ${angleTableHtml}
      </table>
    </div>

    <!-- Puntuaciones intermedias -->
    <div class="report-card">
      <h4>Puntuaciones ${method}</h4>
      <table class="angle-table">
        ${scoreTableHtml}
      </table>
    </div>

    <!-- Recomendaciones -->
    <div class="report-card">
      <h4>Recomendaciones clinicas</h4>
      <div class="report-recommendations">
        ${getRecommendations(score.score, angles)}
      </div>
    </div>

    <!-- Diagnostico ergonomico -->
    <div class="report-card">
      <h4>Diagnostico ergonomico preliminar</h4>
      <div class="report-assessment">
        ${getClinicalAssessment(score.score, angles)}
      </div>
    </div>

    <!-- Referencias cientificas -->
    <div class="report-card">
      <h4>Sustento cientifico</h4>
      <div class="report-references">
        "¢ <strong>Lin et al. (2022)</strong> "” Scientific Reports. Sistema automatico video-REBA/RULA/OWAS. DOI: 10.1038/s41598-022-05812-9<br/>
        "¢ <strong>Agostinelli et al. (2024)</strong> "” Scientific Reports. Validacion MoCap 2D RGB en manufactura real. PMID: 39537717<br/>
        "¢ <strong>Sardar et al. (2024)</strong> "” Ergonomics. Deep learning + REBA/RULA en manufactura inteligente. PMID: 38742363
      </div>
    </div>
  `;
}

function getRecommendations(score, angles) {
  const recs = [];

  if (angles.neck > 20)
    recs.push('-ï¸ <strong>Cuello:</strong> Flexion anterior >20°. Ajustar altura del monitor o superficie de trabajo para mantener cuello neutro.');
  if (angles.trunk > 20)
    recs.push('-ï¸ <strong>Tronco:</strong> Inclinacion >20°. Redisenar altura de la tarea. Fortalecer musculatura lumbar.');
  if ((180 - angles.armR) > 45 || (180 - angles.armL) > 45)
    recs.push('-ï¸ <strong>Hombros:</strong> Elevacion >45°. Acercar materiales al cuerpo. Revisar altura de la superficie de trabajo.');
  if ((180 - angles.kneeR) > 35 || (180 - angles.kneeL) > 35)
    recs.push('-ï¸ <strong>Piernas:</strong> Flexion de rodilla sostenida. Ajustar altura de tarea y alternar apoyo para reducir carga femoropatelar.');
  if (Math.abs(90 - angles.ankleR) > 20 || Math.abs(90 - angles.ankleL) > 20)
    recs.push('-ï¸ <strong>Pies/tobillos:</strong> Desviacion en tobillo. Revisar calzado, superficie de apoyo y estabilidad del puesto.');

  if (score <= 3)
    recs.push('- Postura dentro de parametros aceptables. Mantener control periodico cada 3 meses.');
  else if (score <= 7)
    recs.push('ðŸ“‹ Se recomienda intervencion ergonomica en el corto plazo. Programar evaluacion con especialista.');
  else
    recs.push('ðŸš¨ Intervencion urgente requerida. Detener la tarea o modificar inmediatamente el puesto de trabajo.');

  return recs.join('<br/>') || 'Sin recomendaciones disponibles para este perfil.';
}

function getClinicalAssessment(score, angles) {
  const findings = [];

  if (angles.neck > 20) findings.push('Patron cervical en flexion: posible sobrecarga de musculatura extensora cervical.');
  if (angles.trunk > 20) findings.push('Patron de tronco inclinado: mayor demanda lumbar mecanica.');
  if ((180 - angles.kneeR) > 35 || (180 - angles.kneeL) > 35) findings.push('Patron de flexion de rodilla: incremento de carga en cadena anterior de miembro inferior.');
  if (Math.abs(90 - angles.ankleR) > 20 || Math.abs(90 - angles.ankleL) > 20) findings.push('Patron de tobillo no neutro: compromiso de estabilidad distal y compensaciones proximales.');

  const plan = [];
  if (score <= 3) plan.push('Seguimiento preventivo y educacion postural cada 8-12 semanas.');
  if (score >= 4 && score <= 7) plan.push('Intervencion ergonomica temprana: rediseno de puesto, pausas activas y control de fatiga.');
  if (score >= 8) plan.push('Intervencion prioritaria: ajuste inmediato del puesto y valoracion clinica presencial.');
  plan.push('Plan sugerido: ejercicios de movilidad toracica, control lumbopelvico y fortalecimiento de gluteos/core.');

  return [
    '<strong>Hallazgos:</strong> ' + (findings.length ? findings.join(' ') : 'No se identifican hallazgos relevantes en esta captura.'),
    '<strong>Plan recomendado:</strong> ' + plan.join(' '),
    '<strong>Nota:</strong> Este resultado es orientativo y no reemplaza diagnostico medico profesional.',
  ].join('<br/>');
}

// ==========================================
//  FILE UPLOAD
// ==========================================
async function uploadFileToSupabase(file) {
  const sb = getSupabase();
  const companyId = selectedCompanyId();
  const siteId = selectedSiteId();
  const user = state.platform.user;
  if (!sb || !companyId || !siteId || !user || !file) {
    showToast('Selecciona empresa/sede y autenticate para guardar el archivo.', 'info');
    return '';
  }

  const path = `${user.id}/${companyId}/${Date.now()}-${sanitizeStorageName(file.name)}`;
  const { error: storageError } = await sb
    .storage
    .from('biomecheck-files')
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });

  if (storageError) {
    showToast('Storage no guardo el archivo: ' + storageError.message, 'error');
    return '';
  }

  const { data, error } = await sb
    .from('uploaded_files')
    .insert({
      company_id: companyId,
      site_id: siteId,
      user_id: user.id,
      file_name: file.name,
      file_type: file.type || 'application/octet-stream',
      file_size: file.size || 0,
      storage_bucket: 'biomecheck-files',
      storage_path: path,
      status: 'uploaded',
    })
    .select()
    .single();

  if (error) {
    showToast('Archivo subido, pero no se registro metadata: ' + error.message, 'error');
    return '';
  }

  state.currentUploadedFileId = data.id;
  await refreshOperationalData();
  showToast('Archivo guardado en Supabase Storage.', 'success');
  return data.id;
}

async function uploadSnapshotToSupabase(dataUrl) {
  const sb = getSupabase();
  const companyId = selectedCompanyId();
  const user = state.platform.user;
  if (!sb || !companyId || !user || !dataUrl?.startsWith('data:')) return '';

  const blob = dataUrlToBlob(dataUrl);
  const path = `${user.id}/${companyId}/${Date.now()}-snapshot.jpg`;
  const { error } = await sb
    .storage
    .from('biomecheck-snapshots')
    .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false });

  if (error) {
    showToast('No se pudo guardar snapshot: ' + error.message, 'error');
    return '';
  }
  return path;
}

async function saveReportToSupabase(methodLabel, scoreValue) {
  const sb = getSupabase();
  const companyId = selectedCompanyId();
  const siteId = selectedSiteId();
  const user = state.platform.user;
  const data = state.snapshotData;
  if (!sb || !companyId || !siteId || !user || !data) return;

  const method = data.method || String(methodLabel || 'REBA').split(' ')[0] || 'REBA';
  const scoreObject = data.score || getRiskLevel(Number(scoreValue || 0), method);
  const finalScore = Number(scoreObject.score || scoreValue || 0);
  const level = getRiskLevel(finalScore, method);
  const snapshotPath = await uploadSnapshotToSupabase(data.imageDataUrl || data.rawImageDataUrl || '');

  const { error } = await sb
    .from('ergonomic_reports')
    .insert({
      company_id: companyId,
      site_id: siteId,
      uploaded_file_id: state.currentUploadedFileId || null,
      user_id: user.id,
      method,
      source_model: data.sourceModel || 'N/A',
      score: finalScore,
      risk_code: scoreObject.code || level.code,
      risk_label: scoreObject.level || level.label,
      angles: data.angles || {},
      recommendations: getRecommendations(finalScore, data.angles || {}),
      snapshot_bucket: snapshotPath ? 'biomecheck-snapshots' : null,
      snapshot_path: snapshotPath || null,
    });

  if (error) {
    showToast('No se pudo guardar reporte en Supabase: ' + error.message, 'error');
    return;
  }

  await refreshOperationalData();
  showToast('Reporte guardado en Supabase.', 'success');
}

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.add('drag-over');
}
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) loadMediaFile(file);
}
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) loadMediaFile(file);
}

async function loadMediaFile(file) {
  state.currentUploadFile = file;
  state.currentUploadedFileId = '';
  if (file.type.startsWith('video/')) {
    loadVideoFile(file);
    await uploadFileToSupabase(file);
    return;
  }
  if (file.type.startsWith('image/')) {
    await loadImageFile(file);
    await uploadFileToSupabase(file);
    return;
  }
  showToast('Formato no compatible. Usa video o imagen.', 'error');
}

function loadVideoFile(file) {
  const url = URL.createObjectURL(file);
  uploadImage.style.display = 'none';
  uploadImage.src = '';
  uploadVideo.style.display = '';
  uploadVideo.src = url;
  document.getElementById('drop-zone').style.display = 'none';
  document.getElementById('upload-preview').classList.remove('hidden');
  showToast('Video cargado: ' + file.name, 'success');
}

async function loadImageFile(file) {
  const dataUrl = await fileToDataUrl(file);
  state.uploadImageDataUrl = dataUrl;
  uploadVideo.pause();
  uploadVideo.removeAttribute('src');
  uploadVideo.load();
  uploadVideo.style.display = 'none';
  uploadImage.src = dataUrl;
  uploadImage.style.display = '';
  document.getElementById('drop-zone').style.display = 'none';
  document.getElementById('upload-preview').classList.remove('hidden');
  showToast('Imagen cargada: ' + file.name, 'success');
}

function resetUpload() {
  document.getElementById('drop-zone').style.display = '';
  document.getElementById('upload-preview').classList.add('hidden');
  uploadVideo.pause();
  uploadVideo.removeAttribute('src');
  uploadVideo.load();
  uploadVideo.style.display = '';
  uploadImage.src = '';
  uploadImage.style.display = 'none';
  state.uploadImageDataUrl = '';
  state.currentUploadFile = null;
  state.currentUploadedFileId = '';
  document.getElementById('file-input').value = '';
}

async function analyzeUploadMedia() {
  if (uploadImage.src && uploadImage.style.display !== 'none') {
    await analyzeImage();
    return;
  }
  await analyzeVideo();
}

async function analyzeImage() {
  if (!uploadImage.src && !state.uploadImageDataUrl) {
    showToast('Primero carga una imagen.', 'info');
    return;
  }

  setStatus('active', 'Analizando imagen...');

  const imageForAnalysis = await ensureDataUrl(state.uploadImageDataUrl || uploadImage.src);

  try {
    const backendResult = await analyzeFrameWithBackend(imageForAnalysis);
    await applyBackendReport(backendResult, imageForAnalysis, 'Imagen analizada');
    const localeForDate = getLanguage() === 'en' ? 'en-US' : 'es-PE';
    document.getElementById('report-date').textContent =
      (getLanguage() === 'en' ? 'Image analyzed: ' : 'Imagen analizada: ') + new Date().toLocaleString(localeForDate) + ' (IA · YOLO11)';
    registerCurrentSession('REBA · Imagen subida', backendResult.score?.score || 0);
    showToast(getLanguage() === 'en' ? 'AI image analysis completed.' : 'Analisis IA de imagen completado.', 'success');
    return;
  } catch (err) {
    setStatus('error', getLanguage() === 'en' ? 'AI backend unavailable' : 'IA no disponible');
    showToast(
      getLanguage() === 'en'
        ? 'AI backend is unreachable. Please try again in a moment.'
        : 'El servicio de IA no esta disponible. Intenta nuevamente en unos segundos.',
      'error'
    );
    return;
  }
}
async function analyzeVideo() {
  const video = document.getElementById('upload-video');
  if (!video.src) {
    showToast('Primero carga un video.', 'info');
    return;
  }

  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  const seconds = Math.max(5, Math.round(duration) || 12);
  const samples = Math.max(6, Math.min(40, Math.floor(seconds / 2)));
  const allScores = [];
  const acc = { neck: 0, trunk: 0, armR: 0, armL: 0, kneeR: 0, kneeL: 0, ankleR: 0, ankleL: 0, elbowR: 0, elbowL: 0 };

  setStatus('active', 'Analizando video...');

  try {
    const backendSamples = Math.max(4, Math.min(12, Math.floor(seconds / 2)));
    const sampledFrames = await captureVideoFrameSamples(video, backendSamples);
    const backendScores = [];
    const backendAngles = { neck: 0, trunk: 0, armR: 0, armL: 0, kneeR: 0, kneeL: 0, ankleR: 0, ankleL: 0, elbowR: 0, elbowL: 0 };
    let peakScore = -1;
    let peakFrame = sampledFrames[0]?.imageDataUrl || '';
    let peakKeypoints = [];

    for (let i = 0; i < sampledFrames.length; i++) {
      setStatus('active', 'IA frame ' + (i + 1) + '/' + sampledFrames.length);
      const result = await analyzeFrameWithBackend(sampledFrames[i].imageDataUrl);
      const score = result.score?.score ?? 0;
      backendScores.push(score);

      Object.keys(backendAngles).forEach((k) => {
        const fallback = k === 'ankleR' || k === 'ankleL' ? 90 : 0;
        backendAngles[k] += Number(result.angles?.[k] ?? fallback);
      });

      if (score > peakScore) {
        peakScore = score;
        peakFrame = sampledFrames[i].imageDataUrl;
        peakKeypoints = result.keypoints || [];
      }
    }

    Object.keys(backendAngles).forEach((k) => {
      backendAngles[k] = Math.round(backendAngles[k] / sampledFrames.length);
    });

    const avgScore = Math.round(backendScores.reduce((a, b) => a + b, 0) / backendScores.length);
    const level = getRiskLevel(avgScore, 'REBA');
    const aggregated = {
      score: scoreByMethod(backendAngles, state.reportConfig.method),
      angles: backendAngles,
      keypoints: peakKeypoints,
    };

    await applyBackendReport(aggregated, peakFrame, 'Video analizado');
    document.getElementById('report-date').textContent =
      'Video analizado: ' + new Date().toLocaleString('es-PE') + ' (' + sampledFrames.length + ' frames IA)';
    registerCurrentSession('REBA · Video subido', avgScore);
    showToast('Analisis IA multiframe completado.', 'success');
    return;
  } catch (_) {
    // Fallback a estimacion local para no bloquear el flujo.
    showToast('Backend IA no disponible, usando modo prototipo local.', 'info');
  }

  for (let i = 0; i < samples; i++) {
    const p = i / Math.max(1, samples - 1);
    const t = p * Math.max(seconds, 1);
    const angles = {
      neck: Math.round(8 + 22 * Math.abs(Math.sin(t * 0.7))),
      trunk: Math.round(10 + 30 * Math.abs(Math.sin(t * 0.5))),
      armR: Math.round(120 + 35 * Math.sin(t * 1.1)),
      armL: Math.round(120 + 30 * Math.cos(t * 0.95)),
      kneeR: Math.round(150 + 20 * Math.sin(t * 0.6)),
      kneeL: Math.round(150 + 16 * Math.cos(t * 0.65)),
      ankleR: Math.round(90 + 18 * Math.sin(t * 0.8)),
      ankleL: Math.round(90 + 16 * Math.cos(t * 0.75)),
      elbowR: Math.round(85 + 30 * Math.sin(t * 1.2)),
      elbowL: Math.round(90 + 24 * Math.cos(t * 1.15)),
    };

    const score = calculateREBAScore(angles);
    allScores.push(score.score);
    Object.keys(acc).forEach((k) => {
      acc[k] += angles[k];
    });
  }

  Object.keys(acc).forEach((k) => {
    acc[k] = Math.round(acc[k] / samples);
  });

  const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
  const level = getRiskLevel(avgScore, state.method);
  const composed = {
    score: avgScore,
    level: level.label,
    color: level.color,
    tableA: '-',
    tableB: '-',
    scoreC: '-',
  };

  const reportCanvas = document.createElement('canvas');
  reportCanvas.width = 960;
  reportCanvas.height = 540;
  const rctx = reportCanvas.getContext('2d');
  rctx.fillStyle = '#090d1a';
  rctx.fillRect(0, 0, 960, 540);
  rctx.fillStyle = '#00e5b4';
  rctx.font = '600 26px "Space Grotesk", sans-serif';
  rctx.fillText('BiomeCheck · Analisis local de video', 40, 74);
  rctx.fillStyle = 'rgba(255,255,255,0.78)';
  rctx.font = '500 20px "Space Grotesk", sans-serif';
  rctx.fillText('Muestras: ' + samples + ' · Duracion: ' + seconds + ' s', 40, 114);
  rctx.fillText('Score estimado (' + state.method + '): ' + avgScore + ' · ' + level.label, 40, 152);

  state.lastAngles = acc;
  state.lastScore = composed;
  updateMetricsUI(acc, composed);

  state.snapshotData = {
    imageDataUrl: reportCanvas.toDataURL('image/jpeg', 0.9),
    rawImageDataUrl: reportCanvas.toDataURL('image/jpeg', 0.9),
    overlayImageDataUrl: reportCanvas.toDataURL('image/jpeg', 0.9),
    angles: { ...acc },
    score: scoreByMethod(acc, state.reportConfig.method),
    method: state.reportConfig.method,
    sourceModel: 'Local',
    timestamp: new Date().toISOString(),
  };

  buildReport(state.snapshotData);
  document.getElementById('btn-export').disabled = false;
  document.getElementById('report-date').textContent =
    'Video analizado: ' + new Date().toLocaleString('es-PE') + ' (modo prototipo local)';
  registerCurrentSession('REBA · Video subido', avgScore);
  setStatus('active', 'Video analizado');
  switchPanel('report');
  showToast('Analisis local finalizado. Reporte generado.', 'success');
}

// ==========================================
//  EXPORT
// ==========================================
function exportReport() {
  if (!state.snapshotData) {
    showToast('Primero genera un reporte.', 'info');
    return;
  }
  showToast('Se abrira el dialogo de impresion para guardar como PDF.', 'info');
  window.print();
}

// ==========================================
//  PATIENTS & HISTORY
// ==========================================
function loadManagementData() {
  try {
    state.patients = JSON.parse(localStorage.getItem(STORAGE.patients) || '[]');
    state.history = JSON.parse(localStorage.getItem(STORAGE.history) || '[]');
  } catch (_) {
    state.patients = [];
    state.history = [];
  }

  if (state.patients.length > 0 && !state.selectedPatientId) {
    state.selectedPatientId = state.patients[0].id;
  }
  renderPatients();
  renderHistory();
  syncHistoryPatientOptions();
}

function savePatients() {
  localStorage.setItem(STORAGE.patients, JSON.stringify(state.patients));
}

function saveHistory() {
  localStorage.setItem(STORAGE.history, JSON.stringify(state.history));
}

function openNewPatient() {
  const input = document.getElementById('patient-name');
  input.focus();
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function createPatient(event) {
  event.preventDefault();
  const name = document.getElementById('patient-name').value.trim();
  const role = document.getElementById('patient-role').value.trim();
  const age = Number(document.getElementById('patient-age').value);
  const risk = document.getElementById('patient-risk').value;

  if (!name || !role || !age) {
    showToast('Completa los campos del paciente.', 'error');
    return;
  }

  const patient = {
    id: 'p_' + Date.now(),
    name,
    role,
    age,
    risk,
    sessions: 0,
  };
  state.patients.unshift(patient);
  state.selectedPatientId = patient.id;
  savePatients();
  renderPatients();
  syncHistoryPatientOptions();
  event.target.reset();
  showToast('Paciente creado.', 'success');
}

function selectPatient(id) {
  state.selectedPatientId = id;
  renderPatients();
  syncHistoryPatientOptions();
  showToast('Paciente activo seleccionado.', 'info');
}

function deletePatient(id) {
  state.patients = state.patients.filter((p) => p.id !== id);
  state.history = state.history.filter((h) => h.patientId !== id);
  if (state.selectedPatientId === id) {
    state.selectedPatientId = state.patients[0]?.id || '';
  }
  savePatients();
  saveHistory();
  renderPatients();
  renderHistory();
  syncHistoryPatientOptions();
  showToast('Paciente eliminado.', 'info');
}

function riskLabel(code) {
  if (code === 'high') return 'Alto';
  if (code === 'medium') return 'Medio';
  return 'Bajo';
}

function renderPatients() {
  const grid = document.getElementById('patients-grid');
  if (state.patients.length === 0) {
    grid.innerHTML = '<div class="empty-inline">No hay pacientes aun. Crea el primero arriba.</div>';
    return;
  }

  grid.innerHTML = state.patients.map((p) => {
    const initials = p.name.split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase() || '').join('');
    const activeClass = p.id === state.selectedPatientId ? ' style="border-color: var(--accent);"' : '';
    return `
      <div class="patient-card" onclick="selectPatient('${p.id}')"${activeClass}>
        <div class="patient-avatar">${initials}</div>
        <div class="patient-info">
          <span class="patient-name">${p.name}</span>
          <span class="patient-detail">${p.role} · ${p.age} anos</span>
          <span class="patient-sessions">${p.sessions || 0} sesiones</span>
        </div>
        <div class="patient-actions">
          <div class="patient-risk ${p.risk}">${riskLabel(p.risk)}</div>
          <button class="btn-danger" onclick="event.stopPropagation();deletePatient('${p.id}')">Eliminar</button>
        </div>
      </div>
    `;
  }).join('');
}

function syncHistoryPatientOptions() {
  const sel = document.getElementById('history-patient');
  sel.innerHTML = '';
  if (state.patients.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Primero crea un paciente';
    sel.appendChild(opt);
    return;
  }

  state.patients.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
  sel.value = state.selectedPatientId || state.patients[0].id;
}

function createHistoryEntry(event) {
  event.preventDefault();
  const patientId = document.getElementById('history-patient').value;
  const patient = state.patients.find((p) => p.id === patientId);
  if (!patient) {
    showToast('Selecciona un paciente valido.', 'error');
    return;
  }

  const method = document.getElementById('history-method').value;
  const score = Number(document.getElementById('history-score').value);
  const date = document.getElementById('history-date').value;
  const level = getRiskLevel(score, 'REBA');

  const entry = {
    id: 'h_' + Date.now(),
    patientId,
    patientName: patient.name,
    method,
    score,
    level: level.label,
    code: level.code,
    date,
  };

  state.history.unshift(entry);
  patient.sessions = (patient.sessions || 0) + 1;
  saveHistory();
  savePatients();
  renderHistory();
  renderPatients();
  event.target.reset();
  document.getElementById('history-date').value = new Date().toISOString().slice(0, 10);
  syncHistoryPatientOptions();
  showToast('Sesion agregada al historial.', 'success');
}

function registerCurrentSession(method, score) {
  saveReportToSupabase(method, score).catch((err) => {
    showToast('Error guardando reporte: ' + (err?.message || 'desconocido'), 'error');
  });

  if (!state.selectedPatientId) return;
  const patient = state.patients.find((p) => p.id === state.selectedPatientId);
  if (!patient) return;

  const level = getRiskLevel(score, 'REBA');
  const entry = {
    id: 'h_' + Date.now(),
    patientId: patient.id,
    patientName: patient.name,
    method,
    score,
    level: level.label,
    code: level.code,
    date: new Date().toISOString().slice(0, 10),
  };

  state.history.unshift(entry);
  patient.sessions = (patient.sessions || 0) + 1;
  saveHistory();
  savePatients();
  renderHistory();
  renderPatients();
}

function deleteHistoryEntry(id) {
  state.history = state.history.filter((h) => h.id !== id);
  saveHistory();
  renderHistory();
}

function clearHistory() {
  state.history = [];
  state.patients.forEach((p) => { p.sessions = 0; });
  saveHistory();
  savePatients();
  renderHistory();
  renderPatients();
  showToast('Historial limpiado.', 'info');
}

function renderHistory() {
  const list = document.getElementById('history-list');
  if (state.history.length === 0) {
    list.innerHTML = '<div class="empty-inline">No hay sesiones registradas aun.</div>';
    return;
  }

  list.innerHTML = state.history.map((h) => {
    const d = new Date(h.date + 'T12:00:00');
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('es-ES', { month: 'short' });
    const riskClass = h.code === 'high' || h.code === 'very-high' ? 'risk-high' : (h.code === 'medium' ? 'risk-medium' : 'risk-low');
    return `
      <div class="history-item">
        <div class="history-date">
          <span class="h-day">${day}</span>
          <span class="h-month">${month}</span>
        </div>
        <div class="history-body">
          <span class="h-patient">${h.patientName}</span>
          <span class="h-method">${h.method}</span>
          <span class="h-score ${riskClass}">Score: ${h.score} "” ${h.level}</span>
        </div>
        <button class="btn-danger" onclick="deleteHistoryEntry('${h.id}')">Eliminar</button>
      </div>
    `;
  }).join('');
}

// ==========================================
//  DEMO LOOP (sin MediaPipe disponible)
// ==========================================
function demoLoop() {
  if (!state.cameraActive) return;

  if (state.mode === 'demo') {
    poseCanvas.width = 960;
    poseCanvas.height = 540;
  } else {
    poseCanvas.width = webcam.videoWidth || 640;
    poseCanvas.height = webcam.videoHeight || 480;
  }

  // Simulate slowly varying angles
  const t = Date.now() / 1000;
  const angles = {
    neck:   Math.round(10 + 8 * Math.sin(t * 0.4)),
    trunk:  Math.round(15 + 10 * Math.sin(t * 0.3)),
    armR:   Math.round(130 + 20 * Math.sin(t * 0.5)),
    armL:   Math.round(120 + 15 * Math.sin(t * 0.45)),
    kneeR:  Math.round(160 + 10 * Math.sin(t * 0.35)),
    kneeL:  Math.round(155 + 12 * Math.sin(t * 0.38)),
    ankleR: Math.round(90 + 14 * Math.sin(t * 0.33)),
    ankleL: Math.round(90 + 14 * Math.cos(t * 0.31)),
    elbowR: Math.round(100 + 20 * Math.sin(t * 0.5)),
    elbowL: Math.round(95  + 18 * Math.sin(t * 0.52)),
  };
  state.lastAngles = angles;

  const score = calculateREBAScore(angles);
  state.lastScore = score;
  updateMetricsUI(angles, score);
  drawDemoSkeleton(t);

  // FPS
  state.frameCount++;
  const now = performance.now();
  if (now - state.lastFpsTime > 1000) {
    fpsEl.textContent = state.frameCount + ' fps (demo)';
    state.frameCount = 0;
    state.lastFpsTime = now;
  }

  state.animFrame = requestAnimationFrame(demoLoop);
}

function drawDemoSkeleton(t) {
  const w = poseCanvas.width;
  const h = poseCanvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w * 0.5;
  const headY = h * 0.22 + Math.sin(t * 1.6) * 6;
  const shoulderY = h * 0.34 + Math.sin(t * 1.2) * 8;
  const hipY = h * 0.52;

  const shoulderSpan = 120;
  const hipSpan = 80;
  const armSwing = Math.sin(t * 2.2) * 32;
  const kneeSwing = Math.sin(t * 1.4) * 16;

  const points = {
    head: { x: cx, y: headY },
    ls: { x: cx - shoulderSpan / 2, y: shoulderY },
    rs: { x: cx + shoulderSpan / 2, y: shoulderY },
    lh: { x: cx - hipSpan / 2, y: hipY },
    rh: { x: cx + hipSpan / 2, y: hipY },
    le: { x: cx - shoulderSpan / 2 - armSwing, y: shoulderY + 65 },
    re: { x: cx + shoulderSpan / 2 + armSwing, y: shoulderY + 65 },
    lw: { x: cx - shoulderSpan / 2 - armSwing * 0.7, y: shoulderY + 130 },
    rw: { x: cx + shoulderSpan / 2 + armSwing * 0.7, y: shoulderY + 130 },
    lk: { x: cx - hipSpan / 2 + kneeSwing, y: hipY + 95 },
    rk: { x: cx + hipSpan / 2 - kneeSwing, y: hipY + 95 },
    la: { x: cx - hipSpan / 2 + kneeSwing * 0.5, y: hipY + 190 },
    ra: { x: cx + hipSpan / 2 - kneeSwing * 0.5, y: hipY + 190 },
  };

  const lines = [
    ['head', 'ls'], ['head', 'rs'], ['ls', 'rs'],
    ['ls', 'le'], ['le', 'lw'], ['rs', 're'], ['re', 'rw'],
    ['ls', 'lh'], ['rs', 'rh'], ['lh', 'rh'],
    ['lh', 'lk'], ['lk', 'la'], ['rh', 'rk'], ['rk', 'ra'],
  ];

  if (state.showSkeleton) {
    ctx.lineWidth = 3;
    lines.forEach(([a, b]) => {
      const p1 = points[a];
      const p2 = points[b];
      const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
      grad.addColorStop(0, '#00e5b4');
      grad.addColorStop(1, '#0099ff');
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
  }

  if (state.showPoints) {
    ctx.fillStyle = '#00e5b4';
    Object.values(points).forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.font = '13px "DM Mono", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('Demo local sin camara', 16, 28);
}

// ==========================================
//  TOAST NOTIFICATIONS
// ==========================================
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ==========================================
//  PWA SERVICE WORKER
// ==========================================
// =========================================================
//  PLATFORM SHELL: LOGIN, COMPANY/SITE, THEME, NAVIGATION
// =========================================================
function getSupabaseConfig() {
  return {
    url: (
      localStorage.getItem('biomecheck_supabase_url') ||
      APP_CONFIG.SUPABASE_URL ||
      ''
    ).trim(),
    anonKey: (
      localStorage.getItem('biomecheck_supabase_anon_key') ||
      APP_CONFIG.SUPABASE_ANON_KEY ||
      ''
    ).trim(),
  };
}

function isSupabaseConfigured() {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey && window.supabase?.createClient);
}

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey || !window.supabase?.createClient) return null;
  supabaseClient = window.supabase.createClient(config.url, config.anonKey);
  return supabaseClient;
}

function showSupabaseConfigNotice() {
  const note = document.querySelector('.auth-note');
  if (!note) return;
  if (isSupabaseConfigured()) {
    note.textContent = 'Usa el usuario creado en Supabase Auth o crea una cuenta nueva para pruebas.';
    return;
  }
  note.innerHTML = 'Falta configurar Supabase. Edita <strong>js/config.js</strong> con SUPABASE_URL y SUPABASE_ANON_KEY.';
}

function selectedCompanyId() {
  return localStorage.getItem(PLATFORM_STORAGE.companyId) || '';
}

function selectedSiteId() {
  return localStorage.getItem(PLATFORM_STORAGE.siteId) || '';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeStorageName(name) {
  return String(name || 'file')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'file';
}

function dataUrlToBlob(dataUrl) {
  const [header, encoded] = String(dataUrl || '').split(',');
  const mime = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
  const binary = atob(encoded || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function ensureProfile() {
  const sb = getSupabase();
  const user = state.platform.user;
  if (!sb || !user) return null;

  const { data } = await sb
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (data) {
    state.platform.profile = data;
    return data;
  }

  const profile = {
    id: user.id,
    full_name: user.user_metadata?.full_name || displayNameFromEmail(user.email),
    email: user.email || '',
    role: 'master',
  };
  const { data: inserted, error } = await sb
    .from('profiles')
    .upsert(profile)
    .select()
    .single();

  if (error) {
    showToast('No se pudo crear perfil: ' + error.message, 'error');
    return null;
  }
  state.platform.profile = inserted;
  return inserted;
}

async function loadCompaniesFromSupabase() {
  const sb = getSupabase();
  if (!sb || !state.platform.user) return [];

  const { data, error } = await sb
    .from('companies')
    .select('id, name, created_at')
    .order('name', { ascending: true });

  if (error) {
    showToast('No se pudieron cargar companias: ' + error.message, 'error');
    state.platform.companies = [];
    return [];
  }

  state.platform.companies = data || [];
  return state.platform.companies;
}

async function loadSitesFromSupabase(companyId = selectedCompanyId()) {
  const sb = getSupabase();
  if (!sb || !companyId) {
    state.platform.sites = [];
    return [];
  }

  const { data, error } = await sb
    .from('industrial_sites')
    .select('id, company_id, name, city, country, created_at')
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (error) {
    showToast('No se pudieron cargar sedes: ' + error.message, 'error');
    state.platform.sites = [];
    return [];
  }

  state.platform.sites = data || [];
  return state.platform.sites;
}

async function refreshOperationalData() {
  const sb = getSupabase();
  const companyId = selectedCompanyId();
  if (!sb || !companyId) return;

  const [reports, files, actions, workstations] = await Promise.all([
    sb.from('ergonomic_reports').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    sb.from('uploaded_files').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    sb.from('action_plans').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    sb.from('workstations').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
  ]);

  if (!reports.error) state.platform.reports = reports.data || [];
  if (!files.error) state.platform.files = files.data || [];
  if (!actions.error) state.platform.actionPlans = actions.data || [];
  if (!workstations.error) state.platform.workstations = workstations.data || [];

  renderDashboardReal();
  renderFilesReal();
  renderSettingsCompaniesReal();
  renderSettingsUsersReal();
  renderActionPlansReal();
}

function riskColorClass(code) {
  if (code === 'low' || code === 'negligible') return 'acceptable';
  if (code === 'medium') return 'moderate';
  if (code === 'high') return 'high';
  if (code === 'very-high') return 'very';
  return 'serious';
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || 'unknown';
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function renderDashboardReal() {
  const panel = document.getElementById('panel-dashboard');
  if (!panel) return;

  const reports = state.platform.reports || [];
  const files = state.platform.files || [];
  const actions = state.platform.actionPlans || [];
  const workstations = state.platform.workstations || [];
  const totalReports = reports.length;
  const riskCounts = countBy(reports, 'risk_code');
  const highRisk = (riskCounts.high || 0) + (riskCounts['very-high'] || 0);
  const evaluated = workstations.length ? Math.min(100, Math.round((totalReports / workstations.length) * 100)) : 0;
  const latest = reports.slice(0, 5);

  const riskRows = [
    ['negligible', t('risk.negligible')],
    ['low', t('risk.low')],
    ['medium', t('risk.medium')],
    ['high', t('risk.high')],
    ['very-high', t('risk.veryHigh')],
  ].map(([code, label]) => `
    <p><b class="pill ${riskColorClass(code)}">${riskCounts[code] || 0}</b>${label}</p>
  `).join('');

  const localeForDate = getLanguage() === 'en' ? 'en-US' : 'es-PE';

  panel.innerHTML = `
    <div class="dashboard-grid">
      <div class="dashboard-hero">
        <div>
          <p class="eyebrow">${t('bc.home').toUpperCase()}</p>
          <h2>${t('dashboard.title')}</h2>
          <p>${totalReports ? t('dashboard.summary') : t('dashboard.empty')}</p>
        </div>
        <button class="btn-primary compact" type="button" onclick="switchPanel('upload')">${t('dashboard.sendVideo')}</button>
      </div>

      <div class="workstation-card">
        <div class="workstation-total">
          <span>${t('dashboard.workstations')}</span>
          <strong>${workstations.length}</strong>
        </div>
        <div class="eval-bar">
          <div class="eval-labels"><span>${t('dashboard.evaluated')} ${evaluated}%</span><span>${totalReports} ${t('dashboard.reports')}</span></div>
          <div class="progress-track"><div style="width:${evaluated}%"></div></div>
        </div>
      </div>

      <div class="map-card">
        <div class="facility-map">${escapeHtml(selectedCompany()?.name || t('dashboard.noCompany'))}</div>
        <div class="risk-legend">
          <strong>${t('dashboard.highestRisk')}</strong>
          <span><i class="risk-dot acceptable"></i>${riskCounts.low || riskCounts.negligible || 0} ${t('risk.acceptableShort')}</span>
          <span><i class="risk-dot moderate"></i>${riskCounts.medium || 0} ${t('risk.moderateShort')}</span>
          <span><i class="risk-dot high"></i>${riskCounts.high || 0} ${t('risk.highShort')}</span>
          <span><i class="risk-dot very"></i>${riskCounts['very-high'] || 0} ${t('risk.veryHighShort')}</span>
        </div>
      </div>

      <div class="metric-card wide-card">
        <div class="card-title-line">
          <h3>${t('dashboard.checklist')} <span>${t('dashboard.highestRiskShort')}</span></h3>
          <small>${t('dashboard.realReports')} <b>${totalReports}</b></small>
        </div>
        <div class="donut-row">
          <div class="donut large" style="--donut: conic-gradient(#2bc95b 0 ${totalReports ? ((riskCounts.low || 0) / totalReports) * 100 : 0}%, #ffdb2e 0 ${totalReports ? (((riskCounts.low || 0) + (riskCounts.medium || 0)) / totalReports) * 100 : 0}%, #ff862f 0 ${totalReports ? (((riskCounts.low || 0) + (riskCounts.medium || 0) + (riskCounts.high || 0)) / totalReports) * 100 : 0}%, #ef4056 0 100%);">
            <div><strong>${totalReports}</strong><span>${t('dashboard.generatedReports')}</span></div>
          </div>
          <div class="risk-list">${riskRows}</div>
        </div>
      </div>

      <div class="metric-card">
        <h3>${t('dashboard.realActivity')}</h3>
        <div class="method-risk-grid">
          <div><span>${t('dashboard.uploadedFiles')}</span><strong>${files.length}</strong><em>Supabase Storage</em></div>
          <div><span>${t('dashboard.highRisk')}</span><strong>${highRisk}</strong><em>${t('dashboard.requiresReview')}</em></div>
          <div><span>${t('dashboard.actionPlans')}</span><strong>${actions.length}</strong><em>${t('dashboard.openClosed')}</em></div>
        </div>
      </div>

      <div class="metric-card">
        <h3>${t('dashboard.latestReports')}</h3>
        ${latest.length ? `
          <table class="data-table">
            <thead><tr><th>${t('dashboard.method')}</th><th>${t('dashboard.score')}</th><th>${t('dashboard.risk')}</th><th>${t('dashboard.date')}</th></tr></thead>
            <tbody>${latest.map((r) => `
              <tr>
                <td>${escapeHtml(r.method)}</td>
                <td>${r.score}</td>
                <td>${escapeHtml(r.risk_label)}</td>
                <td>${new Date(r.created_at).toLocaleDateString(localeForDate)}</td>
              </tr>
            `).join('')}</tbody>
          </table>
        ` : `<div class="empty-inline">${t('dashboard.noReports')}</div>`}
      </div>
    </div>
  `;
}

function renderFilesReal() {
  const list = document.querySelector('#panel-files .file-list');
  if (!list) return;
  const files = state.platform.files || [];
  if (!files.length) {
    list.innerHTML = '<div class="empty-inline large-empty">No hay archivos reales en Supabase Storage.</div>';
    return;
  }
  list.innerHTML = files.map((file) => `
    <article class="file-item">
      <div class="file-thumb"><span>${file.file_type?.startsWith('image/') ? 'IMG' : 'VID'}</span></div>
      <div class="file-main">
        <h3>${escapeHtml(file.file_name)}</h3>
        <p><strong>Company:</strong> ${escapeHtml(selectedCompany()?.name || '')}</p>
        <p><strong>Industrial site:</strong> ${escapeHtml(selectedSite() || '')}</p>
        <p><strong>Storage:</strong> ${escapeHtml(file.storage_bucket)}</p>
      </div>
      <div class="file-meta">
        <p><strong>Size:</strong> ${(Number(file.file_size || 0) / 1024 / 1024).toFixed(2)} MB</p>
        <p><strong>Upload date:</strong> ${new Date(file.created_at).toLocaleDateString('es-PE')}</p>
        <p><strong>Status:</strong> <span class="ok">${escapeHtml(file.status)}</span></p>
      </div>
      <button class="btn-ghost compact" type="button">...</button>
    </article>
  `).join('');
}

function renderSettingsCompaniesReal() {
  const panel = document.getElementById('panel-settings-companies');
  if (!panel) return;
  const companies = state.platform.companies || [];
  panel.innerHTML = `
    <div class="section-header">
      <div><p class="breadcrumb">Home / Settings / Companies</p><h2>Manage companies</h2></div>
      <button class="btn-primary compact" type="button" onclick="createCompanyFromPrompt()">Create</button>
    </div>
    <div class="toolbar-row"><button class="btn-secondary compact">Filter</button></div>
    <table class="data-table">
      <thead><tr><th>Name</th><th>Total Industrial Sites</th><th>Date of creation</th><th>Actions</th></tr></thead>
      <tbody>${companies.length ? companies.map((company) => {
        const totalSites = (state.platform.sites || []).filter((site) => site.company_id === company.id).length;
        return `<tr><td>${escapeHtml(company.name)}</td><td>${totalSites}</td><td>${new Date(company.created_at).toLocaleDateString('es-PE')}</td><td><button class="btn-ghost compact" onclick="chooseCompany('${company.id}')">Open</button></td></tr>`;
      }).join('') : '<tr><td colspan="4"><div class="empty-inline">No hay empresas. Crea la primera con datos reales.</div></td></tr>'}</tbody>
    </table>
  `;
}

function renderSettingsUsersReal() {
  const panel = document.getElementById('panel-settings-users');
  if (!panel) return;
  const profile = state.platform.profile;
  panel.innerHTML = `
    <div class="section-header"><div><p class="breadcrumb">Home / Manage users</p><h2>Manage users</h2></div><button class="btn-primary compact" type="button">Invite</button></div>
    <div class="toolbar-row"><button class="btn-secondary compact">Filter</button></div>
    <table class="data-table">
      <thead><tr><th>Name</th><th>E-mail</th><th>Role</th><th>Status</th></tr></thead>
      <tbody>${profile ? `
        <tr><td>${escapeHtml(profile.full_name)}</td><td>${escapeHtml(profile.email)}</td><td>${escapeHtml(profile.role || 'master')}</td><td><span class="ok">Active</span></td></tr>
      ` : '<tr><td colspan="4"><div class="empty-inline">No hay perfil cargado.</div></td></tr>'}</tbody>
    </table>
  `;
}

function renderActionPlansReal() {
  const plans = state.platform.actionPlans || [];
  const columns = {
    todo: plans.filter((p) => p.status === 'todo'),
    doing: plans.filter((p) => p.status === 'doing'),
    done: plans.filter((p) => p.status === 'done'),
  };
  document.querySelectorAll('.action-count').forEach((el) => { el.textContent = 'Action plans: ' + plans.length; });
  document.querySelectorAll('.kanban-col.todo').forEach((el) => { el.innerHTML = `<h3>To Do <b>${columns.todo.length}</b></h3>${columns.todo.map(renderPlanCard).join('')}`; });
  document.querySelectorAll('.kanban-col.doing').forEach((el) => { el.innerHTML = `<h3>Doing <b>${columns.doing.length}</b></h3>${columns.doing.map(renderPlanCard).join('')}`; });
  document.querySelectorAll('.kanban-col.done').forEach((el) => { el.innerHTML = `<h3>Done <b>${columns.done.length}</b></h3>${columns.done.map(renderPlanCard).join('')}`; });
}

function renderPlanCard(plan) {
  return `<div class="plan-card"><strong>${escapeHtml(plan.title)}</strong><span>${escapeHtml(plan.priority)}</span></div>`;
}

async function createCompanyFromPrompt() {
  const sb = getSupabase();
  if (!sb || !state.platform.user) return showSupabaseConfigNotice();
  const name = prompt('Nombre real de la compania');
  if (!name?.trim()) return;

  const { data: company, error } = await sb
    .from('companies')
    .insert({ name: name.trim(), created_by: state.platform.user.id })
    .select()
    .single();
  if (error) {
    showToast('No se pudo crear compania: ' + error.message, 'error');
    return;
  }

  const { error: memberError } = await sb
    .from('company_members')
    .insert({ company_id: company.id, user_id: state.platform.user.id, role: 'master' });
  if (memberError) {
    showToast('Compania creada, pero falta membresia: ' + memberError.message, 'error');
    return;
  }

  await loadCompaniesFromSupabase();
  chooseCompany(company.id);
}

async function createSiteFromPrompt() {
  const sb = getSupabase();
  const companyId = selectedCompanyId();
  if (!sb || !companyId) return;
  const name = prompt('Nombre real de la sede industrial');
  if (!name?.trim()) return;

  const { data, error } = await sb
    .from('industrial_sites')
    .insert({ company_id: companyId, name: name.trim(), country: 'PE' })
    .select()
    .single();
  if (error) {
    showToast('No se pudo crear sede: ' + error.message, 'error');
    return;
  }
  await loadSitesFromSupabase(companyId);
  chooseSite(encodeURIComponent(data.id));
}

function switchPanel(name) {
  const panel = document.getElementById('panel-' + name);
  if (!panel) {
    showToast('Vista no disponible: ' + name, 'error');
    return;
  }

  document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.nav-item, .nav-subitem').forEach((n) => n.classList.remove('active'));
  panel.classList.add('active');
  document.querySelectorAll(`[data-panel="${name}"]`).forEach((item) => item.classList.add('active'));

  if (name.startsWith('settings-')) {
    document.querySelector('.settings-toggle')?.classList.add('active');
    expandSettingsNav();
  }

  const title = document.getElementById('topbar-title');
  if (title) title.textContent = t('panel.' + name) || name;
  panel.scrollTop = 0;

  if (window.innerWidth <= 768) {
    document.querySelector('.sidebar')?.classList.remove('open');
  }
}

function setPlatformMode(mode) {
  document.body.classList.remove('auth-mode', 'company-mode', 'site-mode', 'app-ready');
  document.body.classList.add(mode);
}

function getSession() {
  return state.platform.session;
}

function selectedCompany() {
  const id = selectedCompanyId();
  return state.platform.companies.find((company) => company.id === id) || null;
}

function selectedSite() {
  const id = selectedSiteId();
  return state.platform.sites.find((site) => site.id === id)?.name || localStorage.getItem(PLATFORM_STORAGE.site) || '';
}

function displayNameFromEmail(email) {
  const safeEmail = email || 'usuario@ejemplo.com';
  const raw = safeEmail.split('@')[0].replace(/[._-]+/g, ' ');
  return raw.replace(/\b\w/g, (c) => c.toUpperCase());
}

function updateOrgUI() {
  const session = getSession();
  const company = selectedCompany();
  const site = selectedSite();
  const orgPill = document.getElementById('org-pill');
  if (orgPill) {
    orgPill.textContent = company?.name && site
      ? `${company.name} / ${site}`
      : 'Selecciona empresa / sede';
  }

  const email = state.platform.user?.email || session?.user?.email || '';
  const name = state.platform.profile?.full_name || displayNameFromEmail(email || 'usuario@biomecheck.local');
  const initial = (name.trim()[0] || 'B').toUpperCase();
  const role = state.platform.profile?.role || '';
  const userInitial = document.getElementById('user-initial');
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const profileRole = document.getElementById('profile-role');
  const profileCompany = document.getElementById('profile-company');
  const profileSite = document.getElementById('profile-site');
  const profileInitial = document.getElementById('profile-initial');
  const dropdownName = document.getElementById('dropdown-name');
  const dropdownEmail = document.getElementById('dropdown-email');
  if (userInitial) userInitial.textContent = initial;
  if (profileName) profileName.textContent = name;
  if (profileEmail) profileEmail.textContent = email;
  if (profileRole) profileRole.textContent = role ? role.charAt(0).toUpperCase() + role.slice(1) : '-';
  if (profileCompany) profileCompany.textContent = company?.name || '-';
  if (profileSite) profileSite.textContent = site || '-';
  if (profileInitial) profileInitial.textContent = initial;
  if (dropdownName) dropdownName.textContent = name;
  if (dropdownEmail) dropdownEmail.textContent = email;
  if (orgPill && (!company?.name || !site)) {
    orgPill.textContent = t('topbar.selectOrg');
  }
  renderUsersTable();
}

async function renderUsersTable() {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  const sb = getSupabase();
  const company = selectedCompany();
  if (!sb || !company) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-inline">${t('users.empty')}</div></td></tr>`;
    return;
  }
  try {
    const { data: members, error } = await sb
      .from('company_members')
      .select('role, user_id, profiles:profiles!company_members_user_id_fkey(full_name, email)')
      .eq('company_id', company.id);
    if (error) throw error;
    if (!members || members.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-inline">${t('users.empty')}</div></td></tr>`;
      return;
    }
    tbody.innerHTML = members.map((m) => {
      const fullName = m.profiles?.full_name || displayNameFromEmail(m.profiles?.email || '');
      const userEmail = m.profiles?.email || '';
      const userRole = (m.role || '').toUpperCase();
      return `<tr><td>${escapeHtml(fullName)}</td><td>${escapeHtml(userEmail)}</td><td>${escapeHtml(userRole)}</td><td><span class="ok">${t('account.statusActive')}</span></td><td></td></tr>`;
    }).join('');
  } catch (_) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-inline">${t('users.empty')}</div></td></tr>`;
  }
}

function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.body.dataset.theme = nextTheme;
  localStorage.setItem(PLATFORM_STORAGE.theme, nextTheme);
}

function toggleTheme() {
  const current = document.body.dataset.theme === 'dark' ? 'dark' : 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

async function loginDemo(event) {
  event.preventDefault();
  const email = document.getElementById('login-email')?.value.trim() || '';
  const password = document.getElementById('login-password')?.value || '';
  if (!email || password.length < 4) {
    showToast('Ingresa un email valido y una clave de 4 caracteres como minimo.', 'error');
    return;
  }

  const sb = getSupabase();
  if (!sb) {
    showSupabaseConfigNotice();
    showToast('Configura Supabase antes de iniciar sesion.', 'error');
    return;
  }

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    showToast('Login Supabase fallo: ' + error.message, 'error');
    return;
  }

  state.platform.session = data.session;
  state.platform.user = data.user;
  await ensureProfile();
  await loadCompaniesFromSupabase();
  updateOrgUI();
  showCompanySelector();
}

async function continueAsDemo() {
  const email = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value || '';
  if (!email || password.length < 4) {
    showToast('Para crear cuenta ingresa email y password de 4+ caracteres.', 'error');
    return;
  }

  const sb = getSupabase();
  if (!sb) {
    showSupabaseConfigNotice();
    showToast('Configura Supabase antes de crear cuenta.', 'error');
    return;
  }

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { full_name: displayNameFromEmail(email) } },
  });

  if (error) {
    showToast('No se pudo crear cuenta: ' + error.message, 'error');
    return;
  }

  if (!data.session) {
    showToast('Cuenta creada. Revisa el email de confirmacion o desactiva confirmacion en Supabase para pruebas.', 'info');
    return;
  }

  state.platform.session = data.session;
  state.platform.user = data.user;
  await ensureProfile();
  await loadCompaniesFromSupabase();
  updateOrgUI();
  showCompanySelector();
}

async function logout() {
  if (state.cameraActive) stopCamera();
  await getSupabase()?.auth.signOut();
  state.platform.session = null;
  state.platform.user = null;
  state.platform.profile = null;
  localStorage.removeItem(PLATFORM_STORAGE.company);
  localStorage.removeItem(PLATFORM_STORAGE.companyId);
  localStorage.removeItem(PLATFORM_STORAGE.site);
  localStorage.removeItem(PLATFORM_STORAGE.siteId);
  setPlatformMode('auth-mode');
  showSupabaseConfigNotice();
  showToast('Sesion cerrada.', 'info');
}

async function showCompanySelector() {
  setPlatformMode('company-mode');
  await loadCompaniesFromSupabase();
  renderCompanies();
}

async function showSiteSelector() {
  if (!getSession()) {
    setPlatformMode('auth-mode');
    return;
  }
  if (!selectedCompany()) {
    showCompanySelector();
    return;
  }
  setPlatformMode('site-mode');
  await loadSitesFromSupabase();
  renderSites();
}

function backToCompanies() {
  localStorage.removeItem(PLATFORM_STORAGE.site);
  localStorage.removeItem(PLATFORM_STORAGE.siteId);
  showCompanySelector();
}

function renderCompanies() {
  const list = document.getElementById('company-list');
  if (!list) return;
  const query = (document.getElementById('company-search')?.value || '').trim().toLowerCase();
  const companies = state.platform.companies.filter((company) => company.name.toLowerCase().includes(query));

  list.innerHTML = companies.map((company) => `
    <button class="selector-item" type="button" onclick="chooseCompany('${company.id}')">
      <span class="k-mark">B</span>
      <span>${escapeHtml(company.name)}</span>
    </button>
  `).join('') || '<div class="empty-inline">No hay companias reales para este usuario. <button class="btn-primary compact" type="button" onclick="createCompanyFromPrompt()">Crear compania</button></div>';
}

async function chooseCompany(id) {
  const company = state.platform.companies.find((item) => item.id === id);
  if (!company) return;
  localStorage.setItem(PLATFORM_STORAGE.companyId, company.id);
  localStorage.setItem(PLATFORM_STORAGE.company, company.name);
  localStorage.removeItem(PLATFORM_STORAGE.site);
  localStorage.removeItem(PLATFORM_STORAGE.siteId);
  const siteSearch = document.getElementById('site-search');
  if (siteSearch) siteSearch.value = '';
  await loadSitesFromSupabase(company.id);
  showSiteSelector();
}

function renderSites() {
  const list = document.getElementById('site-list');
  const company = selectedCompany();
  if (!list || !company) return;

  const query = (document.getElementById('site-search')?.value || '').trim().toLowerCase();
  const sites = state.platform.sites.filter((site) => site.name.toLowerCase().includes(query));
  list.innerHTML = sites.map((site) => `
    <button class="selector-item" type="button" onclick="chooseSite('${encodeURIComponent(site.id)}')">
      <span class="k-mark">B</span>
      <span>${escapeHtml(site.name)}</span>
    </button>
  `).join('') || '<div class="empty-inline">No hay sedes reales para esta compania. <button class="btn-primary compact" type="button" onclick="createSiteFromPrompt()">Crear sede</button></div>';
}

async function chooseSite(encodedSite) {
  const siteId = decodeURIComponent(encodedSite);
  const site = state.platform.sites.find((item) => item.id === siteId);
  if (!site) return;
  localStorage.setItem(PLATFORM_STORAGE.siteId, site.id);
  localStorage.setItem(PLATFORM_STORAGE.site, site.name);
  setPlatformMode('app-ready');
  updateOrgUI();
  await refreshOperationalData();
  switchPanel('dashboard');
}

async function initPlatformShell() {
  applyTheme(localStorage.getItem(PLATFORM_STORAGE.theme) || 'light');
  applyTranslations();
  showSupabaseConfigNotice();

  const sb = getSupabase();
  if (!sb) {
    setPlatformMode('auth-mode');
    return;
  }

  const { data } = await sb.auth.getSession();
  state.platform.session = data.session;
  state.platform.user = data.session?.user || null;
  updateOrgUI();

  const session = getSession();
  if (!session) {
    setPlatformMode('auth-mode');
    return;
  }

  await ensureProfile();
  await loadCompaniesFromSupabase();

  if (!selectedCompany()) {
    showCompanySelector();
    return;
  }

  await loadSitesFromSupabase();

  if (!selectedSite()) {
    showSiteSelector();
    return;
  }

  setPlatformMode('app-ready');
  updateOrgUI();
  await refreshOperationalData();
  switchPanel('dashboard');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('SW registered'))
      .catch(() => console.log('SW not available'));

    refreshCameraDevices();
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshCameraDevices);
    }

  });
}

window.addEventListener('load', () => {
  loadManagementData();
  updateReportConfigUI();
  initPlatformShell();
  const dateInput = document.getElementById('history-date');
  if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
});
