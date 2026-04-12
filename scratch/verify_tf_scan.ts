import * as fs from "fs/promises";
import * as path from "path";
import { fetchTerraformStructure } from "./src/features/terraform/services/terraformScanner";

async function test() {
  const testDir1 = path.join(process.cwd(), "test-tf-1");
  const testDir2 = path.join(process.cwd(), "test-tf-2");

  await fs.mkdir(testDir1, { recursive: true });
  await fs.mkdir(testDir2, { recursive: true });

  await fs.writeFile(path.join(testDir1, "main.tf"), 'resource "null_resource" "test1" {}');
  await fs.writeFile(path.join(testDir2, "main.tf"), 'resource "null_resource" "test2" {}');

  process.env.TERRAFORM_ROOT_PATH = `${testDir1},${testDir2}`;

  console.log("Starting scan with multiple paths...");
  const result = await fetchTerraformStructure();

  if (result && result.name === "terraform" && result.childDirs.length === 2) {
    console.log("✅ Success: Virtual root 'terraform' created with 2 children.");
    console.log("Child 1 name:", result.childDirs[0].name);
    console.log("Child 2 name:", result.childDirs[1].name);
  } else {
    console.log("❌ Failure: Unexpected structure.");
    console.log(JSON.stringify(result, null, 2));
  }

  // Cleanup
  await fs.rm(testDir1, { recursive: true });
  await fs.rm(testDir2, { recursive: true });
}

test().catch(console.error);
