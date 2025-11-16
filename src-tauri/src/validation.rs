/**
 * Input validation utilities for Tauri commands
 *
 * Provides a DRY way to validate all command inputs before processing.
 * Enables centralized, reusable validation logic.
 */

use std::path::Path;
use crate::error::AppResult;

/// Validates a directory path exists and is readable
pub fn validate_directory(path: &str, label: &str) -> AppResult<()> {
    if path.is_empty() {
        return Err(crate::error::AppError::validation(
            format!("{} cannot be empty", label),
        ));
    }

    let p = Path::new(path);
    if !p.exists() {
        return Err(crate::error::AppError::io(
            format!("{} does not exist: {}", label, path),
        ));
    }

    if !p.is_dir() {
        return Err(crate::error::AppError::validation(
            format!("{} is not a directory: {}", label, path),
        ));
    }

    Ok(())
}

/// Validates that a pack order is not empty
pub fn validate_pack_order(order: &[String]) -> AppResult<()> {
    if order.is_empty() {
        return Err(crate::error::AppError::validation(
            "Pack order cannot be empty".to_string(),
        ));
    }
    Ok(())
}

/// Validates that all pack IDs in overrides are present in pack order
pub fn validate_overrides(
    overrides: &std::collections::HashMap<String, String>,
    pack_order: &[String],
) -> AppResult<()> {
    for (asset_id, pack_id) in overrides {
        if asset_id.is_empty() {
            return Err(crate::error::AppError::validation(
                "Asset ID in overrides cannot be empty".to_string(),
            ));
        }
        if pack_id.is_empty() {
            return Err(crate::error::AppError::validation(
                format!("Pack ID for asset {} cannot be empty", asset_id),
            ));
        }
        if !pack_order.contains(pack_id) {
            return Err(crate::error::AppError::validation(
                format!("Override references non-existent pack: {}", pack_id),
            ));
        }
    }
    Ok(())
}

/// Validates build request parameters
pub fn validate_build_request(
    packs_dir: &str,
    pack_order: &[String],
    overrides: &std::collections::HashMap<String, String>,
    output_dir: &str,
) -> AppResult<()> {
    validate_directory(packs_dir, "Packs directory")?;
    validate_directory(output_dir, "Output directory")?;
    validate_pack_order(pack_order)?;
    validate_overrides(overrides, pack_order)?;
    Ok(())
}
