#!/usr/bin/env node
// Concatenates docs/report/chapters/*.md in order and converts to a single .docx via pandoc.
import { execFileSync } from "node:child_process";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const reportDir = dirname(dirname(fileURLToPath(import.meta.url)));
const chaptersDir = join(reportDir, "chapters");
const distDir = join(reportDir, "dist");
const combinedPath = join(distDir, "_combined.md");
const outputPath = join(distDir, "TicketVerse-Project-Report.docx");

function assertPandocAvailable() {
  try {
    execFileSync("pandoc", ["--version"], { stdio: "ignore" });
  } catch {
    console.error(
      "pandoc is required but was not found on PATH. Install it with `brew install pandoc` and re-run this script.",
    );
    process.exit(1);
  }
}

function combineChapters() {
  const files = readdirSync(chaptersDir)
    .filter((name) => name.endsWith(".md"))
    .sort();

  if (files.length === 0) {
    console.error(`No chapter files found in ${chaptersDir}`);
    process.exit(1);
  }

  const combined = files
    .map((name) => readFileSync(join(chaptersDir, name), "utf8").trimEnd())
    .join("\n\n\\newpage\n\n");

  mkdirSync(distDir, { recursive: true });
  writeFileSync(combinedPath, combined, "utf8");
  return files;
}

function convertToDocx() {
  const referenceDoc = join(reportDir, "template", "reference.docx");
  const args = [
    combinedPath,
    "-o",
    outputPath,
    "--from",
    "markdown+multiline_tables",
    "--table-of-contents",
    "--resource-path",
    reportDir,
  ];
  if (existsSync(referenceDoc)) {
    args.push("--reference-doc", referenceDoc);
  }
  execFileSync("pandoc", args, { stdio: "inherit" });
}

assertPandocAvailable();
if (!existsSync(chaptersDir)) {
  console.error(`Chapters directory not found: ${chaptersDir}`);
  process.exit(1);
}
const files = combineChapters();
convertToDocx();
console.log(`Built ${outputPath} from ${files.length} chapter file(s).`);
