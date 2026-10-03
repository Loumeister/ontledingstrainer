// A local reporting preference only. The server still requires its own cookie.
const KEY = 'ontleedlab-student-access-mode';
export const prefersLocalPractice = () => localStorage.getItem(KEY) === 'local';
export function setStudentAccessPreference(enrolled: boolean) {
  localStorage.setItem(KEY, enrolled ? 'enrolled' : 'local');
}
