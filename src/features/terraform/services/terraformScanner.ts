"use server";

import * as fs from "fs/promises";
import * as path from "path";
import { TerraformDirectory, TerraformFile, TfVariable, TfResource, TfOutput } from "../data/TerraformData";

/**
 * Basic Regex parser for Terraform contents
 */
function parseTerraformFileContent(filename: string, content: string): TerraformFile {
  const tfFile = new TerraformFile(filename);

  // Parse variables
  const varRegex = /variable\s+"([^"]+)"/g;
  let match;
  while ((match = varRegex.exec(content)) !== null) {
    tfFile.variables.push({ name: match[1] });
  }

  // Parse outputs
  const outRegex = /output\s+"([^"]+)"/g;
  while ((match = outRegex.exec(content)) !== null) {
    tfFile.outputs.push({ name: match[1] });
  }

  // Parse resources & data blocks
  const rscRegex = /(?:resource|data)\s+"([^"]+)"\s+"([^"]+)"/g;
  while ((match = rscRegex.exec(content)) !== null) {
    tfFile.resources.push({ type: match[1], name: match[2] });
  }

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
