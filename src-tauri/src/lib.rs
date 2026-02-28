#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      use tauri_plugin_shell::ShellExt;
      use tauri::Manager;

      // Get app data directory for SQLite persistence
      let app_data_dir = app.path().app_data_dir().expect("Failed to get app data dir");
      std::fs::create_dir_all(&app_data_dir).expect("Failed to create app data dir");
      let db_path = app_data_dir.join("pos.db");
      let db_url = format!("file:{}", db_path.to_str().unwrap());

      let sidecar_command = app.shell().sidecar("pos-server").unwrap()
        .env("DATABASE_URL", &db_url)
        .env("NODE_ENV", "production");
        
      let (mut _rx, mut _child) = sidecar_command
        .spawn()
        .expect("Failed to spawn sidecar");

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
