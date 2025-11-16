/// Utilities for finding Minecraft directories
use anyhow::{anyhow, Result};
use std::path::PathBuf;

#[cfg(target_os = "windows")]
fn get_appdata_dir() -> Result<PathBuf> {
    std::env::var("APPDATA")
        .map(PathBuf::from)
        .map_err(|_| anyhow!("Could not find APPDATA directory"))
}

#[cfg(target_os = "macos")]
fn get_minecraft_dir() -> Result<PathBuf> {
    let home = std::env::var("HOME")
        .map(PathBuf::from)
        .map_err(|_| anyhow!("Could not find HOME directory"))?;
    Ok(home.join("Library/Application Support/minecraft"))
}

#[cfg(target_os = "linux")]
fn get_minecraft_dir() -> Result<PathBuf> {
    let home = std::env::var("HOME")
        .map(PathBuf::from)
        .map_err(|_| anyhow!("Could not find HOME directory"))?;
    Ok(home.join(".minecraft"))
}

#[cfg(target_os = "windows")]
fn get_minecraft_dir() -> Result<PathBuf> {
    let appdata = get_appdata_dir()?;
    Ok(appdata.join(".minecraft"))
}

/// Get the default .minecraft directory for the current platform
pub fn get_default_minecraft_dir() -> Result<PathBuf> {
    let dir = get_minecraft_dir()?;
    Ok(dir)
}

/// Get the default resourcepacks directory
pub fn get_default_resourcepacks_dir() -> Result<PathBuf> {
    let mc_dir = get_default_minecraft_dir()?;
    Ok(mc_dir.join("resourcepacks"))
}

/// Check if a path exists and is a directory
pub fn is_valid_packs_dir(path: &str) -> Result<bool> {
    let path = PathBuf::from(path);
    Ok(path.exists() && path.is_dir())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_default_minecraft_dir() {
        let dir = get_default_minecraft_dir();
        assert!(dir.is_ok());
    }

    #[test]
    fn test_get_default_resourcepacks_dir() {
        let dir = get_default_resourcepacks_dir();
        assert!(dir.is_ok());
    }
}
