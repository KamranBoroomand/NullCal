#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const ROOT = path.resolve(process.cwd(), 'src');
const hookNames = new Set(['useEffect', 'useMemo', 'useCallback', 'useLayoutEffect']);

const collectFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
};

const getDeclarationNames = (decl) => {
  if (ts.isIdentifier(decl.name)) {
    return [decl.name.text];
  }
  if (ts.isObjectBindingPattern(decl.name) || ts.isArrayBindingPattern(decl.name)) {
    const names = [];
    for (const element of decl.name.elements) {
      if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
        names.push(element.name.text);
      }
    }
    return names;
  }
  return [];
};

const collectIdentifiers = (node, list) => {
  if (ts.isIdentifier(node)) {
    list.push(node);
  }
  ts.forEachChild(node, (child) => collectIdentifiers(child, list));
};

const checkFunction = (node, sourceFile, errors) => {
  const declarations = new Map();

  const collectDecls = (current) => {
    if (ts.isFunctionLike(current) && current !== node) {
      return;
    }
    if (ts.isVariableDeclarationList(current)) {
      const isConst = (current.flags & ts.NodeFlags.Const) !== 0;
      const isLet = (current.flags & ts.NodeFlags.Let) !== 0;
      if (isConst || isLet) {
        for (const decl of current.declarations) {
          for (const name of getDeclarationNames(decl)) {
            if (!declarations.has(name)) {
              declarations.set(name, decl.pos);
            }
          }
        }
      }
    }
    ts.forEachChild(current, collectDecls);
  };

  const findHookCalls = (current) => {
    if (ts.isFunctionLike(current) && current !== node) {
      return;
    }
    if (ts.isCallExpression(current)) {
      if (ts.isIdentifier(current.expression) && hookNames.has(current.expression.text)) {
        const args = current.arguments;
        if (args.length >= 2 && ts.isArrayLiteralExpression(args[1])) {
          const identifiers = [];
          collectIdentifiers(args[1], identifiers);
          for (const identifier of identifiers) {
            const name = identifier.text;
            const declPos = declarations.get(name);
            if (declPos !== undefined && declPos > current.pos) {
              const { line, character } = sourceFile.getLineAndCharacterOfPosition(identifier.getStart());
              errors.push(
                `${sourceFile.fileName}:${line + 1}:${character + 1} dependency '${name}' declared later in same scope`
              );
            }
          }
        }
      }
    }
    ts.forEachChild(current, findHookCalls);
  };

  collectDecls(node);
  findHookCalls(node);
};

const errors = [];
const files = collectFiles(ROOT);
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    content,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const visit = (node) => {
    if (ts.isFunctionLike(node)) {
      checkFunction(node, sourceFile, errors);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

if (errors.length) {
  console.error('Hook dependency order check failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}
