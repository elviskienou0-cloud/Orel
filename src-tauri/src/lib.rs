use std::{
    fs::{create_dir_all, OpenOptions},
    io::Write,
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::Manager;
#[cfg(target_os = "windows")]
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
#[cfg(target_os = "windows")]
use std::time::Duration;

#[cfg(target_os = "windows")]
static LEFT_MOUSE_PRESSED: AtomicBool = AtomicBool::new(false);
#[cfg(target_os = "windows")]
static LAST_MOUSE_HEARTBEAT_MS: AtomicU64 = AtomicU64::new(0);

#[cfg(target_os = "windows")]
fn now_ms() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|value| value.as_millis() as u64).unwrap_or(0)
}

#[cfg(target_os = "windows")]
fn send_left_button(pressed: bool) -> Result<(), String> {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
        SendInput, INPUT, INPUT_0, INPUT_MOUSE, MOUSEEVENTF_LEFTDOWN, MOUSEEVENTF_LEFTUP, MOUSEINPUT,
    };
    let flags = if pressed { MOUSEEVENTF_LEFTDOWN } else { MOUSEEVENTF_LEFTUP };
    let input = INPUT {
        r#type: INPUT_MOUSE,
        Anonymous: INPUT_0 {
            mi: MOUSEINPUT {
                dx: 0, dy: 0, mouseData: 0, dwFlags: flags, time: 0, dwExtraInfo: 0,
            },
        },
    };
    let sent = unsafe { SendInput(1, &input, std::mem::size_of::<INPUT>() as i32) };
    if sent != 1 {
        return Err("Windows n'a pas accepté l'action de souris.".into());
    }
    if pressed {
        LEFT_MOUSE_PRESSED.store(true, Ordering::SeqCst);
        LAST_MOUSE_HEARTBEAT_MS.store(now_ms(), Ordering::SeqCst);
    } else {
        LEFT_MOUSE_PRESSED.store(false, Ordering::SeqCst);
    }
    Ok(())
}

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

fn append_input_audit(app: &tauri::AppHandle, event: &str) -> Result<(), String> {
    let directory = app.path().app_data_dir().map_err(|error| error.to_string())?;
    create_dir_all(&directory).map_err(|error| error.to_string())?;
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(directory.join("audit.log"))
        .map_err(|error| error.to_string())?;
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_millis();
    writeln!(file, "timestamp_unix_ms={} action={}", timestamp, event)
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

#[tauri::command]
fn get_screen_size() -> Result<serde_json::Value, String> {
    #[cfg(target_os = "windows")]
    {
        use windows_sys::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SM_CXSCREEN, SM_CYSCREEN};
        let width = unsafe { GetSystemMetrics(SM_CXSCREEN) };
        let height = unsafe { GetSystemMetrics(SM_CYSCREEN) };
        if width <= 0 || height <= 0 {
            return Err("Impossible de détecter la résolution de l'écran Windows.".into());
        }
        Ok(serde_json::json!({ "width": width, "height": height }))
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Le contrôle du pointeur est réservé à Windows.".into())
    }
}

#[tauri::command]
fn move_mouse(x: f64, y: f64) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use windows_sys::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SetCursorPos, SM_CXSCREEN, SM_CYSCREEN};
        if !x.is_finite() || !y.is_finite() {
            return Err("Coordonnées du pointeur invalides.".into());
        }
        let width = unsafe { GetSystemMetrics(SM_CXSCREEN) };
        let height = unsafe { GetSystemMetrics(SM_CYSCREEN) };
        if width <= 0 || height <= 0 {
            return Err("Résolution Windows indisponible.".into());
        }
        if LEFT_MOUSE_PRESSED.load(Ordering::SeqCst) {
            LAST_MOUSE_HEARTBEAT_MS.store(now_ms(), Ordering::SeqCst);
        }
        let px = (x.round() as i32).clamp(0, width - 1);
        let py = (y.round() as i32).clamp(0, height - 1);
        let moved = unsafe { SetCursorPos(px, py) };
        if moved == 0 {
            return Err("Windows a refusé le déplacement du curseur.".into());
        }
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = (x, y);
        Err("Le contrôle du pointeur est réservé à Windows.".into())
    }
}

#[tauri::command]
fn set_left_mouse_button(app: tauri::AppHandle, pressed: bool) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let result = send_left_button(pressed);
        let _ = append_input_audit(&app, if pressed { "mouse_left_down" } else { "mouse_left_up" });
        result
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = (app, pressed);
        Err("Le contrôle de la souris est réservé à Windows.".into())
    }
}

#[tauri::command]
fn scroll_mouse(delta: i32) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
            SendInput, INPUT, INPUT_0, INPUT_MOUSE, MOUSEEVENTF_WHEEL, MOUSEINPUT,
        };
        let amount = delta.clamp(-1200, 1200);
        if amount == 0 { return Ok(()); }
        let input = INPUT {
            r#type: INPUT_MOUSE,
            Anonymous: INPUT_0 {
                mi: MOUSEINPUT {
                    dx: 0,
                    dy: 0,
                    mouseData: amount as u32,
                    dwFlags: MOUSEEVENTF_WHEEL,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        };
        let sent = unsafe { SendInput(1, &input, std::mem::size_of::<INPUT>() as i32) };
        if sent != 1 {
            return Err("Windows n'a pas accepté le défilement.".into());
        }
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = delta;
        Err("Le défilement natif est réservé à Windows.".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "windows")]
    std::thread::spawn(|| loop {
        std::thread::sleep(Duration::from_millis(100));
        if LEFT_MOUSE_PRESSED.load(Ordering::SeqCst)
            && now_ms().saturating_sub(LAST_MOUSE_HEARTBEAT_MS.load(Ordering::SeqCst)) > 1200
        {
            let _ = send_left_button(false);
        }
    });
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_allowed_app,
            get_screen_size,
            move_mouse,
            set_left_mouse_button,
            scroll_mouse
        ])
        .run(tauri::generate_context!())
        .expect("Erreur lors du démarrage d'OREL");
}
