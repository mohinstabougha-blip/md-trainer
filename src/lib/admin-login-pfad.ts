// Pfad der Admin-Anmeldeseite. Bewusst nicht unter /admin/... – etwas weniger
// auffällig als /admin/login. Eigene Datei ohne Node-Imports, damit sie auch in
// Client-Komponenten und in der Middleware genutzt werden kann.
export const ADMIN_LOGIN_PFAD = "/kp-team-anmeldung";
