@echo off
echo 正在清理 iOS 依赖...
cd ios
if exist Pods rmdir /s /q Pods
if exist Podfile.lock del Podfile.lock
if exist build rmdir /s /q build

echo 正在安装 CocoaPods 依赖...
pod install

echo.
echo iOS 依赖安装完成！
echo 现在可以使用 Xcode 打开 ios/LxMusicMobile.xcworkspace 进行编译
pause
