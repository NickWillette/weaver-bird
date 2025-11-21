/// Utilities for extracting and caching vanilla Minecraft textures
use anyhow::{anyhow, Context, Result};
use rayon::prelude::*;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use zip::ZipArchive;

use crate::util::mc_paths;

/// Get the directory where vanilla textures are cached
pub fn get_vanilla_cache_dir() -> Result<PathBuf> {
    let cache_dir = dirs::cache_dir()
        .ok_or_else(|| anyhow!("Could not find cache directory"))?
        .join("weaverbird")
        .join("vanilla_textures");

    fs::create_dir_all(&cache_dir).context("Failed to create vanilla textures cache directory")?;

    Ok(cache_dir)
}

/// Check if Minecraft is installed at the given directory
/// Works with both official launcher (.minecraft/versions) and Modrinth (meta/versions)
pub fn check_minecraft_installation(mc_dir: &Path) -> Result<bool> {
    if !mc_dir.exists() {
        return Ok(false);
    }

    // Check for official launcher structure
    if mc_dir.join("versions").exists() {
        return Ok(true);
    }

    // Check for Modrinth launcher structure (if path ends with "meta", versions is directly inside)
    // Otherwise check for meta/versions
    if mc_dir.file_name().and_then(|n| n.to_str()) == Some("meta") {
        if mc_dir.join("versions").exists() {
            return Ok(true);
        }
    } else if mc_dir.join("meta/versions").exists() {
        return Ok(true);
    }

    Ok(false)
}

