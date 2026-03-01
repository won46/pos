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

      // Get app data directory to locate resources
      let resource_dir = app.path().resource_dir().expect("Failed to get resource dir");
      let prisma_engine = resource_dir.join("client").join("query_engine-windows.dll.node");
      let initial_db_path = resource_dir.join("pos.db");

      // Copy seeded database if it doesn't exist yet
      if !db_path.exists() {
          if initial_db_path.exists() {
              std::fs::copy(&initial_db_path, &db_path).expect("Failed to copy initial pos.db from resources");
          } else {
              println!("Warning: initial pos.db not found in resources!");
          }
      }

      let log_path = app_data_dir.join("server.log");
      let log_file = std::fs::File::create(&log_path).expect("Failed to create log file");
      let sidecar_command = app.shell().sidecar("pos-server").unwrap()
        .env("NODE_ENV", "production")
        .env("DATABASE_URL", &db_url)
        .env("PRISMA_QUERY_ENGINE_LIBRARY", prisma_engine.to_str().unwrap())
        .env("JWT_SECRET", "inisecretkey")
        .env("JWT_REFRESH_SECRET", "inisecretrefresh")
        .env("JWT_EXPIRES_IN", "1d")
        .env("JWT_REFRESH_EXPIRES_IN", "7d")
        .env("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:4000,http://localhost:4001,tauri://localhost,http://tauri.localhost,https://tauri.localhost,http://127.0.0.1:4000,http://127.0.0.1:4001");
        
      let (mut rx, mut _child) = sidecar_command
        .spawn()
        .expect("Failed to spawn sidecar");

      // Spawn a thread to write logs
      tauri::async_runtime::spawn(async move {
          use std::io::Write;
          let mut file = log_file;
          while let Some(event) = rx.recv().await {
              if let tauri_plugin_shell::process::CommandEvent::Stdout(line) = event {
                  let _ = writeln!(file, "STDOUT: {}", String::from_utf8_lossy(&line));
              } else if let tauri_plugin_shell::process::CommandEvent::Stderr(line) = event {
                  let _ = writeln!(file, "STDERR: {}", String::from_utf8_lossy(&line));
              }
              let _ = file.flush();
          }
      });

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
