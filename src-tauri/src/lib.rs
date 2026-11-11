use std::{
    fs::{create_dir_all, OpenOptions},
    io::Write,
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::Manager;

fn append_audit(app: &tauri::AppHandle, app_id: &str) -> Result<(), String> {
    let directory = app.path().app_data_dir().map_err(|error| error.to_string())?;
    create_dir_all(&directory).map_err(|error| error.to_string())?;
    let path = directory.join("audit.log");
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .map_err(|error| error.to_string())?;
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_millis();
    writeln!(file, "timestamp_unix_ms={} action=open_allowed_app app={}", timestamp, app_id)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn open_allowed_app(app: tauri::AppHandle, app_id: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let program = match app_id.as_str() {
            "notepad" => "notepad.exe",
            "calculator" => "calc.exe",
            "explorer" => "explorer.exe",
            _ => return Err("Cette application ne figure pas dans la liste autorisée.".into()),
        };
        append_audit(&app, &app_id)?;
        Command::new(program)
            .spawn()
            .map(|_| ())
            .map_err(|error| format!("Impossible de lancer l'application autorisée : {}", error))
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = (app, app_id);
        Err("Le lancement d'applications est actuellement réservé à OREL pour Windows.".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_allowed_app])
        .run(tauri::generate_context!())
        .expect("Erreur lors du démarrage d'OREL");
}