#![windows_subsystem = "windows"]

use web_view::*;

fn main() {
    static HTML_CONTENT: &str = include_str!("../target/bundle.html");

    web_view::builder()
        .title("Nattoppet Native")
        .content(Content::Html(HTML_CONTENT))
        .size(600, 480)
        .resizable(false)
        .debug(cfg!(debug_assertions))
        .user_data(())
        .invoke_handler(handler)
        .run()
        .unwrap();
}

fn handler(webview: &mut WebView<()>, arg: &str) -> WVResult {
    Ok(())
}
