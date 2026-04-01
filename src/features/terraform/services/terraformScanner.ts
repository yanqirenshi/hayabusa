"use server";

import * as fs from "fs/promises";
import * as path from "path";
import { TerraformDirectory, TerraformFile } from "../data/TerraformData";

/**
 * Basic Regex parser for Terraform contents
 */
function parseTerraformFileContent(filename: string, content: string): TerraformFile {
  const tfFile = new TerraformFile(filename);

  let match;
  
  // Parse variables
  const varRegex = /variable\s+"([^"]+)"/g;
  while ((match = varRegex.exec(content)) !== null) {
    tfFile.variables.push({ blockType: "variable", index: match.index, name: match[1] });
  }

  // Parse outputs
  const outRegex = /output\s+"([^"]+)"/g;
  while ((match = outRegex.exec(content)) !== null) {
    tfFile.outputs.push({ blockType: "output", index: match.index, name: match[1] });
  }

  // Parse resources
  const rscRegex = /resource\s+"([^"]+)"\s+"([^"]+)"/g;
  while ((match = rscRegex.exec(content)) !== null) {
    tfFile.resources.push({ blockType: "resource", index: match.index, type: match[1], name: match[2] });
  }

  // Parse data
  const dataRegex = /data\s+"([^"]+)"\s+"([^"]+)"/g;
  while ((match = dataRegex.exec(content)) !== null) {
    tfFile.resources.push({ blockType: "data", index: match.index, type: match[1], name: match[2] });
  }

  // Parse module
  const modRegex = /module\s+"([^"]+)"/g;
  while ((match = modRegex.exec(content)) !== null) {
    tfFile.resources.push({ blockType: "module", index: match.index, type: "module", name: match[1] });
  }

  // Parse provider
  const provRegex = /provider\s+"([^"]+)"/g;
  while ((match = provRegex.exec(content)) !== null) {
    tfFile.resources.push({ blockType: "provider", index: match.index, name: match[1] });
  }

  // Parse locals
  const localsBlockRegex = /locals\s*{([^}]+)}/g;
  while ((match = localsBlockRegex.exec(content)) !== null) {
    const blockContent = match[1];
    const baseIndex = match.index; // Absolute index of the block Start
    
    // Find lines resembling `key = value` inside the local block
    const localKeyRegex = /^\s*([a-zA-Z0-9_-]+)\s*=/gm;
    let localMatch;
    while ((localMatch = localKeyRegex.exec(blockContent)) !== null) {
      // Calculate absolute index
      tfFile.resources.push({ blockType: "locals", index: baseIndex + localMatch.index, name: localMatch[1] });
    }
  }

  // Sort universally by absolute appearance index in the file
  tfFile.variables.sort((a, b) => a.index - b.index);
  tfFile.outputs.sort((a, b) => a.index - b.index);
  tfFile.resources.sort((a, b) => a.index - b.index);

  return tfFile;
}

/**
 * Recursively scans a given folder and ignores hidden folders like .git, .terraform
 */
async function scanDirectory(currentPath: string, dirName: string): Promise<TerraformDirectory | null> {
  // Exclude common heavy/unnecessary hidden folders
  if (dirName.startsWith(".") || dirName === "node_modules") {
    return null;
  }

  try {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    
    const childDirs: TerraformDirectory[] = [];
    const parsedFiles: TerraformFile[] = [];

    for (const entry of entries) {
      const fullChildPath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        const childNode = await scanDirectory(fullChildPath, entry.name);
        if (childNode) {
          childDirs.push(childNode);
        }
      } else if (entry.isFile() && entry.name.endsWith(".tf")) {
        // Parse the Terraform configuration file
        const fileContent = await fs.readFile(fullChildPath, "utf-8");
        const parsedFile = parseTerraformFileContent(entry.name, fileContent);
        parsedFiles.push(parsedFile);
      }
    }

    return new TerraformDirectory(dirName, currentPath, childDirs, parsedFiles);
  } catch (error) {
    console.error(`Error scanning directory ${currentPath}:`, error);
    return null;
  }
}

/**
 * Fetches the base folder tree structure for the specified Terraform root path
 */
export async function fetchTerraformStructure(): Promise<TerraformDirectory | null> {
  const rootPath = process.env.TERRAFORM_ROOT_PATH;

  if (!rootPath) {
    console.warn("⚠️ TERRAFORM_ROOT_PATH is not configured in .env.local.");
    return null;
  }

  try {
    const stat = await fs.stat(rootPath);
    if (!stat.isDirectory()) {
      throw new Error("Specified path is not a directory");
    }

    const rootDirName = path.basename(rootPath);
    const result = await scanDirectory(rootPath, rootDirName);
    
    if (!result) {
      throw new Error("Could not parse root directory tree.");
    }

    return result;
  } catch (error: any) {
    console.error("Terraform scan error:", error.message);
    throw new Error(`Failed to scan Terraform directory: ${error.message}`);
  }
}
