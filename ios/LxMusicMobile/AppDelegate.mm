#import "AppDelegate.h"
#import <ReactNativeNavigation/ReactNativeNavigation.h>

#import <React/RCTBundleURLProvider.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  [ReactNativeNavigation bootstrapWithBridge:bridge];
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return YES;
}

- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge {
  return [ReactNativeNavigation extraModulesForBridge:bridge];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self getBundleURL];
}
- (NSURL *)getBundleURL
{
#if DEBUG
  // 优先使用本地 bundle 文件（适用于 CI 构建）
  NSURL *bundleURL = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  if (bundleURL) {
    return bundleURL;
  }
  // 如果没有本地 bundle，则使用开发服务器
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
