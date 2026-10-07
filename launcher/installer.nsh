; Extra install/uninstall steps for JumpStart (per-user).

!macro customFinishPage
  ; Finish page with two checkboxes, both checked by default:
  ;   "Run JumpStart" (starts it now, no reboot or sign-in needed) and "Run JumpStart when I sign in".
  Function StartApp
    ${if} ${isUpdated}
      StrCpy $1 "--updated"
    ${else}
      StrCpy $1 ""
    ${endif}
    ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
  FunctionEnd

  !define MUI_FINISHPAGE_RUN
  !define MUI_FINISHPAGE_RUN_TEXT "Start JumpStart now"
  !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !define MUI_FINISHPAGE_SHOWREADME ""
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "Run JumpStart when I sign in"
  !define MUI_FINISHPAGE_SHOWREADME_FUNCTION JumpStartAutostart
  !insertmacro MUI_PAGE_FINISH
!macroend

!macro customInit
  ; upgrading over a running copy: stop the key helper first (the installer itself closes JumpStart.exe)
  nsExec::Exec 'taskkill /F /IM JumpStartKeys.exe'
!macroend

!macro customInstall
  ; Silent installs have no Finish page: sign-in start is on by default there.
  ${If} ${Silent}
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "JumpStart" '"$INSTDIR\JumpStart.exe" --autostart'
  ${EndIf}
!macroend

!ifndef BUILD_UNINSTALLER
Function JumpStartAutostart
  ; exactly one entry, started hidden at sign-in
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "JumpStart" '"$INSTDIR\JumpStart.exe" --autostart'
FunctionEnd
!endif

!macro customUnInstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "JumpStart"
  ; stop the key helper if it is still running (own name, so other AutoHotkey tools are untouched)
  nsExec::Exec 'taskkill /F /IM JumpStartKeys.exe'
  ; remove the user's settings folder
  RMDir /r "$APPDATA\JumpStart"
!macroend
