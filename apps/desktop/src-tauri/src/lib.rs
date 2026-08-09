#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Backs the statute-document download service (`src/services/downloads`): the
        // webview has no native download manager, so the frontend fetches a file as bytes,
        // asks the OS "Save As" dialog where to put them (plugin-dialog), then writes them
        // with this plugin. See `capabilities/default.json` for the granted permissions.
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
