#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const groupConfigs = require('../group-configs.json');

/**
 * Recursive deep merge utility
 * - Overrides primitives (string, number, boolean, null, undefined) with right value
 * - Merges objects recursively
 * - Merges arrays by concatenating them
 * 
 * @param {any} left - The left object (base)
 * @param {any} right - The right object (overrides)
 * @returns {any} - The merged result
 */
function deepMerge(left, right) {
  // If right is null or undefined, return left
  if (right === null || right === undefined) {
    return left;
  }

  // If left is null or undefined, return right
  if (left === null || left === undefined) {
    return right;
  }

  // If right is a primitive, override with right value
  if (typeof right !== 'object' || right instanceof Date || right instanceof RegExp) {
    return right;
  }

  // If right is an array, merge arrays
  if (Array.isArray(right)) {
    if (Array.isArray(left)) {
      // Concatenate arrays, with right values taking precedence for duplicates
      return [...left, ...right];
    }
    return right;
  }

  // If left is not an object or is an array, return right
  if (typeof left !== 'object' || Array.isArray(left)) {
    return right;
  }

  // Both are objects, merge recursively
  const result = { ...left };
  
  for (const key in right) {
    if (Object.prototype.hasOwnProperty.call(right, key)) {
      if (key in result && typeof result[key] === 'object' && typeof right[key] === 'object' &&
          !Array.isArray(result[key]) && !Array.isArray(right[key]) &&
          result[key] !== null && right[key] !== null) {
        // Both are objects, merge recursively
        result[key] = deepMerge(result[key], right[key]);
      } else {
        // Override or set new value
        result[key] = right[key];
      }
    }
  }

  return result;
}

// Helper function to convert object to an object literal
// Note: Strings prefixed with $ are treated as variable references (e.g., '$identifier' -> identifier)
function objectToJSLiteral(obj, indent = 0) {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj === 'string') {
    // If string starts with $, treat it as a variable reference
    if (obj.startsWith('$')) {
      return obj.substring(1); // Remove the $ prefix
    }
    return JSON.stringify(obj);
  }
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const itemIndent = indent + 2;
    const items = obj.map(item => {
      // Generate the item - for primitives, this returns unindented
      // For objects/arrays, this returns with proper nested indentation
      const itemStr = objectToJSLiteral(item, itemIndent);
      const lines = itemStr.split('\n');
      
      if (lines.length === 1) {
        // Single line item (primitive or simple value) - add base indentation
        const indented = ' '.repeat(itemIndent) + lines[0].trimStart();
        return indented;
      }
      
      // Multi-line item (object or array) - ensure first line is at itemIndent
      // The recursive call may have already indented it, but we need to verify
      const firstLine = lines[0];
      const firstLineIndentMatch = firstLine.match(/^\s*/);
      const firstLineIndent = firstLineIndentMatch ? firstLineIndentMatch[0].length : 0;
      
      if (firstLineIndent === itemIndent) {
        // Already correctly indented - return as-is
        return itemStr;
      } else {
        // Need to adjust - trim first line and add correct indentation
        const adjustedFirstLine = ' '.repeat(itemIndent) + firstLine.trimStart();
        return [adjustedFirstLine, ...lines.slice(1)].join('\n');
      }
    });
    return `[\n${items.join(',\n')}\n${' '.repeat(indent)}]`;
  }
      
  const entries = Object.entries(obj);
  if (entries.length === 0) return '{}';
      
  const spaces = ' '.repeat(indent);
  const formattedEntries = entries.map(([key, value]) => {
    // Check if key needs quotes (not a valid identifier)
    const needsQuotes = !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
    const keyStr = needsQuotes ? JSON.stringify(key) : key;
        
    let valueStr;
    if (Array.isArray(value)) {
      // For arrays, pass indent (not indent + 2) so items end up at indent + 2
      valueStr = objectToJSLiteral(value, indent);
    } else if (typeof value === 'object' && value !== null) {
      valueStr = objectToJSLiteral(value, indent + 2);
    } else {
      valueStr = objectToJSLiteral(value, indent + 2);
    }
        
    // If value is multi-line, put opening brace on same line as key
    const valueLines = valueStr.split('\n');
    if (valueLines.length === 1) {
      // Single line value
      return `${spaces}${keyStr}: ${valueStr}`;
    }
    
    // Multi-line value - opening brace on same line as key
    // Remove leading spaces from first line (it's just the opening brace)
    const firstValueLine = valueLines[0].trimStart();
    const middleLines = valueLines.slice(1, -1); // All lines except first and last
    const lastLine = valueLines[valueLines.length - 1];
    
    // Last line is the closing brace - it should align with the key (at `indent` spaces)
    const closingBrace = ' '.repeat(indent) + lastLine.trimStart();
    
    return `${spaces}${keyStr}: ${firstValueLine}\n${middleLines.join('\n')}\n${closingBrace}`;
  });
      
  // Opening brace, entries, and closing brace all at same indent level
  return `${spaces}{\n${formattedEntries.join(',\n')}\n${spaces}}`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let targetPath = null;
  let groupName = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--group' || args[i] === '-g') {
      if (i + 1 < args.length) {
        groupName = args[i + 1];
        i++; // Skip the next argument as it's the group name
      } else {
        console.error('Error: --group requires a value');
        process.exit(1);
      }
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Usage: ${path.basename(process.argv[1])} [path] --group <group-name>

