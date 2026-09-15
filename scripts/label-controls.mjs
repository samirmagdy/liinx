import ts from 'typescript';
import fs from 'node:fs';
const filename = process.argv[2], source = fs.readFileSync(filename, 'utf8');
const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const changes = [];
function visit(node) {
  if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
    const tag = node.tagName.getText(file);
    const attrs = node.attributes.properties;
    const get = name => attrs.find(a => ts.isJsxAttribute(a) && a.name.getText(file) === name);
    if (['input','textarea','select'].includes(tag) && !get('aria-label') && !get('id') && get('type')?.initializer?.getText(file) !== '"hidden"') {
      let parent = node.parent, label;
      for (let depth=0; parent && depth<4; depth++,parent=parent.parent) {
        if (ts.isJsxElement(parent)) label = parent.children.find(child => ts.isJsxElement(child) && child.openingElement.tagName.getText(file) === 'label');
        if (label) break;
      }
      const expression = label?.children.find(child => ts.isJsxExpression(child))?.expression;
      let value = expression ? '{' + expression.getText(file) + '}' : undefined;
      if (!value && get('placeholder')?.initializer) {
        const placeholder = get('placeholder').initializer.getText(file);
        value = /https|www\./.test(placeholder) ? '{ui("Destination URL")}' : placeholder;
      }
      if (value) {
        const pos = node.tagName.end;
        const lineStart = source.lastIndexOf('\n',pos-1)+1, lineEnd = source.indexOf('\n',pos);
        const before = source.slice(lineStart,lineEnd < 0 ? source.length : lineEnd);
        const after = before.slice(0,pos-lineStart) + ' aria-label=' + value + before.slice(pos-lineStart);
        changes.push('@@\n-' + before + '\n+' + after);
      }
    }
  }
  ts.forEachChild(node,visit);
}
visit(file);
if(changes.length) console.log('*** Begin Patch\n*** Update File: '+filename+'\n'+changes.join('\n')+'\n*** End Patch');
