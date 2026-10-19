import { cp, writeFile } from 'node:fs/promises';
await Promise.all(
  ['demo', 'css', 'js'].map((path) => cp(path, `dist-demo/${path}`, { recursive: true })),
);
await writeFile(
  'dist-demo/index.html',
  '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./showcase/"><title>Qing Steel React</title><a href="./showcase/">打开组件展示</a></html>',
);
