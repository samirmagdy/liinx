// One-time, syntax-aware migration. Emits a patch; never mutates source files.
import ts from 'typescript';
import fs from 'node:fs';
const filename = process.argv[2];
const source = fs.readFileSync(filename, 'utf8');
const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const edits = [];
const used = new Set();
const expressionsOnly = process.argv[3] === 'expressions';
const decode = text => text.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&nbsp;/g, ' ');
function visit(node, component) {
  if ((ts.isFunctionDeclaration(node) && /^[A-Z]/.test(node.name?.text || '')) ||
      (ts.isArrowFunction(node) && ts.isVariableDeclaration(node.parent) && /^[A-Z]/.test(node.parent.name.getText(file)))) component = node;
  if (component && ts.isBlock(component.body)) {
    let text;
    if (!expressionsOnly && ts.isJsxText(node)) {
      text = decode(node.text.replace(/\s+/g, ' ').trim());
      if (/[A-Za-z]/.test(text) && !/^(https?:|curl |&nbsp;|\/api|#|raloa\.|links\.)/.test(text)) {
        edits.push({ start: node.getStart(file), end: node.end, value: `{ui(${JSON.stringify(text)})}` });
        used.add(component);
      }
    }
    if (!expressionsOnly && ts.isJsxAttribute(node) && ['placeholder', 'title', 'aria-label', 'alt'].includes(node.name.getText(file)) && node.initializer && ts.isStringLiteral(node.initializer)) {
      text = decode(node.initializer.text);
      if (/[A-Za-z]/.test(text) && !/^(https?:|.*@|#)/.test(text)) {
        edits.push({ start: node.initializer.getStart(file), end: node.initializer.end, value: `{ui(${JSON.stringify(text)})}` }); used.add(component);
      }
    }
    if (expressionsOnly && ts.isStringLiteral(node) && ts.isConditionalExpression(node.parent) && node !== node.parent.condition && /[A-Za-z]/.test(node.text)) {
      let ancestor = node.parent;
      while (ancestor && !ts.isJsxExpression(ancestor) && !(ts.isCallExpression(ancestor) && ['ui', 'tr'].includes(ancestor.expression.getText(file)))) ancestor = ancestor.parent;
      if (ancestor && ts.isJsxExpression(ancestor) && !ts.isJsxAttribute(ancestor.parent)) {
        edits.push({ start: node.getStart(file), end: node.end, value: `ui(${JSON.stringify(node.text)})` });
      }
    }
  }
  ts.forEachChild(node, child => visit(child, component));
}
visit(file);
if (!edits.length) process.exit(0);
for (const component of used) edits.push({ start: component.body.getStart(file) + 1, end: component.body.getStart(file) + 1, value: '\n  const { tr: ui } = useUiLanguage();' });
if (!expressionsOnly) edits.push({ start: 0, end: 0, value: "import { useLanguage as useUiLanguage } from '../context/LanguageContext';\n" });
const groups = [];
for (const edit of edits.sort((a,b) => a.start - b.start)) {
  const start = source.lastIndexOf('\n', Math.max(0, edit.start - 1)) + 1;
  const newline = source.indexOf('\n', edit.end);
  const end = newline < 0 ? source.length : newline;
  const previous = groups.at(-1);
  if (previous && start <= previous.end) { previous.end = Math.max(end, previous.end); previous.edits.push(edit); }
  else groups.push({ start, end, edits: [edit] });
}
const chunks = groups.map(group => {
  const before = source.slice(group.start, group.end);
  let after = before;
  for (const edit of group.edits.sort((a,b) => b.start - a.start)) after = after.slice(0,edit.start-group.start) + edit.value + after.slice(edit.end-group.start);
  return '@@\n' + before.split('\n').map(x=>'-'+x).join('\n') + '\n' + after.split('\n').map(x=>'+'+x).join('\n');
});
console.log('*** Begin Patch\n*** Update File: ' + filename + '\n' + chunks.join('\n') + '\n*** End Patch');
