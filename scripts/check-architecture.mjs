import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const baselinePath = path.join(root, '.architecture-baseline.json');
const writeBaseline = process.argv.includes('--write-baseline');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const thresholds = baseline.thresholds;
const ignored = baseline.ignored || [];

function matches(pattern, value) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
  return new RegExp(`^${escaped}$`).test(value);
}

function isIgnored(relative) {
  return ignored.some(pattern => matches(pattern, relative));
}

function collectFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    const relative = path.relative(root, full).replaceAll(path.sep, '/');
    if (entry.isDirectory()) {
      if (!isIgnored(`${relative}/`)) collectFiles(full, files);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !isIgnored(relative)) {
      files.push({ full, relative });
    }
  }
  return files;
}

function lineSpan(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line - sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
}

function functionName(node) {
  if (node.name?.getText) return node.name.getText();
  if (node.parent?.name?.getText && (ts.isMethodDeclaration(node.parent) || ts.isPropertyDeclaration(node.parent))) return node.parent.name.getText();
  return '<anonymous>';
}

function complexityAndDepth(sourceFile, node) {
  let complexity = 1;
  let maxDepth = 0;
  const control = new Set([
    ts.SyntaxKind.IfStatement, ts.SyntaxKind.ForStatement, ts.SyntaxKind.ForInStatement,
    ts.SyntaxKind.ForOfStatement, ts.SyntaxKind.WhileStatement, ts.SyntaxKind.DoStatement,
    ts.SyntaxKind.CatchClause, ts.SyntaxKind.ConditionalExpression, ts.SyntaxKind.CaseClause
  ]);
  function visit(current, depth) {
    const isControl = control.has(current.kind);
    const nextDepth = isControl ? depth + 1 : depth;
    if (isControl) {
      complexity += 1;
      maxDepth = Math.max(maxDepth, nextDepth);
    }
    if (ts.isBinaryExpression(current) && (current.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || current.operatorToken.kind === ts.SyntaxKind.BarBarToken || current.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) complexity += 1;
    ts.forEachChild(current, child => visit(child, nextDepth));
  }
  ts.forEachChild(node, child => visit(child, 0));
  return { complexity, maxDepth };
}

function inspectFile(file) {
  const source = fs.readFileSync(file.full, 'utf8');
  const kind = file.relative.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(file.relative, source, ts.ScriptTarget.Latest, true, kind);
  const metrics = { lines: source.split(/\r?\n/).length, functions: [] };
  function visit(node) {
    if (ts.isFunctionLike(node) && node.body) {
      const span = lineSpan(sourceFile, node);
      const { complexity, maxDepth } = complexityAndDepth(sourceFile, node);
      if (span > thresholds.functionLines || complexity > thresholds.complexity || maxDepth > thresholds.maxDepth) {
        metrics.functions.push({ name: functionName(node), lines: span, complexity, maxDepth });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return metrics;
}

const files = Object.fromEntries(collectFiles(path.join(root, 'src')).concat(collectFiles(path.join(root, 'server'))).map(file => [file.relative, inspectFile(file)]));

if (writeBaseline) {
  baseline.files = files;
  fs.writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`Wrote architecture baseline for ${Object.keys(files).length} production source files.`);
  process.exit(0);
}

const violations = [];
for (const [file, metrics] of Object.entries(files)) {
  const previous = baseline.files?.[file];
  const fileReview = metrics.lines > thresholds.fileLines;
  const previousFileReview = previous?.lines > thresholds.fileLines;
  if (fileReview && (!previous || !previousFileReview || metrics.lines > previous.lines)) {
    violations.push(`${file}: ${metrics.lines} lines (threshold ${thresholds.fileLines}; architectural review required)`);
  }
  for (const [index, fn] of metrics.functions.entries()) {
    // Anonymous route/component callbacks are common; compare by stable source
    // order rather than name so duplicate '<anonymous>' functions are not
    // mistaken for a regression.
    const old = previous?.functions?.[index];
    const isNewOrWorse = !old || fn.lines > old.lines || fn.complexity > old.complexity || fn.maxDepth > old.maxDepth;
    if (isNewOrWorse) violations.push(`${file} :: ${fn.name}: ${fn.lines} lines, complexity ${fn.complexity}, depth ${fn.maxDepth}`);
  }
}

if (violations.length > 0) {
  console.error('Architecture checks found new or worsened production-source violations:');
  for (const violation of violations) console.error(`- ${violation}`);
  console.error('Split by responsibility or add a reviewed exception/baseline update; do not split solely to game line counts.');
  process.exit(1);
}

console.log(`Architecture checks passed for ${Object.keys(files).length} production source files.`);
