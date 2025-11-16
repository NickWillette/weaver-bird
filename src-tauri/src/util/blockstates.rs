/// Utility for reading and resolving Minecraft blockstate files
///
/// Blockstates are the entry point for block rendering. They map block states
/// to specific models, which may have variants or multipart definitions.
use crate::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// A blockstate file structure
///
/// Example: assets/minecraft/blockstates/dirt.json
/// Can have either "variants" or "multipart" (or both in newer versions)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Blockstate {
    /// Variant-based blockstates (most common)
    /// Maps state combinations to models
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variants: Option<HashMap<String, BlockstateVariant>>,

    /// Multipart blockstates (for complex blocks like fences)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub multipart: Option<Vec<MultipartCase>>,
}

/// A variant can be a single model or an array of weighted options
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum BlockstateVariant {
    Single(ModelReference),
    Multiple(Vec<ModelReference>),
}

/// Reference to a model with optional transformations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelReference {
    /// Model path (e.g., "minecraft:block/dirt")
    pub model: String,

    /// X-axis rotation (0, 90, 180, 270)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub x: Option<i32>,

    /// Y-axis rotation (0, 90, 180, 270)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub y: Option<i32>,

    /// UV lock for rotations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uvlock: Option<bool>,

    /// Weight for random selection
    #[serde(skip_serializing_if = "Option::is_none")]
    pub weight: Option<i32>,
}

/// A multipart case with conditional model application
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultipartCase {
    /// Condition for this part to be applied
    #[serde(skip_serializing_if = "Option::is_none")]
    pub when: Option<serde_json::Value>,

    /// Model(s) to apply if condition matches
    pub apply: BlockstateVariant,
}

/// Read a blockstate file from a resource pack
///
/// # Arguments
/// * `pack_path` - Path to the resource pack
/// * `block_id` - Block ID without "minecraft:" prefix (e.g., "dirt", "stone")
/// * `is_zip` - Whether the pack is a ZIP file
///
/// # Returns
/// The parsed Blockstate structure
pub fn read_blockstate(pack_path: &Path, block_id: &str, is_zip: bool) -> AppResult<Blockstate> {
    // Blockstates are at: assets/minecraft/blockstates/{block_id}.json
    let relative_path = format!("assets/minecraft/blockstates/{}.json", block_id);

    let contents = if is_zip {
        // Read from ZIP archive
        let zip_path_str = pack_path
            .to_str()
            .ok_or_else(|| AppError::validation("Invalid pack path"))?;

        let bytes = crate::util::zip::extract_zip_entry(zip_path_str, &relative_path)
            .map_err(|e| AppError::validation(format!("Blockstate not found in ZIP: {}", e)))?;

        String::from_utf8(bytes)
            .map_err(|e| AppError::validation(format!("Invalid UTF-8 in blockstate: {}", e)))?
    } else {
        // Read from directory
        let full_path = pack_path.join(&relative_path);

        if !full_path.exists() {
            return Err(AppError::validation(format!(
                "Blockstate not found: {}",
                relative_path
            )));
        }

        fs::read_to_string(&full_path)
            .map_err(|e| AppError::io(format!("Failed to read blockstate file: {}", e)))?
    };

    let blockstate: Blockstate = serde_json::from_str(&contents)
        .map_err(|e| AppError::validation(format!("Invalid blockstate JSON: {}", e)))?;

    Ok(blockstate)
}

/// Get the default model for a block (from the "" or "normal" variant)
///
/// Most blocks have a default state represented by an empty string key
/// For multipart blocks (fences, walls, etc.), returns the first unconditional part
pub fn get_default_model(blockstate: &Blockstate) -> Option<String> {
    if let Some(variants) = &blockstate.variants {
        // Try empty string first (most common)
        if let Some(variant) = variants.get("") {
            return extract_first_model(variant);
        }

        // Try "normal" as fallback (older format)
        if let Some(variant) = variants.get("normal") {
            return extract_first_model(variant);
        }

        // If neither exists, just return the first variant
        if let Some((_, variant)) = variants.iter().next() {
            return extract_first_model(variant);
        }
    }

    // For multipart blocks (fences, walls, glass panes, etc.)
    // Return the first part without conditions, or the first part overall
    if let Some(multipart) = &blockstate.multipart {
        // First try to find an unconditional part (no "when" clause)
        for part in multipart {
            if part.when.is_none() {
                return extract_first_model(&part.apply);
            }
        }

        // If all parts are conditional, just return the first one
        if let Some(first_part) = multipart.first() {
            return extract_first_model(&first_part.apply);
        }
    }

    None
}

