/**
 * Application error type for Tauri commands
 *
 * This implements the modern Tauri v2 pattern of custom error types
 * that automatically serialize to JSON for frontend consumption.
 */

use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppError {
    pub code: String,
    pub message: String,
    pub details: Option<String>,
}

impl AppError {
    /// Create a validation error
    pub fn validation(message: impl Into<String>) -> Self {
        Self {
            code: "VALIDATION_ERROR".to_string(),
            message: message.into(),
            details: None,
        }
    }

    /// Create a filesystem error
    pub fn io(message: impl Into<String>) -> Self {
        Self {
            code: "IO_ERROR".to_string(),
            message: message.into(),
            details: None,
        }
    }

    /// Create a pack scanning error
    pub fn scan(message: impl Into<String>) -> Self {
        Self {
            code: "SCAN_ERROR".to_string(),
            message: message.into(),
            details: None,
        }
    }

    /// Create a pack building error
    pub fn build(message: impl Into<String>) -> Self {
        Self {
            code: "BUILD_ERROR".to_string(),
            message: message.into(),
            details: None,
        }
    }

    /// Create an internal error
    pub fn internal(message: impl Into<String>, details: impl Into<String>) -> Self {
        Self {
            code: "INTERNAL_ERROR".to_string(),
            message: message.into(),
            details: Some(details.into()),
        }
    }

    /// Attach more context to the error
    pub fn with_details(mut self, details: impl Into<String>) -> Self {
        self.details = Some(details.into());
        self
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}: {}", self.code, self.message)
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::internal("Operation failed", err.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::io(err.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::internal("Serialization failed", err.to_string())
    }
}

/// Type alias for Results in this application
pub type AppResult<T> = Result<T, AppError>;