/// Get suggested Minecraft directory paths for the current platform
pub fn get_suggested_minecraft_paths() -> Vec<String> {
    let mut paths = Vec::new();

    #[cfg(target_os = "macos")]
    {
        if let Ok(home) = std::env::var("HOME") {
            paths.push(format!("{}/Library/Application Support/minecraft", home));
            paths.push(format!(
                "{}/Library/Application Support/ModrinthApp/meta",
                home
            ));
            paths.push(format!(
                "{}/Library/Application Support/com.modrinth.theseus/meta",
                home
            ));
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(appdata) = std::env::var("APPDATA") {
            paths.push(format!("{}/.minecraft", appdata));
            paths.push(format!("{}\\.minecraft", appdata));
            paths.push(format!("{}\\ModrinthApp\\meta", appdata));
            paths.push(format!("{}\\com.modrinth.theseus\\meta", appdata));
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(home) = std::env::var("HOME") {
            paths.push(format!("{}/.minecraft", home));
            paths.push(format!("{}/.local/share/ModrinthApp/meta", home));
            paths.push(format!("{}/.local/share/com.modrinth.theseus/meta", home));
        }
    }

    paths
}

/// Find the latest Minecraft version JAR file from a specific Minecraft directory
pub fn find_latest_version_jar_from_dir(mc_dir: &Path) -> Result<PathBuf> {
    let versions_dir = mc_dir.join("versions");

    if !versions_dir.exists() {
        return Err(anyhow!(
            "Minecraft versions directory not found at {}",
            versions_dir.display()
        ));
    }

    // Get all version directories
    let mut versions: Vec<PathBuf> = fs::read_dir(&versions_dir)
        .context("Failed to read versions directory")?
        .filter_map(|entry| entry.ok())
        .filter(|entry| entry.path().is_dir())
        .map(|entry| entry.path())
        .collect();

    // Sort by modification time (most recent first)
    versions.sort_by(|a, b| {
        let a_meta = fs::metadata(a).ok();
        let b_meta = fs::metadata(b).ok();

        match (a_meta, b_meta) {
            (Some(a_m), Some(b_m)) => b_m
                .modified()
                .unwrap_or(std::time::SystemTime::UNIX_EPOCH)
                .cmp(&a_m.modified().unwrap_or(std::time::SystemTime::UNIX_EPOCH)),
            _ => std::cmp::Ordering::Equal,
        }
    });

    // Find the first version with a matching JAR file
    for version_dir in versions {
        if let Some(version_name) = version_dir.file_name() {
            let jar_path = version_dir.join(format!("{}.jar", version_name.to_string_lossy()));
            if jar_path.exists() {
                return Ok(jar_path);
            }
        }
    }

    Err(anyhow!(
        "No Minecraft version JAR files found in {}",
        versions_dir.display()
    ))
}

/// Find the latest Minecraft version JAR file
/// Checks multiple launcher locations in order of preference
pub fn find_latest_version_jar() -> Result<PathBuf> {
    let mut search_paths = Vec::new();

    // Try official Minecraft launcher first
    if let Ok(mc_dir) = mc_paths::get_default_minecraft_dir() {
        search_paths.push(mc_dir);
    }

    // Try Modrinth launcher
    #[cfg(target_os = "macos")]
    {
        if let Ok(home) = std::env::var("HOME") {
            search_paths
                .push(PathBuf::from(&home).join("Library/Application Support/ModrinthApp/meta"));
            search_paths.push(
                PathBuf::from(&home).join("Library/Application Support/com.modrinth.theseus/meta"),
            );
        }
    }

    #[cfg(target_os = "windows")]
    {
        if let Ok(appdata) = std::env::var("APPDATA") {
            search_paths.push(PathBuf::from(&appdata).join("ModrinthApp/meta"));
            search_paths.push(PathBuf::from(&appdata).join("com.modrinth.theseus/meta"));
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(home) = std::env::var("HOME") {
            search_paths.push(PathBuf::from(&home).join(".local/share/ModrinthApp/meta"));
            search_paths.push(PathBuf::from(&home).join(".local/share/com.modrinth.theseus/meta"));
        }
    }

    // Try each search path
    for path in search_paths {
        if let Ok(jar) = find_latest_version_jar_from_dir(&path) {
            return Ok(jar);
        }
    }

    Err(anyhow!(
        "Could not find Minecraft installation. Tried official launcher and Modrinth App."
    ))
}

/// Extract vanilla textures from the Minecraft JAR to cache
pub fn extract_vanilla_textures(jar_path: &Path) -> Result<PathBuf> {
    let cache_dir = get_vanilla_cache_dir()?;

    // Check if already extracted with current version
    // Version 2: includes models and blockstates (not just textures)
    let marker_file = cache_dir.join(".extracted_v2");
    if marker_file.exists() {
        return Ok(cache_dir);
    }

    // Clean old cache if it exists
    if cache_dir.exists() {
        println!("[vanilla_textures] Cleaning old cache to re-extract with models and blockstates");
        fs::remove_dir_all(&cache_dir).context("Failed to clean old cache")?;
        fs::create_dir_all(&cache_dir).context("Failed to recreate cache directory")?;
    }

    // First pass: collect all files that need to be extracted
    let jar_file = fs::File::open(jar_path).context("Failed to open Minecraft JAR file")?;
    let mut archive = ZipArchive::new(jar_file).context("Failed to read JAR archive")?;

    let mut files_to_extract = Vec::new();

    for i in 0..archive.len() {
        let file = archive
            .by_index(i)
            .context("Failed to read archive entry")?;

        let file_path = file.name().to_string();

        // Extract textures (PNG), models (JSON), and blockstates (JSON)
        let should_extract = (file_path.starts_with("assets/minecraft/textures/")
            && file_path.ends_with(".png"))
            || (file_path.starts_with("assets/minecraft/models/") && file_path.ends_with(".json"))
            || (file_path.starts_with("assets/minecraft/blockstates/")
                && file_path.ends_with(".json"));

        if should_extract {
            files_to_extract.push((i, file_path));
        }
    }

    println!(
        "[vanilla_textures] Found {} files to extract, extracting in PARALLEL",
        files_to_extract.len()
    );

    // Second pass: extract files in parallel
    // Each thread opens its own ZipArchive instance
    let jar_path_clone = jar_path.to_path_buf();
    let cache_dir_clone = cache_dir.clone();

    files_to_extract
        .par_iter()
        .try_for_each(|(index, file_path)| -> Result<()> {
            // Open archive in this thread
            let jar_file = fs::File::open(&jar_path_clone)
                .context("Failed to open Minecraft JAR file")?;
            let mut archive = ZipArchive::new(jar_file)
                .context("Failed to read JAR archive")?;

            let mut file = archive
                .by_index(*index)
                .context("Failed to read archive entry")?;

            // Keep the full structure: assets/minecraft/...
            let output_path = cache_dir_clone.join(file_path);

            // Create parent directories
            if let Some(parent) = output_path.parent() {
                fs::create_dir_all(parent).context("Failed to create directory")?;
            }

            // Extract the file
            let mut output_file =
                fs::File::create(&output_path).context("Failed to create file")?;
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer)
                .context("Failed to read from JAR")?;
            std::io::copy(&mut buffer.as_slice(), &mut output_file)
                .context("Failed to write file")?;

            Ok(())
        })?;

    // Create marker file to indicate extraction is complete (v2 = includes models & blockstates)
    fs::write(marker_file, "extracted_v2").context("Failed to create extraction marker")?;

    println!(
        "[vanilla_textures] Successfully extracted vanilla assets (textures, models, blockstates) in PARALLEL"
    );
    Ok(cache_dir)
}

/// Get the path to a vanilla texture file by asset ID
/// Example: "minecraft:block/stone" -> cache_dir/assets/minecraft/textures/block/stone.png
pub fn get_vanilla_texture_path(asset_id: &str) -> Result<PathBuf> {
    let cache_dir = get_vanilla_cache_dir()?;

    // Parse asset ID: "minecraft:block/stone" -> "block/stone"
    let texture_path = asset_id.strip_prefix("minecraft:").unwrap_or(asset_id);

    // New structure includes full assets/minecraft path
    let full_path = cache_dir.join(format!("assets/minecraft/textures/{}.png", texture_path));

    if full_path.exists() {
        Ok(full_path)
    } else {
        Err(anyhow!("Vanilla texture not found: {}", asset_id))
    }
}

/// Get the path to a biome colormap file (grass.png or foliage.png)
/// Example: "grass" -> cache_dir/assets/minecraft/textures/colormap/grass.png
pub fn get_colormap_path(colormap_type: &str) -> Result<PathBuf> {
    let cache_dir = get_vanilla_cache_dir()?;
    let full_path = cache_dir.join(format!(
        "assets/minecraft/textures/colormap/{}.png",
        colormap_type
    ));

    if full_path.exists() {
        Ok(full_path)
    } else {
        Err(anyhow!("Colormap not found: {}", colormap_type))
    }
}

/// Initialize vanilla textures from a specific Minecraft directory
pub fn initialize_vanilla_textures_from_dir(mc_dir: &Path) -> Result<PathBuf> {
    let cache_dir = get_vanilla_cache_dir()?;
    let marker_file = cache_dir.join(".extracted_v2");

    // If already extracted with current version, return cache dir
    if marker_file.exists() {
        return Ok(cache_dir);
    }

    // Find and extract from latest version JAR in the given directory
    let jar_path = find_latest_version_jar_from_dir(mc_dir)?;
    extract_vanilla_textures(&jar_path)
}

/// Initialize vanilla textures (extract if not already cached)
pub fn initialize_vanilla_textures() -> Result<PathBuf> {
    let cache_dir = get_vanilla_cache_dir()?;
    let marker_file = cache_dir.join(".extracted_v2");

    // If already extracted with current version, return cache dir
    if marker_file.exists() {
        return Ok(cache_dir);
    }

    // Find and extract from latest version JAR
    let jar_path = find_latest_version_jar()?;
    extract_vanilla_textures(&jar_path)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_vanilla_cache_dir() {
        let cache_dir = get_vanilla_cache_dir();
        assert!(cache_dir.is_ok());
    }

    #[test]
    fn test_find_latest_version_jar() {
        // This test requires a Minecraft installation
        let result = find_latest_version_jar();
        if result.is_ok() {
            println!("Found JAR: {:?}", result.unwrap());
        }
    }

    #[test]
    fn test_get_suggested_paths() {
        let paths = get_suggested_minecraft_paths();
        assert!(!paths.is_empty());
    }
}
