use fs2::FileExt;
use std::path::Path;

pub struct FileLock {
    _file: std::fs::File,
}

impl FileLock {
    pub fn lock(path: &Path) -> std::io::Result<Self> {
        let file = std::fs::OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(path)?;
        file.lock_exclusive()?;
        Ok(Self { _file: file })
    }
}

impl Drop for FileLock {
    fn drop(&mut self) {
        let _ = self._file.unlock();
    }
}
