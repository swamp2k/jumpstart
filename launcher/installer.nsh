; Extra install/uninstall steps for JumpStart (per-user).
!macro customInstall
  ; one autostart entry, started hidden at login
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "JumpStart" '"$INSTDIR\JumpStart.exe" --autostart'
!macroend

!macro customUnInstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "JumpStart"
  ; stop the key helper if it is still running (own name, so other AutoHotkey tools are untouched)
  nsExec::Exec 'taskkill /F /IM JumpStartKeys.exe'
  ; remove the user's settings folder
  RMDir /r "$APPDATA\JumpStart"
!macroend
