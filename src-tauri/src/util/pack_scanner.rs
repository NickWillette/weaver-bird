/// Scan a directory for resource packs (both .zip and uncompressed folders)
use crate::model::PackMeta;
use anyhow::Result;
use std::fs;
use std::io::Read;
use std::path::Path;
use walkdir::WalkDir;
use zip::ZipArchive;

/// Scan a directory for resource packs (.zip files and uncompressed folders)
pub fn scan_packs(packs_dir: &str) -> Result<Vec<PackMeta>> {
    println!("[scan_packs] Starting scan of: {}", packs_dir);
    let path = Path::new(packs_dir);

    if !path.exists() {
        anyhow::bail!("Packs directory does not exist: {}", packs_dir);
    }

    if !path.is_dir() {
        anyhow::bail!("Path is not a directory: {}", packs_dir);
    }

    let mut packs = Vec::new();

    // Scan directory entries
    println!("[scan_packs] Reading directory entries...");
    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let entry_path = entry.path();
        let file_name = entry.file_name();
        let file_name_str = file_name.to_string_lossy();

        // Skip hidden files and non-pack folders
        if file_name_str.starts_with('.') {
            continue;
        }

        // Check for .zip files
        if entry_path.is_file() && entry_path.extension().map_or(false, |ext| ext == "zip") {
            println!("[scan_packs] Found ZIP: {}", file_name_str);
            if let Ok(metadata) = entry.metadata() {
                println!("[scan_packs] Extracting metadata from ZIP...");
                let (description, icon_data) = extract_pack_metadata_from_zip(&entry_path);
                println!("[scan_packs] Metadata extracted");

                let pack = PackMeta {
                    id: file_name_str.to_string(),
                    name: file_name_str.trim_end_matches(".zip").to_string(),
                    path: entry_path.to_string_lossy().to_string(),
                    size: metadata.len(),
                    is_zip: true,
                    description,
                    icon_data,
                };
                packs.push(pack);
            }
        }

        // Check for uncompressed folders with pack.mcmeta
        if entry_path.is_dir() {
            let pack_mcmeta = entry_path.join("pack.mcmeta");
            if pack_mcmeta.exists() {
                let size = calculate_dir_size(&entry_path);
                let (description, icon_data) = extract_pack_metadata_from_dir(&entry_path);

                let pack = PackMeta {
                    id: file_name_str.to_string(),
                    name: file_name_str.to_string(),
                    path: entry_path.to_string_lossy().to_string(),
                    size,
                    is_zip: false,
                    description,
                    icon_data,
                };
                packs.push(pack);
            }
        }
    }

    // Sort packs by name for consistent ordering
    packs.sort_by(|a, b| a.name.cmp(&b.name));

    println!("[scan_packs] Found {} packs total:", packs.len());
    for pack in &packs {
        println!("[scan_packs]   - {} (is_zip: {})", pack.name, pack.is_zip);
    }

    Ok(packs)
}

/// Calculate total size of a directory recursively
fn calculate_dir_size(path: &Path) -> u64 {
    WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter_map(|e| e.metadata().ok())
        .filter(|m| m.is_file())
        .map(|m| m.len())
        .sum()
}

/// Extract description from pack.mcmeta and icon from pack.png in a ZIP file
fn extract_pack_metadata_from_zip(zip_path: &Path) -> (Option<String>, Option<String>) {
    let file = match fs::File::open(zip_path) {
        Ok(f) => f,
        Err(_) => return (None, None),
    };

    let mut archive = match ZipArchive::new(file) {
        Ok(a) => a,
        Err(_) => return (None, None),
    };

    // Extract description from pack.mcmeta
    let description = extract_description_from_zip(&mut archive);

    // Extract icon from pack.png
    let icon_data = extract_icon_from_zip(&mut archive);

    (description, icon_data)
}

/// Extract description from pack.mcmeta in ZIP archive
fn extract_description_from_zip(archive: &mut ZipArchive<fs::File>) -> Option<String> {
    // Try to find pack.mcmeta
    let mut mcmeta_file = archive.by_name("pack.mcmeta").ok()?;

    let mut contents = String::new();
    mcmeta_file.read_to_string(&mut contents).ok()?;

    // Parse JSON and extract description
    let json: serde_json::Value = serde_json::from_str(&contents).ok()?;
    let description = json
        .get("pack")?
        .get("description")?
        .as_str()
        .map(|s| s.to_string());

    description
}

/// Extract icon from pack.png in ZIP archive as base64
fn extract_icon_from_zip(archive: &mut ZipArchive<fs::File>) -> Option<String> {
    // Try to find pack.png
    let mut icon_file = archive.by_name("pack.png").ok()?;

    let mut buffer = Vec::new();
    icon_file.read_to_end(&mut buffer).ok()?;

    // Encode as base64
    use base64::{engine::general_purpose, Engine as _};
    Some(general_purpose::STANDARD.encode(&buffer))
}

/// Extract description and icon from an uncompressed directory
fn extract_pack_metadata_from_dir(dir_path: &Path) -> (Option<String>, Option<String>) {
    // Extract description from pack.mcmeta
    let description = extract_description_from_dir(dir_path);

    // Extract icon from pack.png
    let icon_data = extract_icon_from_dir(dir_path);

    (description, icon_data)
}

/// Extract description from pack.mcmeta in directory
fn extract_description_from_dir(dir_path: &Path) -> Option<String> {
    let mcmeta_path = dir_path.join("pack.mcmeta");
    let contents = fs::read_to_string(mcmeta_path).ok()?;

    // Parse JSON and extract description
    let json: serde_json::Value = serde_json::from_str(&contents).ok()?;
    let description = json
        .get("pack")?
        .get("description")?
        .as_str()
        .map(|s| s.to_string());

    description
}

/// Extract icon from pack.png in directory as base64
fn extract_icon_from_dir(dir_path: &Path) -> Option<String> {
    let icon_path = dir_path.join("pack.png");
    let buffer = fs::read(icon_path).ok()?;

    // Encode as base64
    use base64::{engine::general_purpose, Engine as _};
    Some(general_purpose::STANDARD.encode(&buffer))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_scan_packs_nonexistent() {
        let result = scan_packs("/nonexistent/path");
        assert!(result.is_err());
    }
}
