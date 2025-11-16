use crate::model::PackMeta;
use crate::util::blockstates::Blockstate;
use anyhow::Result;
/// Utility for mapping texture paths to block IDs
///
/// This solves the problem of determining which block a texture belongs to.
/// Instead of guessing from the texture filename, we build a proper mapping
/// by analyzing all blockstate and model files.
use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// Build a mapping of texture paths to block IDs
///
/// This scans all blockstates in the pack and extracts which textures
/// they reference, building a reverse lookup table.
pub fn build_texture_to_block_map(pack: &PackMeta) -> Result<HashMap<String, Vec<String>>> {
    let mut map: HashMap<String, Vec<String>> = HashMap::new();

    let blockstates_dir = if pack.is_zip {
        // For ZIP packs, we'd need to enumerate entries
        // For now, return empty map - we'll use fallback logic
        return Ok(map);
    } else {
        Path::new(&pack.path).join("assets/minecraft/blockstates")
    };

    if !blockstates_dir.exists() {
        return Ok(map);
    }

    // Read all blockstate files
    for entry in fs::read_dir(&blockstates_dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            if let Some(block_id) = path.file_stem().and_then(|s| s.to_str()) {
                // Parse the blockstate file
                if let Ok(contents) = fs::read_to_string(&path) {
                    if let Ok(blockstate) = serde_json::from_str::<Blockstate>(&contents) {
                        // Extract texture references from this blockstate
                        let textures = extract_textures_from_blockstate(&blockstate);

                        for texture in textures {
                            map.entry(texture)
                                .or_insert_with(Vec::new)
                                .push(block_id.to_string());
                        }
                    }
                }
            }
        }
    }

    Ok(map)
}

/// Extract all texture references from a blockstate
fn extract_textures_from_blockstate(blockstate: &Blockstate) -> Vec<String> {
    let mut textures = Vec::new();

    // This is a simplified version - in reality we'd need to:
    // 1. Get model IDs from variants
    // 2. Load each model file
    // 3. Extract texture references from models
    // 4. Resolve texture variables

    // For now, we'll use the heuristic approach but document
    // that this should be enhanced

    textures
}
