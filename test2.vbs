Dim shell
Set shell = CreateObject("WScript.Shell")
On Error Resume Next
shell.Run """C:\Users\PC\Downloads\ThienPhatTechToolkit_v1.2.8.exe"""
If Err.Number <> 0 Then WScript.Echo Err.Description
On Error GoTo 0
