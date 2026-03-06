const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));

const replacements = [
  // backgrounds
  [/(?<!dark:)\bbg-slate-950\b/g, 'bg-slate-50 dark:bg-slate-950'],
  [/(?<!dark:)\bbg-slate-900\b/g, 'bg-white dark:bg-slate-900'],
  [/(?<!dark:)\bbg-slate-800(\/[0-9]+)?\b/g, 'bg-slate-100$1 dark:bg-slate-800$1'],
  [/(?<!dark:)\bbg-stone-900(\/[0-9]+)?\b/g, 'bg-white dark:bg-stone-900$1'],
  [/(?<!dark:)\bbg-slate-700(\/[0-9]+)?\b/g, 'bg-slate-200$1 dark:bg-slate-700$1'],
  
  // borders
  [/(?<!dark:)\bborder-slate-800(\/[0-9]+)?\b/g, 'border-slate-200$1 dark:border-slate-800$1'],
  [/(?<!dark:)\bborder-slate-700(\/[0-9]+)?\b/g, 'border-slate-300$1 dark:border-slate-700$1'],
  [/(?<!dark:)\bborder-stone-800(\/[0-9]+)?\b/g, 'border-slate-200$1 dark:border-stone-800$1'],

  // text
  [/(?<!dark:)\btext-slate-100\b/g, 'text-slate-900 dark:text-slate-100'],
  [/(?<!dark:)\btext-slate-200\b/g, 'text-slate-800 dark:text-slate-200'],
  [/(?<!dark:)\btext-slate-300\b/g, 'text-slate-700 dark:text-slate-300'],
  [/(?<!dark:)\btext-slate-400\b/g, 'text-slate-600 dark:text-slate-400'],
  [/(?<!dark:)\btext-slate-500\b/g, 'text-slate-500 dark:text-slate-500'], // Keep 500 equivalentish but add dark variant
  [/(?<!dark:)\btext-stone-200\b/g, 'text-slate-800 dark:text-stone-200'],

  // shadow
  [/(?<!dark:)\bshadow-blue-900(\/[0-9]+)?\b/g, 'shadow-blue-200$1 dark:shadow-blue-900$1'],
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  replacements.forEach(([regex, replaceWith]) => {
    content = content.replace(regex, replaceWith);
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
