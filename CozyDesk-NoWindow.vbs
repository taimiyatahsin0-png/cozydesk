' Starts CozyDesk without a terminal window (run CozyDesk.bat once first so it installs).
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = fso.GetParentFolderName(WScript.ScriptFullName)
sh.Run "cmd /c npm.cmd start", 0, False
