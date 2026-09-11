#!/usr/bin/env bun
/**
 * check-skill-discovery.ts
 *
 * Verifies that each skill under .agents/skills/ has a valid entry point:
 *   - Claude Code format: <name>/SKILL.md with frontmatter (name, description)
 *   - Kiro format: <name>.md with frontmatter (inclusion or name)
 *
 *   bun scripts/check-skill-discovery.ts
 *
 * Exit 0 if all good, 1 if any check fails.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const skillsDir = join(ROOT, '.agents', 'skills');
let failed = 0;

function fail(msg: string) {
  console.error(`  FAIL  ${msg}`);
  failed++;
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm: Record<string, string> = {};
  const lines = match[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    // Handle multi-line YAML: if value is empty, collect indented continuation lines
    if (!val) {
      const cont: string[] = [];
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].match(/^\s+(\S.*)/)) {
          cont.push(lines[j].trim());
        } else break;
      }
      val = cont.join(' ');
    }
    fm[key] = val;
  }
  return fm;
}

if (!existsSync(skillsDir)) {
  console.log('No .agents/skills/ directory — nothing to check.');
  process.exit(0);
}

// Check Claude Code format: <name>/SKILL.md
const subdirs = readdirSync(skillsDir).filter(d => {
  const st = statSync(join(skillsDir, d));
  return st.isDirectory();
});

for (const dir of subdirs) {
  const skillPath = join(skillsDir, dir, 'SKILL.md');
  if (!existsSync(skillPath)) {
    // Some dirs might not have SKILL.md (e.g. references for graphify)
    if (dir === 'graphify') {
      const graphifySkill = join(skillsDir, dir, 'SKILL.md');
      if (existsSync(graphifySkill)) {
        // Check frontmatter
        const fm = parseFrontmatter(readFileSync(graphifySkill, 'utf8'));
        if (!fm.name) fail(`skills/${dir}/SKILL.md: missing frontmatter 'name'`);
        if (!fm.description) fail(`skills/${dir}/SKILL.md: missing frontmatter 'description'`);
        else console.log(`  OK    skills/${dir}/SKILL.md`);
      }
    }
    continue;
  }
  const fm = parseFrontmatter(readFileSync(skillPath, 'utf8'));
  if (!fm.name) {
    fail(`skills/${dir}/SKILL.md: missing frontmatter 'name'`);
  } else if (fm.name !== dir) {
    fail(`skills/${dir}/SKILL.md: name '${fm.name}' != directory '${dir}'`);
  }
  if (!fm.description) {
    fail(`skills/${dir}/SKILL.md: missing frontmatter 'description'`);
  }
  if (fm.name && fm.description) {
    console.log(`  OK    skills/${dir}/SKILL.md`);
  }
}

// Check Kiro format: <name>.md (flat files)
const flatSkills = readdirSync(skillsDir).filter(f => {
  const st = statSync(join(skillsDir, f));
  return st.isFile() && f.endsWith('.md');
});

for (const file of flatSkills) {
  const fm = parseFrontmatter(readFileSync(join(skillsDir, file), 'utf8'));
  if (!fm.inclusion && !fm.name) {
    fail(`skills/${file}: missing frontmatter (expected 'inclusion' or 'name')`);
  } else {
    console.log(`  OK    skills/${file}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll skill discovery checks passed.');
