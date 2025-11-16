//! Zip file utilities for indexing and extracting pack entries

use anyhow::{anyhow, Result};
use std::fs::File;
use std::io::Read;
use std::path::Path;
use zip::ZipArchive;

/// List all files in a zip archive without extracting
pub fn list_zip_files(zip_path: &str) -> Result<Vec<String>> {
    println!("[list_zip_files] Opening ZIP: {}", zip_path);
    let file =
        File::open(zip_path).map_err(|e| anyhow!("Failed to open zip {}: {}", zip_path, e))?;
    let mut archive =
        ZipArchive::new(file).map_err(|e| anyhow!("Failed to read zip {}: {}", zip_path, e))?;

    let archive_len = archive.len();
    println!("[list_zip_files] ZIP contains {} entries", archive_len);
    let mut files = Vec::new();

    for i in 0..archive_len {
        if i % 5000 == 0 && i > 0 {
            println!("[list_zip_files] Processed {}/{} entries", i, archive_len);
        }
        let file = archive
            .by_index(i)
            .map_err(|e| anyhow!("Failed to read zip entry {}: {}", i, e))?;
        if !file.is_dir() {
            files.push(file.name().to_string());
        }
    }
    println!(
        "[list_zip_files] Found {} files (excluding directories)",
        files.len()
    );

    Ok(files)
}

/// Extract a specific file from a zip to bytes
pub fn extract_zip_entry(zip_path: &str, entry_path: &str) -> Result<Vec<u8>> {
    let file =
        File::open(zip_path).map_err(|e| anyhow!("Failed to open zip {}: {}", zip_path, e))?;
    let mut archive = ZipArchive::new(file).map_err(|e| anyhow!("Failed to read zip: {}", e))?;

    let mut file = archive
        .by_name(entry_path)
        .map_err(|e| anyhow!("Entry not found in zip: {}", e))?;

    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer)
        .map_err(|e| anyhow!("Failed to read zip entry: {}", e))?;

    Ok(buffer)
}

/// Get size of a zip file
pub fn get_zip_size(zip_path: &str) -> Result<u64> {
    let path = Path::new(zip_path);
    std::fs::metadata(path)
        .map(|m| m.len())
        .map_err(|e| anyhow!("Failed to get zip size: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_zip_files() {
        // This test requires a test zip file
        // Skipping for now
    }
}
