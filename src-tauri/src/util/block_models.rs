/// Utility for reading and resolving Minecraft block model JSON files
///
/// This module handles:
/// - Reading model JSON from resource packs
/// - Falling back to vanilla models
/// - Resolving parent model inheritance
/// - Extracting texture references
use crate::model::PackMeta;
use crate::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

/// A Minecraft block model JSON structure
///
/// Simplified version that captures the key fields we need.
/// Full spec: https://minecraft.wiki/w/Model#Block_models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BlockModel {
    /// Parent model to inherit from (e.g., "minecraft:block/cube_all")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent: Option<String>,

    /// Texture variable mappings (e.g., {"all": "minecraft:block/dirt"})
    #[serde(skip_serializing_if = "Option::is_none")]
    pub textures: Option<HashMap<String, String>>,

    /// Custom elements (cuboid definitions)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub elements: Option<Vec<ModelElement>>,

    /// Ambient occlusion flag
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ambientocclusion: Option<bool>,
}

/// A cuboid element in a Minecraft model
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelElement {
    /// Start position [x, y, z] in 16x16x16 space
    pub from: [f32; 3],

    /// End position [x, y, z] in 16x16x16 space
    pub to: [f32; 3],

    /// Rotation around an axis (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rotation: Option<ElementRotation>,

    /// Face definitions (north, south, east, west, up, down)
    pub faces: HashMap<String, ElementFace>,

    /// Shade flag
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shade: Option<bool>,
}

/// Rotation information for a model element
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementRotation {
    /// Origin point [x, y, z]
    pub origin: [f32; 3],

    /// Axis: "x", "y", or "z"
    pub axis: String,

    /// Angle: -45, -22.5, 0, 22.5, or 45
    pub angle: f32,

    /// Rescale flag
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rescale: Option<bool>,
}

/// A face of a model element
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ElementFace {
    /// Texture variable reference (e.g., "#all" or "#texture0")
    pub texture: String,

    /// UV coordinates [x1, y1, x2, y2] (optional, defaults to element bounds)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uv: Option<[f32; 4]>,

    /// Rotation: 0, 90, 180, or 270
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rotation: Option<u32>,

    /// Cull face (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cullface: Option<String>,

    /// Tint index (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tintindex: Option<i32>,
}

/// Read a block model JSON file from a resource pack
///
/// # Arguments
/// * `pack` - The resource pack to search
/// * `model_id` - Model ID like "minecraft:block/dirt" or "block/dirt"
///
/// # Returns
/// The parsed BlockModel JSON
pub fn read_block_model(pack: &PackMeta, model_id: &str) -> AppResult<BlockModel> {
    println!("[read_block_model] Reading model: {}", model_id);
    println!(
        "[read_block_model] From pack: {} at {}",
        pack.name, pack.path
    );

    // Normalize the model ID
    let normalized = normalize_model_id(model_id);
    println!("[read_block_model] Normalized ID: {}", normalized);

    // Convert to file path: "minecraft:block/dirt" -> "assets/minecraft/models/block/dirt.json"
    let relative_path = model_id_to_path(&normalized);
    println!("[read_block_model] Relative path: {}", relative_path);

    let pack_path = Path::new(&pack.path);

    let contents = if pack.is_zip {
        // Read from ZIP archive
        println!("[read_block_model] Pack is ZIP, extracting from archive");
        let zip_path_str = pack_path
            .to_str()
            .ok_or_else(|| AppError::validation("Invalid pack path"))?;

        let bytes =
            crate::util::zip::extract_zip_entry(zip_path_str, &relative_path).map_err(|e| {
                println!("[read_block_model] ✗ ZIP extraction failed: {}", e);
                AppError::validation(format!("Model not found in ZIP: {}", e))
            })?;

        println!("[read_block_model] ✓ Successfully extracted from ZIP");
        String::from_utf8(bytes)
            .map_err(|e| AppError::validation(format!("Invalid UTF-8 in model: {}", e)))?
    } else {
        // Directory pack - just read the file
        let full_path = pack_path.join(&relative_path);
        println!(
            "[read_block_model] Pack is directory, reading from: {}",
            full_path.display()
        );

        if !full_path.exists() {
            println!("[read_block_model] ✗ File does not exist");
            return Err(AppError::validation(format!(
                "Model not found: {}",
                relative_path
            )));
        }

        println!("[read_block_model] ✓ File exists, reading...");
        fs::read_to_string(&full_path).map_err(|e| {
            println!("[read_block_model] ✗ Failed to read file: {}", e);
            AppError::io(format!("Failed to read model file: {}", e))
        })?
    };

    let model: BlockModel = serde_json::from_str(&contents)
        .map_err(|e| AppError::validation(format!("Invalid model JSON: {}", e)))?;

    Ok(model)
}

/// Read a block model with fallback to vanilla
///
/// Searches the specified pack first, then falls back to vanilla cache
pub fn read_block_model_with_fallback(
    pack: &PackMeta,
    model_id: &str,
    vanilla_pack: &PackMeta,
) -> AppResult<BlockModel> {
    println!(
        "[read_block_model_with_fallback] Trying pack: {} ({})",
        pack.name, pack.path
    );
    match read_block_model(pack, model_id) {
        Ok(model) => {
            println!("[read_block_model_with_fallback] ✓ Found in pack");
            Ok(model)
        }
        Err(pack_err) => {
            println!(
                "[read_block_model_with_fallback] ✗ Not in pack: {}",
                pack_err
            );
            println!(
                "[read_block_model_with_fallback] Trying vanilla: {} ({})",
                vanilla_pack.name, vanilla_pack.path
            );
            // Try vanilla as fallback
            match read_block_model(vanilla_pack, model_id) {
                Ok(model) => {
                    println!("[read_block_model_with_fallback] ✓ Found in vanilla");
                    Ok(model)
                }
                Err(vanilla_err) => {
                    println!(
                        "[read_block_model_with_fallback] ✗ Not in vanilla: {}",
                        vanilla_err
                    );
                    Err(vanilla_err)
                }
            }
        }
    }
}

