/// Index assets from resource packs (both zip and uncompressed)
use crate::model::{AssetRecord, PackMeta};
use crate::util::zip;
use anyhow::Result;
use std::collections::HashMap;
use std::path::Path;
use walkdir::WalkDir;

const ASSET_PATH_PREFIX: &str = "assets/";
const TEXTURE_PATH: &str = "textures/";

/// Index all assets from a list of packs
pub fn index_assets(
    packs: &[PackMeta],
) -> Result<(Vec<AssetRecord>, HashMap<String, Vec<String>>)> {
    println!(
        "[index_assets] Starting asset indexing for {} packs",
        packs.len()
    );
    let mut assets_map: HashMap<String, AssetRecord> = HashMap::new();
    let mut providers: HashMap<String, Vec<String>> = HashMap::new();

    for (i, pack) in packs.iter().enumerate() {
        println!(
            "[index_assets] Indexing pack {}/{}: {} (is_zip: {})",
            i + 1,
            packs.len(),
            pack.name,
            pack.is_zip
        );
        let pack_assets = if pack.is_zip {
            index_zip_pack(&pack.path, &pack.id)?
        } else {
            index_folder_pack(&pack.path, &pack.id)?
        };
        println!("[index_assets] Found {} assets in pack", pack_assets.len());

        for (asset_id, files) in pack_assets {
            // Track provider
            providers
                .entry(asset_id.clone())
                .or_insert_with(Vec::new)
                .push(pack.id.clone());

            // Merge into assets map
            assets_map
                .entry(asset_id.clone())
                .and_modify(|record| {
                    for file in &files {
                        if !record.files.contains(file) {
                            record.files.push(file.clone());
                        }
                    }
                })
                .or_insert_with(|| AssetRecord {
                    id: asset_id.clone(),
                    labels: extract_labels(&asset_id),
                    files,
                });
        }
    }

    let mut assets: Vec<AssetRecord> = assets_map.into_values().collect();
    assets.sort_by(|a, b| a.id.cmp(&b.id));

    Ok((assets, providers))
}

/// Index assets from a zip pack
fn index_zip_pack(zip_path: &str, _pack_id: &str) -> Result<HashMap<String, Vec<String>>> {
    println!("[index_zip_pack] Listing files in ZIP: {}", zip_path);
    let files = zip::list_zip_files(zip_path)?;
    println!("[index_zip_pack] Found {} files in ZIP", files.len());

    // Debug: Print first few files to see their structure
    for (i, file) in files.iter().take(10).enumerate() {
        println!("[index_zip_pack] Sample file {}: {}", i, file);
    }

    // Debug: Show which files are being rejected and why
    let mut rejected_count = 0;
    for file in files.iter() {
        if extract_asset_id(&file).is_none() {
            if rejected_count < 5 {
                println!("[index_zip_pack] REJECTED (not a texture): {}", file);
            }
            rejected_count += 1;
        }
    }
    println!("[index_zip_pack] Total rejected files: {}", rejected_count);

    let mut assets_map: HashMap<String, Vec<String>> = HashMap::new();

    for (i, file) in files.iter().enumerate() {
        if i % 1000 == 0 {
            println!("[index_zip_pack] Processing file {}/{}", i, files.len());
        }
        if let Some(asset_id) = extract_asset_id(&file) {
            assets_map
                .entry(asset_id)
                .or_insert_with(Vec::new)
                .push(file.clone());
        }
    }
    println!(
        "[index_zip_pack] Extracted {} unique assets",
        assets_map.len()
    );

    Ok(assets_map)
}

/// Index assets from an uncompressed folder pack
fn index_folder_pack(folder_path: &str, _pack_id: &str) -> Result<HashMap<String, Vec<String>>> {
    let path = Path::new(folder_path);
    let mut assets_map: HashMap<String, Vec<String>> = HashMap::new();

    for entry in WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
    {
        let rel_path = entry
            .path()
            .strip_prefix(path)
            .map(|p| p.to_string_lossy().to_string())?;

        if let Some(asset_id) = extract_asset_id(&rel_path) {
            assets_map
                .entry(asset_id)
                .or_insert_with(Vec::new)
                .push(rel_path);
        }
    }

    Ok(assets_map)
}

/// Extract asset ID from a file path
/// E.g., "assets/minecraft/textures/block/stone.png" -> "minecraft:block/stone"
fn extract_asset_id(file_path: &str) -> Option<String> {
    // Must be in assets/
    if !file_path.starts_with(ASSET_PATH_PREFIX) {
        return None;
    }

    let after_assets = &file_path[ASSET_PATH_PREFIX.len()..];

    // Split namespace and rest
    let parts: Vec<&str> = after_assets.splitn(2, '/').collect();
    if parts.len() != 2 {
        return None;
    }

    let namespace = parts[0];
    let rest = parts[1];

    // For now, only index texture files in textures/ subdirectory
    if !rest.starts_with(TEXTURE_PATH) {
        return None;
    }

    let texture_path = &rest[TEXTURE_PATH.len()..];

    // Remove file extension
    let asset_path = if let Some(dot_idx) = texture_path.rfind('.') {
        &texture_path[..dot_idx]
    } else {
        texture_path
    };

    Some(format!("{}:{}", namespace, asset_path))
}

/// Extract labels from an asset ID
/// E.g., "minecraft:block/stone" -> ["minecraft", "block", "stone"]
fn extract_labels(asset_id: &str) -> Vec<String> {
    let mut labels = Vec::new();

    // Add namespace as label
    if let Some(colon_idx) = asset_id.find(':') {
        labels.push(asset_id[..colon_idx].to_string());
    }

    // Add path components as labels
    let path_part = if let Some(colon_idx) = asset_id.find(':') {
        &asset_id[colon_idx + 1..]
    } else {
        asset_id
    };

    for component in path_part.split('/') {
        if !component.is_empty() {
            labels.push(component.to_string());
        }
    }

    labels
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_asset_id() {
        assert_eq!(
            extract_asset_id("assets/minecraft/textures/block/stone.png"),
            Some("minecraft:block/stone".to_string())
        );

        assert_eq!(
            extract_asset_id("assets/minecraft/textures/entity/zombie.png"),
            Some("minecraft:entity/zombie".to_string())
        );

        assert_eq!(extract_asset_id("pack.mcmeta"), None);
        assert_eq!(extract_asset_id("assets/minecraft/lang/en_us.json"), None);
    }

    #[test]
    fn test_extract_labels() {
        let labels = extract_labels("minecraft:block/stone");
        assert!(labels.contains(&"minecraft".to_string()));
        assert!(labels.contains(&"block".to_string()));
        assert!(labels.contains(&"stone".to_string()));
    }
}
