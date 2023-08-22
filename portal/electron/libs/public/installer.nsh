!macro customHeader
    RequestExecutionLevel admin
!macroend
!macro preInit
    SetRegView 64
	WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\CellyticsNK"
	WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\CellyticsNK"
	SetRegView 32
	WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\CellyticsNK"
	WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\CellyticsNK"
!macroend

!macro customInstall
    File /r "${BUILD_RESOURCES_DIR}\*.*"
    ExecWait '"C:\CellyticsNK\Driver_VEZU_DShow_for_win10_only.exe"'
    ExecWait '"C:\CellyticsNK\FilterPackage.exe"'
    ExecWait '"C:\CellyticsNK\setup.exe"'
    ; File /oname=$INSTDIR\Driver_VEZU_DShow_for_win10_only.exe "${BUILD_RESOURCES_DIR}\Driver_VEZU_DShow_for_win10_only.exe"
    ; ExecWait '"C:\CellyticsNK\Driver_VEZU_DShow_for_win10_only.exe"'
    ; File /oname=$INSTDIR\FilterPackage.exe "${BUILD_RESOURCES_DIR}\FilterPackage.exe"
    ; ExecWait '"C:\CellyticsNK\FilterPackage.exe"'
    ; File /oname=$INSTDIR\Cellytics_filter_setup.msi "${BUILD_RESOURCES_DIR}\Cellytics_filter_setup.msi"
    ; File /oname=$INSTDIR\setup.exe "${BUILD_RESOURCES_DIR}\setup.exe"
    ; ExecWait '"C:\CellyticsNK\setup.exe"'
    ; File /oname=$INSTDIR\cmos /r "${BUILD_RESOURCES_DIR}\cmos"
!macroend