/// Resolve a block model with all parent inheritance
///
/// Recursively loads parent models and merges textures/elements
pub fn resolve_block_model(
    pack: &PackMeta,
    model_id: &str,
    vanilla_pack: &PackMeta,
) -> AppResult<BlockModel> {
    resolve_block_model_with_depth(pack, model_id, vanilla_pack, 0)
}

/// Internal function with depth tracking to prevent infinite recursion
fn resolve_block_model_with_depth(
    pack: &PackMeta,
    model_id: &str,
    vanilla_pack: &PackMeta,
    depth: usize,
) -> AppResult<BlockModel> {
    const MAX_DEPTH: usize = 20;

    if depth > MAX_DEPTH {
        return Err(AppError::validation(format!(
            "Model parent chain too deep (possible circular reference): {}",
            model_id
        )));
    }

    println!(
        "[resolve_block_model] Depth {}: Loading model {}",
        depth, model_id
    );
    let mut model = read_block_model_with_fallback(pack, model_id, vanilla_pack)?;

    // If there's a parent, recursively resolve it
    if let Some(parent_id) = &model.parent.clone() {
        println!(
            "[resolve_block_model] Depth {}: Found parent: {}",
            depth, parent_id
        );
        let parent_model =
            resolve_block_model_with_depth(pack, parent_id, vanilla_pack, depth + 1)?;

        // Merge parent into current model
        model = merge_models(parent_model, model);
    } else {
        println!(
            "[resolve_block_model] Depth {}: No parent (base model)",
            depth
        );
    }

    Ok(model)
}

/// Merge a parent model with a child model
///
/// Child properties override parent properties
fn merge_models(parent: BlockModel, child: BlockModel) -> BlockModel {
    let mut merged = parent;

    // Child textures override/extend parent textures
    if let Some(child_textures) = child.textures {
        if let Some(parent_textures) = &mut merged.textures {
            parent_textures.extend(child_textures);
        } else {
            merged.textures = Some(child_textures);
        }
    }

    // Child elements completely replace parent elements
    if child.elements.is_some() {
        merged.elements = child.elements;
    }

    // Child ambient occlusion overrides parent
    if child.ambientocclusion.is_some() {
        merged.ambientocclusion = child.ambientocclusion;
    }

    // Clear parent reference since we've merged
    merged.parent = None;

    merged
}

/// Normalize a model ID to full form
///
/// "block/dirt" -> "minecraft:block/dirt"
/// "minecraft:block/dirt" -> "minecraft:block/dirt"
fn normalize_model_id(model_id: &str) -> String {
    if model_id.contains(':') {
        model_id.to_string()
    } else {
        format!("minecraft:{}", model_id)
    }
}

/// Convert a model ID to a relative file path
///
/// "minecraft:block/dirt" -> "assets/minecraft/models/block/dirt.json"
fn model_id_to_path(model_id: &str) -> String {
    let parts: Vec<&str> = model_id.split(':').collect();
    if parts.len() == 2 {
        format!("assets/{}/models/{}.json", parts[0], parts[1])
    } else {
        format!("assets/minecraft/models/{}.json", model_id)
    }
}

/// Resolve all texture variables in a model
///
/// Converts texture references like "#all" to actual texture paths like "minecraft:block/dirt"
pub fn resolve_textures(model: &BlockModel) -> HashMap<String, String> {
    let mut resolved = HashMap::new();

    if let Some(textures) = &model.textures {
        for (key, value) in textures {
            // If the value references another variable (starts with #), resolve it
            let mut current_value = value.clone();
            let mut iterations = 0;
            const MAX_ITERATIONS: usize = 10; // Prevent infinite loops

            while current_value.starts_with('#') && iterations < MAX_ITERATIONS {
                let var_name = current_value.trim_start_matches('#');
                if let Some(resolved_value) = textures.get(var_name) {
                    current_value = resolved_value.clone();
                } else {
                    break;
                }
                iterations += 1;
            }

            resolved.insert(key.clone(), current_value);
        }
    }

    resolved
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normalize_model_id() {
        assert_eq!(normalize_model_id("block/dirt"), "minecraft:block/dirt");
        assert_eq!(
            normalize_model_id("minecraft:block/stone"),
            "minecraft:block/stone"
        );
    }

    #[test]
    fn test_model_id_to_path() {
        assert_eq!(
            model_id_to_path("minecraft:block/dirt"),
            "assets/minecraft/models/block/dirt.json"
        );
    }

    #[test]
    fn test_resolve_textures() {
        let model = BlockModel {
            parent: None,
            textures: Some(HashMap::from([
                ("all".to_string(), "#base".to_string()),
                ("base".to_string(), "minecraft:block/dirt".to_string()),
            ])),
            elements: None,
            ambientocclusion: None,
        };

        let resolved = resolve_textures(&model);
        assert_eq!(
            resolved.get("all"),
            Some(&"minecraft:block/dirt".to_string())
        );
        assert_eq!(
            resolved.get("base"),
            Some(&"minecraft:block/dirt".to_string())
        );
    }
}