/// Extract the first model reference from a variant
fn extract_first_model(variant: &BlockstateVariant) -> Option<String> {
    match variant {
        BlockstateVariant::Single(model_ref) => Some(model_ref.model.clone()),
        BlockstateVariant::Multiple(models) => models.first().map(|m| m.model.clone()),
    }
}

/// Convert a texture ID to a blockstate block ID
///
/// "minecraft:block/dirt" -> "dirt"
/// "minecraft:block/amethyst_block1" -> "amethyst_block" (strips variant suffix)
/// "minecraft:block/acacia_log_top" -> "acacia_log" (strips texture part suffix)
/// "minecraft:item/stick" -> None (not a block)
pub fn texture_id_to_block_id(texture_id: &str) -> Option<String> {
    // Remove "minecraft:" prefix if present
    let without_namespace = texture_id.strip_prefix("minecraft:").unwrap_or(texture_id);

    // Check if it's a block texture
    if let Some(block_path) = without_namespace.strip_prefix("block/") {
        let mut block_id = block_path.to_string();

        // Strip common texture part suffixes (these are texture variants, not separate blocks)
        // e.g., "acacia_log_top" -> "acacia_log"
        let texture_suffixes = [
            "_top", "_bottom", "_side", "_front", "_back", "_end", "_north", "_south", "_east",
            "_west", "_up", "_down", "_inner", "_outer", "_upper", "_lower", "_0", "_1", "_2",
            "_3", "_4", "_5", // Stage variants
        ];

        for suffix in &texture_suffixes {
            if block_id.ends_with(suffix) {
                block_id = block_id.strip_suffix(suffix).unwrap().to_string();
                break;
            }
        }

        // Strip variant suffixes (numbers at the end that aren't preceded by underscore)
        // e.g., "amethyst_block1" -> "amethyst_block"
        // This handles texture variants like dirt0, dirt1, etc.
        if let Some(last_char) = block_id.chars().last() {
            if last_char.is_ascii_digit() && !block_id.ends_with('_') {
                // Find where the trailing digits start
                let trimmed = block_id.trim_end_matches(|c: char| c.is_ascii_digit());
                block_id = trimmed.to_string();
            }
        }

        Some(block_id)
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_texture_id_to_block_id() {
        assert_eq!(
            texture_id_to_block_id("minecraft:block/dirt"),
            Some("dirt".to_string())
        );
        assert_eq!(
            texture_id_to_block_id("block/stone"),
            Some("stone".to_string())
        );
        assert_eq!(texture_id_to_block_id("minecraft:item/stick"), None);

        // Test variant stripping
        assert_eq!(
            texture_id_to_block_id("minecraft:block/amethyst_block1"),
            Some("amethyst_block".to_string())
        );
        assert_eq!(
            texture_id_to_block_id("minecraft:block/dirt0"),
            Some("dirt".to_string())
        );
        assert_eq!(
            texture_id_to_block_id("minecraft:block/stone123"),
            Some("stone".to_string())
        );

        // Test texture part suffix stripping
        assert_eq!(
            texture_id_to_block_id("minecraft:block/acacia_log_top"),
            Some("acacia_log".to_string())
        );
        assert_eq!(
            texture_id_to_block_id("minecraft:block/oak_log_top"),
            Some("oak_log".to_string())
        );
        assert_eq!(
            texture_id_to_block_id("minecraft:block/furnace_front"),
            Some("furnace".to_string())
        );
        assert_eq!(
            texture_id_to_block_id("minecraft:block/grass_block_side"),
            Some("grass_block".to_string())
        );
    }
}
