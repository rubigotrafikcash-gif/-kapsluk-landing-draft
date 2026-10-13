/** Обрабатываем только текстовые строки, не HTML/URL/код. Идемпотентно. */
export function typo(value:string):string {
  return value.split(/(https?:\/\/\S+|<[^>]*>|`[^`]*`|\[[^\]]*\])/g).map((part,i)=>i%2?part:part
    .replace(/ (?=—)/g,'\u00a0')
    .replace(/(^|[\s\u00a0])([А-Яа-яЁё]{1,2})(?=[ \u00a0])/g,'$1$2\u00a0')
    .replace(/([0-9]) (?=[А-Яа-яЁё%])/g,'$1\u00a0')).join('');
}
