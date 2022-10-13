rm -rf ./types;
npx tsc --emitDeclarationOnly --declaration --allowJs --declarationDir ./types;
sed -i 's/\(\s*\)import \(.*\) from "\(.*\)";/\1import * as \2 from "\3";\n\1export import \2 = \2;/g' ./types/index.d.ts;
sed -i '$ d' ./types/index.d.ts;
rm -rf ./types/dist;