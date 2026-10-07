#Requires AutoHotkey v2.0
#SingleInstance Force
; Tap left or right Win alone -> shows/hides the launcher (launcher.exe --toggle); Start menu does NOT open.
; Win + any other key still works as normal.
;
; Installed use:  JumpStartKeys.exe "<path to JumpStart.exe>" <launcher process id>
;   - the launcher starts this helper and stops it; if the launcher dies, this helper exits too.
; Dev use (no arguments): runs the electron dev copy in ..\launcher

global launcherCmd, launcherDir := ""
if (A_Args.Length >= 1) {
    launcherCmd := '"' A_Args[1] '"'
    if (A_Args.Length >= 2 && ProcessExist(A_Args[2]))
        SetTimer(() => (ProcessExist(A_Args[2]) ? 0 : ExitApp()), 2000)
} else {
    launcherDir := A_ScriptDir "\..\launcher"
    launcherCmd := '"' launcherDir '\node_modules\electron\dist\electron.exe" "' launcherDir '"'
}
A_IconHidden := A_Args.Length >= 1   ; installed: no extra tray icon, the launcher has its own

~LWin:: OnWin("LWin")
~RWin:: OnWin("RWin")

OnWin(key) {
    ; Send an unused key while Win is down: this stops Windows opening Start on release.
    Send "{Blind}{vkE8}"
    ; Watch for any other key pressed while Win is held.
    ih := InputHook("L0 V")
    ih.KeyOpt("{All}", "N")
    ih.Start()
    KeyWait key          ; waits for release; also stops auto-repeat from re-triggering
    ih.Stop()
    if (ih.EndKey = "")          ; no other key was pressed => a pure tap
        Run(launcherCmd " --toggle", launcherDir, "Hide")
}