Arguments:
  path              Target path where to set up the project (required)
  --group, -g       Group name from group-configs.json (required)

Example:
  ${path.basename(process.argv[1])} ./my-project --group groupe1
      `);
      process.exit(0);
    } else if (!args[i].startsWith('-')) {
      // Positional argument (path)
      if (targetPath === null) {
        targetPath = args[i];
      } else {
        console.error(`Error: Unexpected argument: ${args[i]}`);
        console.error('Use --help for usage information');
        process.exit(1);
      }
    } else {
      console.error(`Error: Unknown option: ${args[i]}`);
      console.error('Use --help for usage information');
      process.exit(1);
    }
  }

  return { targetPath, groupName };
}

async function main() {
  try {
    const { targetPath, groupName } = parseArgs();

    if (!targetPath) {
      console.error('Error: Target path is required');
      console.error('Usage: ./script/setup.js [path] --group <group-name>');
      console.error('Use --help for more information');
      process.exit(1);
    }

    if (!groupName) {
      console.error('Error: --group option is required');
      console.error('Usage: ./script/setup.js [path] --group <group-name>');
      console.error('Use --help for more information');
      process.exit(1);
    }

    const resolvedTargetPath = path.resolve(targetPath);
    if (!fs.existsSync(resolvedTargetPath)) {
      console.error(`Error: Target path does not exist: ${resolvedTargetPath}`);
      process.exit(1);
    }

    if (!groupConfigs[groupName]) {
      console.error(`Error: Group "${groupName}" not found in group-configs.json`);
      console.error(`Available groups: ${Object.keys(groupConfigs).join(', ')}`);
      process.exit(1);
    }

    const groupConfig = groupConfigs[groupName];
    console.log(`Using group config: ${JSON.stringify(groupConfig, null, 2)}`);

    // Copy .eas folder
    // eslint-disable-next-line no-undef
    const easSourcePath = path.join(__dirname, '..', '.eas');
    const easTargetPath = path.join(resolvedTargetPath, '.eas');
    
    if (fs.existsSync(easSourcePath)) {
      console.log('Copying .eas folder...');
      if (fs.existsSync(easTargetPath)) {
        fs.rmSync(easTargetPath, { recursive: true, force: true });
      }
      fs.cpSync(easSourcePath, easTargetPath, { recursive: true });
      console.log('✓ .eas folder copied');
    } else {
      console.warn('Warning: .eas folder not found in source');
    }

    // Copy eas.json
    // eslint-disable-next-line no-undef
    const easJsonSourcePath = path.join(__dirname, '..', 'eas.json');
    const easJsonTargetPath = path.join(resolvedTargetPath, 'eas.json');
    
    if (fs.existsSync(easJsonSourcePath)) {
      console.log('Copying eas.json...');
      fs.copyFileSync(easJsonSourcePath, easJsonTargetPath);
      console.log('✓ eas.json copied');
    } else {
      console.warn('Warning: eas.json not found in source');
    }

    // Install required dependencies
    console.log('Installing expo-dev-client and expo-updates...');
    try {
      execSync('npx expo install expo-dev-client expo-updates', {
        cwd: resolvedTargetPath,
        stdio: 'inherit'
      });
      console.log('✓ Packages installed');
    } catch (error) {
      console.error('Error installing packages:', error.message);
      process.exit(1);
    }

    // Replace app config
    const appJsonPath = path.join(resolvedTargetPath, 'app.json');
    const appConfigTsPath = path.join(resolvedTargetPath, 'app.config.ts');

    if (!fs.existsSync(appJsonPath)) {
      console.error(`Error: app.json not found in target path: ${appJsonPath}`);
      process.exit(1);
    }

    console.log('Reading app.json...');
    const appJsonContent = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const prevExpoConfig = appJsonContent.expo || {};

    const { owner, slug, projectId } = groupConfig;

    const newExpoConfig = deepMerge(prevExpoConfig, {
      owner,
      slug,
      ios: {
        bundleIdentifier: '$identifier',
        config: {
          usesNonExemptEncryption: false
        }
      },
      android: {
        package: '$identifier',
      },
      updates: {
        url: `https://u.expo.dev/${projectId}`
      },
      runtimeVersion: {
        policy: "fingerprint"
      },
      extra: {
        router: {},
        eas: {
          projectId
        }
      },
    });

    const indentedConfig = objectToJSLiteral(newExpoConfig, 4);

    const templateContent = `import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const baseIdentifier = "fr.gobelins.${slug}";
  const identifier = process.env.APP_VARIANT === "development" ? \`\${baseIdentifier}.dev\` : baseIdentifier;

  return {
    ...config,
${indentedConfig.split('\n').slice(1, -1).join('\n')}
  }
};
`

    // Write the new app.config.ts
    console.log('Writing app.config.ts...');
    fs.writeFileSync(appConfigTsPath, templateContent, 'utf8');
    console.log('✓ app.config.ts created');

    // Remove app.json
    console.log('Removing app.json...');
    fs.unlinkSync(appJsonPath);
    console.log('✓ app.json removed');

    console.log('\n✓ Setup completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
